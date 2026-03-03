from datetime import datetime
from pydantic import BaseModel
from app.models.base import DBModelMixin


class Follow(DBModelMixin):
    followerId: str  # The user doing the following
    # The user being followed (expert's userId in this context)
    followedId: str

    @classmethod
    async def find(cls, query):
        """Provides MongoDB-like query functionality"""
        from app.core.database import get_database
        db = get_database()
        return await db.follows.find(query)

    @classmethod
    async def find_one(cls, query):
        """Find a single follow document"""
        from app.core.database import get_database
        db = get_database()
        return await db.follows.find_one(query)
