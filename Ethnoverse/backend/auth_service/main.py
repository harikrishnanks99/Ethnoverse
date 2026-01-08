from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud
import models
import schemas
import security
from database import SessionLocal, engine, init_db

# Initialize the database and create tables
init_db()

app = FastAPI(
    description="Microservice for Authentication and Community Management.",
    version="1.1.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev, or specific like ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    user_id = security.decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id

# --- Auth Endpoints ---

@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
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

# --- Community Endpoints ---

@app.post("/communities/", response_model=schemas.CommunityOut, tags=["Community"])
def create_community(
    community: schemas.CommunityCreate, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    db_community = crud.get_community_by_name(db, name=community.name)
    if db_community:
        raise HTTPException(status_code=400, detail="Community already exists")
    return crud.create_community(db=db, community=community, owner_id=user_id)

@app.get("/communities/", response_model=List[schemas.CommunityOut], tags=["Community"])
def list_communities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_communities(db, skip=skip, limit=limit)

@app.delete("/communities/{community_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Community"])
def delete_community(community_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    # In a real app, check if user is owner/admin
    success = crud.delete_community(db, community_id)
    if not success:
        raise HTTPException(status_code=404, detail="Community not found")
    return

@app.post("/communities/{community_id}/rules", response_model=schemas.RuleOut, tags=["Community"])
def create_rule(
    community_id: int, 
    rule: schemas.RuleCreate, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if not crud.is_authorized_to_manage_rules(db, user_id, community_id):
        raise HTTPException(status_code=403, detail="Not authorized to manage community rules")
        
    return crud.create_community_rule(db=db, rule=rule, community_id=community_id)

@app.get("/communities/{community_id}/rules", response_model=List[schemas.RuleOut], tags=["Community"])
def list_rules(community_id: int, db: Session = Depends(get_db)):
    return crud.get_community_rules(db=db, community_id=community_id)

@app.put("/communities/{community_id}/rules/{rule_id}", response_model=schemas.RuleOut, tags=["Community"])
def update_rule(
    community_id: int,
    rule_id: int,
    rule_update: schemas.RuleUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if not crud.is_authorized_to_manage_rules(db, user_id, community_id):
        raise HTTPException(status_code=403, detail="Not authorized to manage community rules")
    
    db_rule = crud.get_community_rule(db, rule_id)
    if not db_rule or db_rule.community_id != community_id:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    updated_rule = crud.update_community_rule(db, rule_id, rule_update)
    return updated_rule

@app.delete("/communities/{community_id}/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Community"])
def delete_rule(
    community_id: int,
    rule_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if not crud.is_authorized_to_manage_rules(db, user_id, community_id):
        raise HTTPException(status_code=403, detail="Not authorized to manage community rules")
        
    db_rule = crud.get_community_rule(db, rule_id)
    if not db_rule or db_rule.community_id != community_id:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    crud.delete_community_rule(db, rule_id)
    return

@app.put("/communities/{community_id}", response_model=schemas.CommunityOut, tags=["Community"])
def update_community(
    community_id: int,
    updates: schemas.CommunityUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Check if user is owner or admin
    if not crud.is_authorized_to_manage_rules(db, user_id, community_id):
         raise HTTPException(status_code=403, detail="Not authorized to update this community")
    
    db_community = crud.update_community(db, community_id, updates)
    if not db_community:
         raise HTTPException(status_code=404, detail="Community not found")
         
    return db_community

@app.get("/communities/{community_id}/members", response_model=List[schemas.MemberOut], tags=["Community"])
def list_members(community_id: int, db: Session = Depends(get_db)):
    rows = crud.get_community_members(db, community_id)
    return [
        schemas.MemberOut(
            membership_id=membership.id,
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=membership.role,
        )
        for membership, user in rows
    ]

@app.post("/communities/{community_id}/join", tags=["Community"])
def join_community(
    community_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    membership = crud.join_community(db, user_id=user_id, community_id=community_id)
    return {"message": "Joined successfully", "role": membership.role}

@app.delete("/communities/{community_id}/leave", tags=["Community"])
def leave_community(
    community_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    success = crud.leave_community(db, user_id=user_id, community_id=community_id)
    if not success:
        raise HTTPException(status_code=404, detail="Membership not found")
    return {"message": "Left community"}

@app.get("/", tags=["Health Check"])
def root():
    return {"message": "Ethnoverse Core Service (Auth + Community) is running."}