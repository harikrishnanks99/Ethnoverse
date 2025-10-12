from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
from dotenv import load_dotenv

# --- Load Configuration from Environment ---
load_dotenv()
try:
    JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
    ALGORITHM = os.environ['ALGORITHM']
except KeyError as e:
    raise SystemExit(f"Error: Missing required JWT environment variable: {e}")


# This scheme will look for a token in the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes the JWT token to get the current user's data.
    This function will be used as a dependency in protected endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        username: str = payload.get("username")
        if user_id is None or username is None:
            raise credentials_exception
        return {"user_id": user_id, "username": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception