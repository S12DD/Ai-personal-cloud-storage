# Backend (FastAPI) - Notes

- Default DB is SQLite (app.db). To use Postgres, set DATABASE_URL in backend/.env
- Start server:
  - pip install -r requirements.txt
  - uvicorn main:app --reload
- Swagger UI: http://localhost:8000/docs
- For async worker (Celery) install redis & run:
  - redis-server
  - celery -A worker.tasks worker --loglevel=info
