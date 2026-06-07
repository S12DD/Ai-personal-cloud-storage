import pytest
from fastapi.testclient import TestClient
from backend.main import app, database

client = TestClient(app)

def test_register_and_login():
    # register a unique user
    import uuid
    uname = 'u'+uuid.uuid4().hex[:6]
    resp = client.post('/auth/register', json={'username': uname, 'email': uname+'@test.com', 'password': 'pass123'})
    assert resp.status_code == 200
    # login
    resp2 = client.post('/auth/login', json={'email': uname+'@test.com', 'password': 'pass123'})
    assert resp2.status_code == 200
    assert 'token' in resp2.json()
