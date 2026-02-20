from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.community import Community, CommunityCreate, CommunityResponse
from app.core.database import get_database


class CommunityManager:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.communities

    async def create_community(self, data: CommunityCreate, creator_id: str) -> CommunityResponse:
        """Create a new community. The creator auto-joins."""
        # Normalise slug: lowercase, strip spaces
        slug = data.name.strip().lower().replace(" ", "-")

        # Check uniqueness
        existing = await self.collection.find_one({"name": slug})
        if existing:
            raise ValueError(f"Community '{slug}' already exists")

        now = datetime.utcnow()
        community_dict = {
            "name": slug,
            "displayName": data.displayName,
            "description": data.description,
            "iconColor": data.iconColor or "#6366f1",
            "createdBy": creator_id,
            "memberCount": 1,
            "postCount": 0,
            "members": [creator_id],
            "createdAt": now,
            "updatedAt": now,
        }

        result = await self.collection.insert_one(community_dict)
        community_dict["communityId"] = str(result.inserted_id)

        # Fetch creator display name
        creator_name = await self._get_user_name(creator_id)
        community_dict["creatorName"] = creator_name
        community_dict["isJoined"] = True

        return CommunityResponse(**community_dict)

    async def get_community(self, community_id: str, requesting_user_id: Optional[str] = None) -> Optional[CommunityResponse]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(community_id)})
            if not doc:
                # also try by slug
                doc = await self.collection.find_one({"name": community_id})
            if not doc:
                return None
            return await self._to_response(doc, requesting_user_id)
        except Exception as e:
            print(f"get_community error: {e}")
            return None

    async def get_community_by_slug(self, slug: str, requesting_user_id: Optional[str] = None) -> Optional[CommunityResponse]:
        try:
            doc = await self.collection.find_one({"name": slug})
            if not doc:
                return None
            return await self._to_response(doc, requesting_user_id)
        except Exception as e:
            print(f"get_community_by_slug error: {e}")
            return None

    async def list_communities(self, skip: int = 0, limit: int = 50, requesting_user_id: Optional[str] = None) -> List[CommunityResponse]:
        cursor = self.collection.find().sort("memberCount", -1).skip(skip).limit(limit)
        communities = []
        async for doc in cursor:
            communities.append(await self._to_response(doc, requesting_user_id))
        return communities

    async def join_community(self, community_id: str, user_id: str) -> bool:
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(community_id)},
                {
                    "$addToSet": {"members": user_id},
                    "$inc": {"memberCount": 1},
                    "$set": {"updatedAt": datetime.utcnow()},
                },
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"join_community error: {e}")
            return False

    async def leave_community(self, community_id: str, user_id: str) -> bool:
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(community_id)},
                {
                    "$pull": {"members": user_id},
                    "$inc": {"memberCount": -1},
                    "$set": {"updatedAt": datetime.utcnow()},
                },
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"leave_community error: {e}")
            return False

    async def increment_post_count(self, community_id: str) -> None:
        try:
            await self.collection.update_one(
                {"_id": ObjectId(community_id)},
                {"$inc": {"postCount": 1}, "$set": {"updatedAt": datetime.utcnow()}},
            )
        except Exception as e:
            print(f"increment_post_count error: {e}")

    # ── helpers ──────────────────────────────────────────────────────────────

    async def _to_response(self, doc: dict, requesting_user_id: Optional[str]) -> CommunityResponse:
        doc["communityId"] = str(doc["_id"])
        doc["creatorName"] = await self._get_user_name(doc.get("createdBy", ""))
        doc["isJoined"] = requesting_user_id in doc.get("members", []) if requesting_user_id else False
        return CommunityResponse(**doc)

    async def _get_user_name(self, user_id: str) -> str:
        try:
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                return f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
        except Exception:
            pass
        return "Unknown"
