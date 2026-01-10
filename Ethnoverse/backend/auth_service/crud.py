from sqlalchemy.orm import Session
import models
import schemas
import security


def get_user_by_email(db: Session, email: str):
    """Fetches a user by their email address."""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    """Fetches a user by their username."""
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Creates a new user in the database."""
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Community CRUD ---
def get_community(db: Session, community_id: int):
    return db.query(models.Community).filter(models.Community.id == community_id).first()

def get_community_by_name(db: Session, name: str):
    return db.query(models.Community).filter(models.Community.name == name).first()

def get_communities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Community).offset(skip).limit(limit).all()

def create_community(db: Session, community: schemas.CommunityCreate, owner_id: int):
    db_community = models.Community(**community.model_dump(), owner_id=owner_id)
    db.add(db_community)
    db.commit()
    db.refresh(db_community)
    return db_community

def update_community(db: Session, community_id: int, updates: schemas.CommunityUpdate):
    db_community = get_community(db, community_id)
    if db_community:
        if updates.name is not None: db_community.name = updates.name
        if updates.description is not None: db_community.description = updates.description
        if updates.profile_image is not None: db_community.profile_image = updates.profile_image
        if updates.banner_image is not None: db_community.banner_image = updates.banner_image
        db.commit()
        db.refresh(db_community)
    return db_community

def create_community_rule(db: Session, rule: schemas.RuleCreate, community_id: int):
    db_rule = models.CommunityRule(**rule.model_dump(), community_id=community_id)
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

def get_community_rules(db: Session, community_id: int):
    return db.query(models.CommunityRule).filter(models.CommunityRule.community_id == community_id).all()

def delete_community(db: Session, community_id: int):
    community = db.query(models.Community).filter(models.Community.id == community_id).first()
    if community:
        db.delete(community)
        db.commit()
        return True
    return False

def is_authorized_to_manage_rules(db: Session, user_id: int, community_id: int):
    community = get_community(db, community_id)
    if not community:
        return False
    if community.owner_id == user_id:
        return True
    
    membership = db.query(models.Membership).filter(
        models.Membership.user_id == user_id,
        models.Membership.community_id == community_id
    ).first()
    
    if membership and membership.role in ["admin", "moderator"]:
        return True
    
    return False

def get_community_rule(db: Session, rule_id: int):
    return db.query(models.CommunityRule).filter(models.CommunityRule.id == rule_id).first()

def update_community_rule(db: Session, rule_id: int, rule_update: schemas.RuleUpdate):
    db_rule = get_community_rule(db, rule_id)
    if db_rule:
        if rule_update.rule_text is not None:
            db_rule.rule_text = rule_update.rule_text
        if rule_update.action is not None:
            db_rule.action = rule_update.action
        db.commit()
        db.refresh(db_rule)
    return db_rule

def delete_community_rule(db: Session, rule_id: int):
    db_rule = get_community_rule(db, rule_id)
    if db_rule:
        db.delete(db_rule)
        db.commit()
        return True
    return False

# --- Membership CRUD ---
def get_community_members(db: Session, community_id: int):
    """Returns a list of (Membership, User) joined rows for a community."""
    return (
        db.query(models.Membership, models.User)
        .join(models.User, models.Membership.user_id == models.User.id)
        .filter(models.Membership.community_id == community_id)
        .all()
    )

def join_community(db: Session, user_id: int, community_id: int, role: str = "member"):
    """Adds a user to a community if not already a member."""
    existing = db.query(models.Membership).filter(
        models.Membership.user_id == user_id,
        models.Membership.community_id == community_id
    ).first()
    if existing:
        return existing
    membership = models.Membership(user_id=user_id, community_id=community_id, role=role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

def leave_community(db: Session, user_id: int, community_id: int):
    """Removes a user from a community."""
    membership = db.query(models.Membership).filter(
        models.Membership.user_id == user_id,
        models.Membership.community_id == community_id
    ).first()
    if membership:
        db.delete(membership)
        db.commit()
        return True
    return False