# Celery tasks (requires redis to run). Also kept simple so you can run analyze_and_update in main.py as fallback.
from celery import Celery
import os, time
from backend import database, models, ai_utils

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
cel = Celery('worker', broker=REDIS_URL, backend=REDIS_URL)

@cel.task()
def analyze_file_task(file_id, path):
    db = database.SessionLocal()
    try:
        f = db.query(models.File).get(file_id)
        if not f:
            return {'error':'file not found'}
        if f.mime_type.startswith('image/'):
            res = ai_utils.analyze_image(path)
            metadata = {'tags': res.get('tags',[]), 'ocr': res.get('ocr',''), 'status':'analyzed'}
        else:
            try:
                with open(path,'r',encoding='utf-8') as fh:
                    txt = fh.read()
            except Exception:
                txt = ''
            if txt:
                res = ai_utils.analyze_text(txt)
                metadata = {'summary': res.get('summary'),'keywords': res.get('keywords'),'status':'analyzed'}
            else:
                metadata = {'status':'no_text'}
        f.metadata = metadata
        db.add(f); db.commit()
        return {'ok':True}
    finally:
        db.close()
