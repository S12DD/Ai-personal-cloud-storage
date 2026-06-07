# Quick init to create DB and an example user
from backend import database, models, auth, main
database.init_db()
from backend.database import SessionLocal
db = SessionLocal()
from backend.models import User
if not db.query(User).filter(User.email=='demo@example.com').first():
    u = User(username='demo', email='demo@example.com', password_hash=auth.hash_password('demo123'))
    db.add(u); db.commit()
    print('Created demo user: demo@example.com / demo123')
else:
    print('Demo user exists')
