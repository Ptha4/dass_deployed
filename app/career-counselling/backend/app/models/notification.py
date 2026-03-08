from typing import Optional
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from app.models.base import DBModelMixin


class NotificationType(str, Enum):
    NEW_POST = "new_post"
    NEW_VIDEO = "new_video"
    NEW_BLOG = "new_blog"
    LIKE_POST = "like_post"
    COMMENT = "comment"
    FOLLOW = "follow"
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_REMINDER = "meeting_reminder"
    REFUND = "refund"


class NotificationBase(BaseModel):
    """Base notification model with essential fields."""
    targetUserId: str  # ID of user who should receive the notification
    sourceUserId: str  # ID of user/entity who triggered the notification
    type: NotificationType
    content: str  # Brief notification message
    # ID of related entity (post, comment, etc.)
    referenceId: Optional[str] = None
    # Type of referenced entity (post, comment, etc.)
    referenceType: Optional[str] = None
    read: bool = False
    # ID of expert involved in the notification (if applicable)
    expertId: Optional[str] = None


class Notification(NotificationBase, DBModelMixin):
    """Complete notification model with system fields."""
    pass


class NotificationCreate(NotificationBase):
    """Model for creating a new notification."""
    pass


class NotificationResponse(Notification):
    """Notification model for responses with additional fields."""
    notificationId: str
    createdAt: datetime
    # Additional info about source user
    sourceUserDetails: Optional[dict] = None


class NotificationUpdate(BaseModel):
    """Model for updating notification fields."""
    read: Optional[bool] = None
