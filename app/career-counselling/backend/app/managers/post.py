from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.post import Post, PostResponse
from app.core.database import get_database


class PostManager:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.posts

    # ── Create ────────────────────────────────────────────────────────────────

    async def create_community_post(
        self,
        community_id: str,
        author_id: str,
        title: str,
        content: str,
        tags: List[str] = [],
    ) -> PostResponse:
        now = datetime.utcnow()
        post_dict = {
            "communityId": community_id,
            "authorId": author_id,
            "title": title,
            "content": content,
            "tags": tags,
            "likes": 0,
            "likedBy": [],
            "views": 0,
            "createdAt": now,
            "updatedAt": now,
        }

        result = await self.collection.insert_one(post_dict)
        post_dict["postId"] = str(result.inserted_id)

        # Enrich with author / community info
        await self._enrich(post_dict, author_id, community_id)
        return PostResponse(**post_dict)

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_post(self, post_id: str) -> Optional[PostResponse]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(post_id)})
            if not doc:
                return None
            doc["postId"] = str(doc["_id"])
            await self._enrich(doc, doc.get("authorId", ""), doc.get("communityId", ""))
            # Comment count
            doc["commentsCount"] = await self.db.comments.count_documents(
                {"page_id": doc["postId"], "type": "post"}
            )
            return PostResponse(**doc)
        except Exception as e:
            print(f"get_post error: {e}")
            return None

    async def get_posts_by_community(
        self, community_id: str, skip: int = 0, limit: int = 30
    ) -> List[PostResponse]:
        cursor = (
            self.collection.find({"communityId": community_id})
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
        )
        posts = []
        async for doc in cursor:
            doc["postId"] = str(doc["_id"])
            await self._enrich(doc, doc.get("authorId", ""), community_id)
            doc["commentsCount"] = await self.db.comments.count_documents(
                {"page_id": doc["postId"], "type": "post"}
            )
            try:
                posts.append(PostResponse(**doc))
            except Exception as e:
                print(f"PostResponse parse error: {e}")
        return posts

    async def get_all_posts(self, skip: int = 0, limit: int = 50) -> List[PostResponse]:
        """Kept for backward compat — returns newest posts globally."""
        cursor = self.collection.find().sort("createdAt", -1).skip(skip).limit(limit)
        posts = []
        async for doc in cursor:
            doc["postId"] = str(doc["_id"])
            await self._enrich(doc, doc.get("authorId", ""), doc.get("communityId", ""))
            doc["commentsCount"] = await self.db.comments.count_documents(
                {"page_id": doc["postId"], "type": "post"}
            )
            try:
                posts.append(PostResponse(**doc))
            except Exception as e:
                print(f"PostResponse parse error: {e}")
        return posts

    # ── Like ──────────────────────────────────────────────────────────────────

    async def like_post(self, post_id: str, user_id: str) -> Optional[PostResponse]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(post_id)})
            if not doc:
                return None

            if user_id in doc.get("likedBy", []):
                update = {
                    "$pull": {"likedBy": user_id},
                    "$inc": {"likes": -1},
                    "$set": {"updatedAt": datetime.utcnow()},
                }
            else:
                update = {
                    "$addToSet": {"likedBy": user_id},
                    "$inc": {"likes": 1},
                    "$set": {"updatedAt": datetime.utcnow()},
                }

            result = await self.collection.update_one({"_id": ObjectId(post_id)}, update)
            if result.modified_count:
                return await self.get_post(post_id)
            return None
        except Exception as e:
            print(f"like_post error: {e}")
            return None

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete_post(self, post_id: str, author_id: str) -> bool:
        """Any user can delete their own post."""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(post_id)})
            if not doc or doc.get("authorId") != author_id:
                return False
            result = await self.collection.delete_one({"_id": ObjectId(post_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"delete_post error: {e}")
            return False

    # ── View ──────────────────────────────────────────────────────────────────

    async def increment_view(self, post_id: str) -> bool:
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"views": 1}},
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"increment_view error: {e}")
            return False

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _enrich(self, doc: dict, author_id: str, community_id: str) -> None:
        """Attach author name and community name to a post dict in-place."""
        # Author info
        try:
            if author_id:
                user = await self.db.users.find_one({"_id": ObjectId(author_id)})
                if user:
                    fn = user.get("firstName", "")
                    ln = user.get("lastName", "")
                    doc["authorName"] = f"{fn} {ln}".strip() or "Anonymous"
                    doc["authorInitials"] = (
                        (fn[0] if fn else "") + (ln[0] if ln else "")
                    ).upper() or "U"
                else:
                    doc["authorName"] = "Anonymous"
                    doc["authorInitials"] = "U"
            else:
                doc["authorName"] = "Anonymous"
                doc["authorInitials"] = "U"
        except Exception:
            doc["authorName"] = "Anonymous"
            doc["authorInitials"] = "U"

        # Community info
        try:
            if community_id:
                comm = await self.db.communities.find_one({"_id": ObjectId(community_id)})
                if comm:
                    doc["communityName"] = comm.get("name", "")
                    doc["communityDisplayName"] = comm.get("displayName", "")
                else:
                    doc["communityName"] = ""
                    doc["communityDisplayName"] = ""
        except Exception:
            doc["communityName"] = ""
            doc["communityDisplayName"] = ""
