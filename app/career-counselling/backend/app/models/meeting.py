from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.base import DBModelMixin


class Meeting(DBModelMixin):
    expertId: str
    userId: str
    startTime: datetime
    endTime: datetime
    status: str  # 'scheduled', 'completed', 'cancelled'
    amount: float = 0
    isPaid: bool = False
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    notes: Optional[str] = None
    # Additional fields to track user and expert details
    userName: Optional[str] = None
    expertName: Optional[str] = None
    transactionId: Optional[str] = None

    @classmethod
    async def find(cls, query):
        """Provides MongoDB-like query functionality"""
        # This would be implemented by the database layer
        # For now, just return an interface that matches how it's used in expert_analytics.py
        from app.core.database import get_database
        db = get_database()
        return await db.meetings.find(query)

    @classmethod
    async def find_one(cls, query):
        """Find a single meeting document"""
        from app.core.database import get_database
        db = get_database()
        return await db.meetings.find_one(query)


class Transaction(DBModelMixin):
    userId: str
    expertId: Optional[str] = None
    expertUID: Optional[str] = None
    amount: float
    type: str  # 'payment', 'refund', 'deposit'
    description: str
    status: str = "completed"  # 'pending', 'completed', 'failed'
    meetingId: Optional[str] = None
    createdAt: datetime = datetime.now()
    
    @classmethod
    async def find(cls, query):
        from app.core.database import get_database
        db = get_database()
        return await db.transactions.find(query)

    @classmethod
    async def find_one(cls, query):
        from app.core.database import get_database
        db = get_database()
        return await db.transactions.find_one(query)


class RefundRequest(DBModelMixin):
    meetingId: str
    userId: str
    expertId: str
    amount: float
    reason: str
    status: str = "pending"  # 'pending', 'approved', 'denied'
    fileId: Optional[str] = None
    transactionId: Optional[str] = None
    requestedAt: datetime = datetime.now()
    processedAt: Optional[datetime] = None
    adminNotes: Optional[str] = None
    # Additional fields to track user and expert details
    userName: Optional[str] = None
    expertName: Optional[str] = None
    
    @classmethod
    async def find(cls, query):
        from app.core.database import get_database
        db = get_database()
        return await db.refund_requests.find(query)

    @classmethod
    async def find_one(cls, query):
        from app.core.database import get_database
        db = get_database()
        return await db.refund_requests.find_one(query)