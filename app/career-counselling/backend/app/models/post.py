from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class PostBase(BaseModel):
    title: str
    content: str
    communityId: str     # all posts now belong to a community
    authorId: str        # userId of the post author (any user, not just experts)


class Post(PostBase):
    postId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    likes: int = 0
    likedBy: List[str] = []
    views: int = 0
    tags: List[str] = []


class PostResponse(Post):
    authorName: Optional[str] = None
    authorInitials: Optional[str] = None
    communityName: Optional[str] = None
    communityDisplayName: Optional[str] = None
    commentsCount: Optional[int] = 0


class PostCreate(BaseModel):
    title: str
    content: str
    communityId: str
    tags: Optional[List[str]] = []


class PostLike(BaseModel):
    postId: str
    userId: str
