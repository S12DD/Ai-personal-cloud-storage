# Personal Cloud Storage - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Clone or enter the project directory
cd personal_cloud_ai

# Run automated setup
chmod +x setup.sh
./setup.sh
```

This will:

- Create a Python virtual environment
- Install all backend dependencies
- Initialize the SQLite database with demo user
- Install frontend dependencies
- Build the frontend

### Step 2: Start the Backend

```bash
# Terminal 1
cd backend
source ../.venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```
Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Start the Frontend (Optional but Recommended)

```bash
# Terminal 2
cd frontend
npm run dev
```

You should see:

```
Local: http://localhost:5173/
```

### Step 4: Access the Application

- **Frontend Web UI**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

### Step 5: Login with Demo Account

Use the pre-configured demo user:

- **Email**: demo@example.com
- **Password**: demo123

## 📋 Available Endpoints

### Authentication

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","email":"user@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

### Files

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# List files
curl -X GET http://localhost:8000/files/list \
  -H "Authorization: Bearer $TOKEN"

# Upload file
curl -X POST http://localhost:8000/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.txt"

# Download file
curl -X GET http://localhost:8000/files/download/{file_id} \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.txt

# Delete file
curl -X DELETE http://localhost:8000/files/{file_id} \
  -H "Authorization: Bearer $TOKEN"

# Get file metadata
curl -X GET http://localhost:8000/files/{file_id}/metadata \
  -H "Authorization: Bearer $TOKEN"

# Share file (1 hour expiry)
curl -X POST http://localhost:8000/files/{file_id}/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":3600}'

# Access shared file (no auth needed)
curl -X GET http://localhost:8000/share/{share_token}
```

## 🎯 Common Tasks

### Upload a Test File

```bash
echo "This is a test file" > test.txt
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -X POST http://localhost:8000/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt"
```

### Switch to PostgreSQL

1. Install PostgreSQL and create a database:

   ```bash
   createdb personal_cloud
   ```

2. Update `backend/.env`:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/personal_cloud
   ```

3. Run migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Use Docker

```bash
# Start all services
docker-compose up

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

## 🔧 Troubleshooting

### Backend won't start

- Check if port 8000 is already in use: `lsof -i :8000`
- Ensure Python 3.8+: `python --version`
- Reinstall dependencies: `pip install -r backend/requirements.txt --upgrade`

### Frontend won't start

- Check Node.js version: `node --version` (need 14+)
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `cd frontend && npm install`

### Database errors

- Delete old database: `rm backend/app.db`
- Reinitialize: `python init_db.py`

### CORS errors

- Make sure frontend and backend are on the correct URLs
- Frontend default: http://localhost:5173
- Backend default: http://localhost:8000

## 📚 Learn More

- [Full README](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [API Documentation](http://localhost:8000/docs)

## 🎉 Next Steps

1. **Customize**: Edit components in `frontend/src/components/`
2. **Extend**: Add new API endpoints in `backend/main.py`
3. **Deploy**: Use Docker or deploy to cloud platform
4. **Enhance**: Add features like folders, sharing controls, etc.

## 💡 Tips

- The frontend is automatically rebuilt after changes to React components
- API changes require backend restart
- Use `npm run build` to create optimized production build
- Check `backend/uploads/` for uploaded files

---

Need help? Check the main README.md or create an issue!
