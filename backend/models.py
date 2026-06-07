from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    files = relationship('File', back_populates='owner')

class Folder(Base):
    __tablename__ = 'folders'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default='root')
    parent_id = Column(Integer, nullable=True)

class File(Base):
    __tablename__ = 'files'

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, index=True)
    path = Column(String, unique=True)
    size = Column(Integer)
    mime_type = Column(String)

    owner_id = Column(Integer, ForeignKey('users.id'))
    folder_id = Column(Integer, ForeignKey('folders.id'), nullable=True)

    upload_date = Column(DateTime, default=datetime.utcnow)
    file_metadata = Column(JSON, default={})

    owner = relationship('User', back_populates='files')
    folder = relationship('Folder')

class ShareLink(Base):
    __tablename__ = 'sharelinks'
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer)
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
