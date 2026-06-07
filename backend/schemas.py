from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    class Config:
        orm_mode = True

class FileOut(BaseModel):
    id: int
    file_name: str
    size: int
    mime_type: str
    upload_date: datetime
    metadata: Optional[Any] = None
    class Config:
        orm_mode = True
