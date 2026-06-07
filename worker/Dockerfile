FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend /app/backend
COPY worker /app/worker
CMD [ "celery", "-A", "worker.tasks", "worker", "--loglevel=info" ]
