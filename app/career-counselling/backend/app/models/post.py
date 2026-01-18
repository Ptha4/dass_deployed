from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.user import UserSearchResponse


class PostBase(BaseModel):
    content: str
    expertId: str


class Post(PostBase):
    postId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    likes: int = 0
    likedBy: List[str] = []  # List of user IDs who have liked the post
    views: int = 0  # Track the number of views for analytics


class PostResponse(Post):
    expertDetails: dict  # Will contain expert name and other details


class PostCreate(PostBase):
    pass


class PostLike(BaseModel):
    postId: str
    userId: str
