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
            doc = None
            # Try ObjectId lookup first; if community_id is a slug this will raise InvalidId
            try:
                doc = await self.collection.find_one({"_id": ObjectId(community_id)})
            except Exception:
                pass
            # Fall back to slug lookup
            if not doc:
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
            # Support both ObjectId and slug
            try:
                query = {"_id": ObjectId(community_id)}
            except Exception:
                query = {"name": community_id}
            result = await self.collection.update_one(
                query,
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
            # Support both ObjectId and slug
            try:
                query = {"_id": ObjectId(community_id)}
            except Exception:
                query = {"name": community_id}
            result = await self.collection.update_one(
                query,
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
            # Support both ObjectId and slug
            try:
                query = {"_id": ObjectId(community_id)}
            except Exception:
                query = {"name": community_id}
            await self.collection.update_one(
                query,
                {"$inc": {"postCount": 1}, "$set": {"updatedAt": datetime.utcnow()}},
            )
        except Exception as e:
            print(f"increment_post_count error: {e}")

    async def get_user_communities(self, user_id: str) -> List[CommunityResponse]:
        """Return communities that the given user has joined."""
        cursor = self.collection.find({"members": user_id}).sort("updatedAt", -1)
        communities = []
        async for doc in cursor:
            communities.append(await self._to_response(doc, user_id))
        return communities

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

    async def seed_default_communities(self) -> None:
        """Seed default communities if they don't already exist."""
        DEFAULT_COMMUNITIES = [
            {"name": "career-guidance", "displayName": "Career Guidance", "description": "Get advice on choosing the right career path, skill development, and career transitions.", "iconColor": "#6366f1"},
            {"name": "engineering-students", "displayName": "Engineering Students", "description": "A community for engineering students to discuss academics, projects, and career opportunities.", "iconColor": "#ec4899"},
            {"name": "college-admissions", "displayName": "College Admissions", "description": "Tips, strategies, and discussions around college applications, entrance exams, and admissions.", "iconColor": "#10b981"},
            {"name": "interview-prep", "displayName": "Interview Prep", "description": "Share resources, mock interview tips, and success stories for technical and HR interviews.", "iconColor": "#f59e0b"},
            {"name": "study-abroad", "displayName": "Study Abroad", "description": "Discuss opportunities for studying abroad, scholarships, visa requirements, and university choices.", "iconColor": "#3b82f6"},
            {"name": "placements", "displayName": "Campus Placements", "description": "Discuss campus recruitment drives, placement strategies, and company experiences.", "iconColor": "#8b5cf6"},
            {"name": "entrepreneurship", "displayName": "Entrepreneurship", "description": "For budding entrepreneurs to discuss startups, business ideas, funding, and growth strategies.", "iconColor": "#ef4444"},
            {"name": "higher-education", "displayName": "Higher Education", "description": "Discussions about master's programs, PhD opportunities, and further education choices.", "iconColor": "#14b8a6"},
        ]
        now = datetime.utcnow()
        for comm in DEFAULT_COMMUNITIES:
            existing = await self.collection.find_one({"name": comm["name"]})
            if not existing:
                doc = {
                    **comm,
                    "createdBy": "system",
                    "memberCount": 0,
                    "postCount": 0,
                    "members": [],
                    "createdAt": now,
                    "updatedAt": now,
                }
                await self.collection.insert_one(doc)
                print(f"Seeded community: {comm['name']}")
