from pydantic import BaseModel, EmailStr

# Schema for user registration
from pydantic import field_validator

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator('password', 'confirm_password')
    def validate_password(cls, v):
        # Convert to bytes to check exact byte length as required by bcrypt
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            raise ValueError('password must be 72 bytes or fewer')
        return v

# Schema for user data returned by the API
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

# Schema for user login
class UserLogin(BaseModel):
    username_or_email: str
    password: str

# Schema for the token response
class Token(BaseModel):
    access_token: str
    token_type: str