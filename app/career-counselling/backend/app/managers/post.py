from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.post import Post, PostResponse
from app.core.database import get_database
from app.managers.user import UserManager
from app.managers.expert import ExpertManager
from app.managers.notification import NotificationManager


class PostManager:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.posts
        self.user_manager = UserManager()
        self.expert_manager = ExpertManager()
        self.notification_manager = NotificationManager()

    async def create_post(self, post: Post) -> PostResponse:
        """
        Create a new post by an expert.

        Args:
            post (Post): Post content and expertId

        Returns:
            PostResponse: Created post with response details
        """
        post_dict = post.model_dump()

        # Remove postId if it's None
        if post_dict.get("postId") is None:
            post_dict.pop("postId", None)

        # Set timestamps
        current_time = datetime.utcnow()
        post_dict["createdAt"] = current_time
        post_dict["updatedAt"] = current_time

        # Initialize likes and likedBy
        post_dict["likes"] = 0
        post_dict["likedBy"] = []

        # Insert the post
        result = await self.collection.insert_one(post_dict)
        post_dict["postId"] = str(result.inserted_id)

        # Get expert details
        expert = await self.expert_manager.get_expert(post_dict["expertId"])
        if expert:
            user_data = {
                "name": f"{expert.userDetails.firstName} {expert.userDetails.lastName}".strip(),
                "initials": f"{expert.userDetails.firstName[0]}{expert.userDetails.lastName[0]}",
            }
            post_dict["expertDetails"] = user_data

            # Create notifications for followers
            await self.notification_manager.create_post_notification_for_followers(
                expert.userId,
                post_dict["postId"],
                post.content
            )
        else:
            post_dict["expertDetails"] = {
                "name": "Unknown Expert", "initials": "UE"}

        return PostResponse(**post_dict)

    async def get_post(self, post_id: str) -> Optional[PostResponse]:
        """
        Get a post by ID.

        Args:
            post_id (str): ID of the post to retrieve

        Returns:
            Optional[PostResponse]: Post if found, None otherwise
        """
        try:
            post = await self.collection.find_one({"_id": ObjectId(post_id)})
            if post:
                post["postId"] = str(post["_id"])

                # Get expert details
                expert = await self.expert_manager.get_expert(post["expertId"])
                if expert:
                    user_data = {
                        "name": f"{expert.userDetails.firstName} {expert.userDetails.lastName}".strip(),
                        "initials": f"{expert.userDetails.firstName[0]}{expert.userDetails.lastName[0]}",
                    }
                    post["expertDetails"] = user_data
                else:
                    post["expertDetails"] = {
                        "name": "Unknown Expert", "initials": "UE"}

                return PostResponse(**post)
            return None
        except Exception as e:
            print(f"Error retrieving post: {e}")
            return None

    async def get_posts_by_expert(self, expert_id: str) -> List[PostResponse]:
        """
        Get all posts by a specific expert.

        Args:
            expert_id (str): ID of the expert

        Returns:
            List[PostResponse]: List of posts by the expert
        """
        cursor = self.collection.find({"expertId": expert_id})
        cursor.sort("createdAt", -1)  # Sort by creation time, newest first

        posts = []
        expert = await self.expert_manager.get_expert(expert_id)
        user_data = None

        if expert:
            user_data = {
                "name": f"{expert.userDetails.firstName} {expert.userDetails.lastName}".strip(),
                "initials": f"{expert.userDetails.firstName[0]}{expert.userDetails.lastName[0]}",
            }
        else:
            user_data = {"name": "Unknown Expert", "initials": "UE"}

        async for post in cursor:
            post["postId"] = str(post["_id"])
            post["expertDetails"] = user_data
            posts.append(PostResponse(**post))

        return posts

    async def like_post(self, post_id: str, user_id: str) -> Optional[PostResponse]:
        """
        Like or unlike a post.

        Args:
            post_id (str): ID of the post to like/unlike
            user_id (str): ID of the user performing the action

        Returns:
            Optional[PostResponse]: Updated post if successful, None otherwise
        """
        try:
            # Get the post first to check if user has already liked it
            post = await self.collection.find_one({"_id": ObjectId(post_id)})
            if not post:
                return None

            liked_by = post.get("likedBy", [])

            if user_id in liked_by:
                # User has already liked the post, so unlike it
                result = await self.collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {
                        "$pull": {"likedBy": user_id},
                        "$inc": {"likes": -1},
                        "$set": {"updatedAt": datetime.utcnow()}
                    }
                )
            else:
                # User hasn't liked the post yet, so like it
                result = await self.collection.update_one(
                    {"_id": ObjectId(post_id)},
                    {
                        "$addToSet": {"likedBy": user_id},
                        "$inc": {"likes": 1},
                        "$set": {"updatedAt": datetime.utcnow()}
                    }
                )

            if result.modified_count:
                return await self.get_post(post_id)
            return None
        except Exception as e:
            print(f"Error liking/unliking post: {e}")
            return None

    async def delete_post(self, post_id: str, expert_id: str) -> bool:
        """
        Delete a post by its ID. Only the expert who created the post can delete it.

        Args:
            post_id (str): ID of the post to delete
            expert_id (str): ID of the expert attempting to delete the post

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            # First check if the post exists and belongs to the expert
            post = await self.collection.find_one({"_id": ObjectId(post_id)})
            if not post or post["expertId"] != expert_id:
                return False

            result = await self.collection.delete_one({"_id": ObjectId(post_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting post: {e}")
            return False

    async def increment_view(self, post_id: str) -> bool:
        """
        Increment the view count for a post.

        Args:
            post_id (str): ID of the post

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"views": 1}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error incrementing post view: {e}")
            return False
