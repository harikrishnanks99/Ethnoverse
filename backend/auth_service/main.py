from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import crud
import models
import schemas
import security
from database import SessionLocal, engine, init_db

# Initialize the database and create tables
init_db()

app = FastAPI(
    title="Authentication Service",
    description="A microservice to handle user authentication and JWT generation.",
    version="1.0.0"
)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Handles user registration.
    """
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken.")

    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token, tags=["Auth"])
def login_for_access_token(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Handles user login and returns a JWT.
    """
    user = crud.get_user_by_username(db, username=form_data.username_or_email)
    if not user:
        user = crud.get_user_by_email(db, email=form_data.username_or_email)
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, email, or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(
        data={"sub": str(user.id), "username": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/", tags=["Health Check"])
def root():
    return {"message": "Authentication Service is running."}