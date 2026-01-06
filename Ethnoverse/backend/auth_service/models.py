from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, index=True) # owner is a user
    is_public = Column(Integer, default=1) # 1=True, 0=False (sqlite boolean)
    profile_image = Column(String, nullable=True)
    banner_image = Column(String, nullable=True)
    
    rules = relationship("CommunityRule", back_populates="community", cascade="all, delete-orphan")

class CommunityRule(Base):
    __tablename__ = "community_rules"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), index=True)
    rule_text = Column(String, nullable=False)
    action = Column(String, default="flag") # flag, block, etc.

    community = relationship("Community", back_populates="rules")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    community_id = Column(Integer, index=True)
    role = Column(String, default="member") # member, moderator, admin