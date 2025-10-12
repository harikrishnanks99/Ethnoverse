from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os

# --- Load Configuration from Environment ---
try:
    JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
    ALGORITHM = os.environ['ALGORITHM']
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'])
except (KeyError, ValueError) as e:
    raise SystemExit(f"Error: Missing or invalid JWT environment variable: {e}")


# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    default="bcrypt",
    bcrypt__default_rounds=12,
    deprecated="auto"
)

def verify_password(plain_password, hashed_password):
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hashes a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt