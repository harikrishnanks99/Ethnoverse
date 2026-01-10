from pydantic import BaseModel, EmailStr
from pydantic import field_validator

# Schema for user registration
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

# --- Community Schemas ---
class CommunityBase(BaseModel):
    name: str
    description: str | None = None
    is_public: bool = True
    profile_image: str | None = None
    banner_image: str | None = None

class CommunityUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    profile_image: str | None = None
    banner_image: str | None = None

class CommunityCreate(CommunityBase):
    pass

class CommunityOut(CommunityBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class RuleCreate(BaseModel):
    rule_text: str
    action: str = "flag"

class RuleUpdate(BaseModel):
    rule_text: str | None = None
    action: str | None = None

class RuleOut(RuleCreate):
    id: int
    community_id: int
    class Config:
        from_attributes = True

# --- Membership Schemas ---
class MemberOut(BaseModel):
    membership_id: int
    user_id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True