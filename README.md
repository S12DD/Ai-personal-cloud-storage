# Personal Cloud Storage with AI (Free Stack)

A full-stack personal cloud storage application with AI-powered file analysis. Built with FastAPI, React, SQLAlchemy, and HuggingFace transformers.

## Features

✨ **Core Features**
## Features

- 🔐 User Authentication with JWT Tokens
- 📁 File Upload, Download and Management
- 📂 Folder Creation and Organization
- 🎯 Drag & Drop File Movement Between Folders
- 👀 File Preview for Images, PDFs and Text Files
- ✏️ File Rename Functionality
- 🔗 Shareable File Links with Expiration
- 🤖 AI-Powered PDF Summarization
- 🏷️ Keyword Extraction from Documents
- 🖼️ OCR Text Extraction from Images
- 📊 File Metadata and AI Insights
- 🔍 File Search Functionality
- 🎨 Responsive UI with Tailwind CSS
- 📱 Mobile-Friendly Design
- 💾 SQLite Database Integration

✨ **Backend Features**
- REST API with FastAPI
- SQLAlchemy ORM with SQLite/PostgreSQL support
- Async background tasks with Celery + Redis (optional)
- JWT authentication with bcrypt password hashing
- Alembic database migrations

✨ **Frontend Features**
- React with Vite
- TailwindCSS for styling
- Modern components (Login, Register, File Explorer, Upload)
- Grid and list view modes
- File sharing with copy-to-clipboard
- Upload progress tracking

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm/yarn

### Setup (Automated)

```bash
# Run the setup script
chmod +x setup.sh
./setup.sh
```

### Setup (Manual)

1. **Backend Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate

   # Install dependencies
   pip install -r backend/requirements.txt

   # Initialize database with demo user
   python init_db.py
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
source ../.venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

## Demo Credentials

```
Email: demo@example.com
Password: demo123
```

## API Documentation

Once the backend is running, access the interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
personal_cloud_ai/
├── backend/                    # FastAPI application
│   ├── main.py                # API endpoints
│   ├── models.py              # Database models
│   ├── schemas.py             # Pydantic schemas
│   ├── auth.py                # JWT authentication
│   ├── ai_utils.py            # AI/ML utilities
│   ├── database.py            # Database setup
│   ├── requirements.txt        # Python dependencies
│   ├── alembic/               # Database migrations
│   └── tests/                 # Unit tests
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── App.jsx            # Main app component
│   │   └── styles.css         # Tailwind styles
│   ├── package.json
│   └── vite.config.js
├── worker/                     # Celery worker (optional)
├── init_db.py                 # Database initialization
├── docker-compose.yml         # Docker setup
└── setup.sh                   # Automated setup script
```

## Database Configuration

### SQLite (Default)
No additional setup needed. Database file: `app.db`

### PostgreSQL
1. Update `DATABASE_URL` in `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/personal_cloud
   ```

2. Run migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

## Environment Variables

Create `backend/.env`:
```env
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./app.db
FILES_DIR=./uploads
```

## Using Celery (Optional)

For async file analysis with Redis:

1. Start Redis:
   ```bash
   redis-server
   ```

2. Start Celery worker:
   ```bash
   celery -A worker.tasks worker --loglevel=info
   ```

## Docker Deployment

```bash
docker-compose up
```

This will start:
- Backend API on port 8000
- Redis on port 6379
- Celery worker

## File Analysis Features

### Image Files
- 📸 Tesseract OCR for text extraction
- 🏷️ Auto-tagging based on filename
- 📝 OCR text metadata storage

### Text Files
- 📊 HuggingFace summarization
- 🔑 Automatic keyword extraction
- 📈 Content analysis

## Testing

```bash
cd backend
pytest tests/
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Files
- `GET /files/list` - List all user files
- `POST /files/upload` - Upload new file
- `GET /files/download/{file_id}` - Download file
- `GET /files/{file_id}/metadata` - Get file metadata
- `DELETE /files/{file_id}` - Delete file
- `PUT /files/{file_id}/rename` - Rename file
- `POST /files/{file_id}/share` - Create share link
- `GET /share/{token}` - Access shared file

## Frontend Components

### Login
- Email/password authentication
- Demo credentials display
- Link to registration

### Register
- User registration form
- Password validation
- Auto-login on success

### File Upload
- Drag & drop support
- Progress tracking
- File type validation

### File Explorer
- Grid and list view modes
- File operations (download, delete, rename, share)
- Status indicators
- File size formatting

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r backend/requirements.txt --upgrade

# Check if port 8000 is in use
lsof -i :8000
```

### Frontend build fails
```bash
cd frontend
npm install  # Reinstall dependencies
npm run build  # Try building again
```

### Database initialization fails
```bash
# Delete old database
rm backend/app.db

# Reinitialize
python init_db.py
```

## Performance Optimization

### For Production
1. Set `DATABASE_URL` to PostgreSQL
2. Use Redis with Celery for async tasks
3. Enable CORS properly (set `allow_origins` to specific domains)
4. Set `SECRET_KEY` to a strong random value
5. Build frontend for production and serve via nginx

### For Development
- Use `--reload` flag with uvicorn for hot reloading
- Use `npm run dev` for frontend hot reloading

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

## Extras

- ✅ Alembic database migration system
- ✅ Pytest unit tests
- ✅ GitHub Actions CI/CD
- ✅ Docker support
- ✅ Comprehensive API documentation
- ✅ Demo user for testing
