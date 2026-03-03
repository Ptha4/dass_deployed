from pydantic import BaseModel
from typing import List, Optional
from app.models.user import UserBase, UserSearchResponse
from datetime import datetime


class ExpertBase(BaseModel):
    calendarEmbedUrl: str
    meetingCost: float
    currentPosition: str
    organization: str
    bio: str
    education: List[dict]  # List of { degree, institution, year }
    socialLinks: dict  # { linkedin, twitter, etc }
    userId: str
    rating: float = 0
    available: bool = True
    studentsGuided: int = 0  # Default to 0 students guided


class Expert(ExpertBase):
    createdAt: datetime


class ExpertResponse(Expert):
    expertID: str
    userDetails: UserBase


class ExpertSearchResponse(BaseModel):
    expertID: str
    userDetails: UserSearchResponse


class ExpertUpdate(BaseModel):
    """Model for updating expert profiles - all fields are optional for partial updates"""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    calendarEmbedUrl: Optional[str] = None
    meetingCost: Optional[float] = None
    currentPosition: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    available: Optional[bool] = None
    studentsGuided: Optional[int] = None
