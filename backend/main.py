import os, shutil, uuid
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import database, models, schemas, auth, ai_utils
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

database.init_db()
app = FastAPI(title='Personal Cloud Storage (Demo)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

FILES_DIR = os.getenv('FILES_DIR', './uploads')
os.makedirs(FILES_DIR, exist_ok=True)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Simple Auth endpoints (register/login) ---
@app.post('/auth/register')
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter((models.User.email==user.email)|(models.User.username==user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail='User exists')
    hashed = auth.hash_password(user.password)
    u = models.User(username=user.username, email=user.email, password_hash=hashed)
    db.add(u); db.commit(); db.refresh(u)
    return {'message':'User registered successfully', 'userId': u.id}

@app.post('/auth/login')
def login(form: dict, db: Session = Depends(get_db)):
    email = form.get('email'); password = form.get('password')
    user = db.query(models.User).filter(models.User.email==email).first()
    if not user or not auth.verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = auth.create_access_token({'user_id': user.id, 'username': user.username})
    return {'token': token, 'userId': user.id}

# Simple dependency to get current user from Bearer token
# Also used by preview/download with ?token=... because <iframe>, <img>, and window.open
# cannot send Authorization headers.
def get_user_from_token_value(token_value: str, db: Session):
    if not token_value:
        raise HTTPException(status_code=401, detail='Missing authorization header')

    auth_token = token_value.strip()
    if auth_token.lower().startswith('bearer '):
        auth_token = auth_token[7:]

    payload = auth.decode_token(auth_token)
    if not payload:
        raise HTTPException(status_code=401, detail='Invalid token')

    user = db.query(models.User).get(payload.get('user_id'))
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token user')

    return user


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    return get_user_from_token_value(authorization, db)

# --- File APIs ---
@app.post('/files/upload')
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...), folderId: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # save file locally
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    dest = os.path.join(FILES_DIR, filename)
    with open(dest, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    size = os.path.getsize(dest)
    new = models.File(
    file_name=file.filename,
    path=dest,
    size=size,
    mime_type=file.content_type,
    owner_id=current_user.id,
    folder_id=folderId
    )
    db.add(new); db.commit(); db.refresh(new)
    # enqueue background analysis (fallback to BackgroundTasks if no Celery)
    background_tasks.add_task(analyze_and_update, new.id, dest)
    return {'fileId': new.id, 'fileName': new.file_name, 'fileSize': new.size, 'mimeType': new.mime_type, 'uploadDate': new.upload_date.isoformat(), 'ownerId': current_user.id, 'status':'uploaded'}

def analyze_and_update(file_id: int, path: str):
    # simple analyzer: uses ai_utils
    from sqlalchemy.orm import Session
    db = database.SessionLocal()
    try:
        file = db.query(models.File).get(file_id)
        if not file:
            return
        if file.mime_type.startswith('image/'):
            result = ai_utils.analyze_image(path)
            metadata = {'tags': result.get('tags',[]), 'ocr': result.get('ocr',''), 'status':'analyzed'}
        else:
            if file.mime_type and 'pdf' in file.mime_type.lower():
                txt = ai_utils.extract_pdf_text(path)
            else:
                try:
                    with open(path, 'r', encoding='utf-8') as fh:
                        txt = fh.read()
                except Exception:
                    txt = ''
            if txt:
                result = ai_utils.analyze_text(txt)
                metadata = {'summary': result.get('summary'), 'keywords': result.get('keywords'), 'status':'analyzed'}
            else:
                metadata = {'status':'no_text'}
        file.file_metadata = metadata
        db.add(file); db.commit()
    finally:
        db.close()

@app.get('/files/list')

def list_files(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    files = db.query(models.File).filter(models.File.owner_id == current_user.id).all()

    return {
        'files': [
            {
                'fileId': f.id,
                'fileName': f.file_name,
                'fileSize': f.size,
                'mimeType': f.mime_type,
                'uploadDate': f.upload_date.isoformat(),
                'folderId': f.folder_id,
                'ai_tags': f.file_metadata.get('tags') if f.file_metadata else None,
                'status': f.file_metadata.get('status') if f.file_metadata else 'uploaded'
            }
            for f in files
        ]
    }

@app.get('/files/download/{file_id}')
def download_file(
    file_id: int,
    token: str = None,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    # Supports Authorization header and ?token=... for browser downloads.
    current_user = get_user_from_token_value(authorization or token, db)
    file = db.query(models.File).get(file_id)
    if not file or file.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail='File not found')

    return FileResponse(
        path=file.path,
        filename=file.file_name,
        media_type=file.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file.file_name}"'}
    )


@app.get('/files/preview/{file_id}')
def preview_file(
    file_id: int,
    token: str = None,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    # Supports Authorization header and ?token=... for iframe/image preview.
    current_user = get_user_from_token_value(authorization or token, db)
    file = db.query(models.File).get(file_id)
    if not file or file.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail='File not found')

    return FileResponse(
        path=file.path,
        media_type=file.mime_type,
        headers={"Content-Disposition": f'inline; filename="{file.file_name}"'}
    )

@app.get('/files/{file_id}/metadata')
def get_metadata(file_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    file = db.query(models.File).get(file_id)
    if not file or file.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail='File not found')
    return {'fileId': file.id, 'metadata': file.file_metadata or {}, 'status': file.file_metadata.get('status') if file.file_metadata else 'uploaded'}

@app.delete('/files/{file_id}')
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    file = db.query(models.File).get(file_id)
    if not file or file.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail='File not found')
    try:
        if os.path.exists(file.path):
            os.remove(file.path)
    except Exception:
        pass
    db.delete(file); db.commit()
    return {'message':'File deleted successfully'}

@app.put('/files/{file_id}/rename')
def rename_file(file_id: int, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_name = payload.get('newName')
    file = db.query(models.File).get(file_id)
    if not file or file.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail='File not found')
    file.file_name = new_name
    db.add(file); db.commit()
    return {'message':'File renamed successfully'}

# share link (basic, no token crypto for demo)
@app.post('/files/{file_id}/share')
def share_file(file_id: int, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    expires_in = int(payload.get('expiresIn', 3600))
    import secrets, datetime
    token = secrets.token_urlsafe(16)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)
    sl = models.ShareLink(file_id=file_id, token=token, expires_at=expires_at)
    db.add(sl); db.commit(); db.refresh(sl)
    share_url = f"/share/{token}"
    return {'shareUrl': share_url, 'expiresAt': expires_at.isoformat()}

@app.post('/folders/create')
def create_folder(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    folder = models.Folder(
        name=payload.get("name", "New Folder")
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return {
        "folderId": folder.id,
        "name": folder.name
    }


@app.get('/folders/list')
def list_folders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    folders = db.query(models.Folder).all()

    return {
        "folders": [
            {
                "folderId": f.id,
                "name": f.name
            }
            for f in folders
        ]
    }

@app.put('/files/{file_id}/move')
def move_file(
    file_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    file = db.query(models.File).get(file_id)

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file.folder_id = payload.get("folderId")

    db.commit()

    return {"message": "File moved successfully"}

@app.get('/share/{token}')
def access_shared(token: str, db: Session = Depends(get_db)):
    sl = db.query(models.ShareLink).filter(models.ShareLink.token==token).first()
    if not sl:
        raise HTTPException(status_code=404, detail='Share not found')
    import datetime
    if sl.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=410, detail='Link expired')
    f = db.query(models.File).get(sl.file_id)
    if not f:
        raise HTTPException(status_code=404, detail='File not found')
    return {'fileId': f.id, 'fileName': f.file_name, 'downloadUrl': f'/files/download/{f.id}'}
