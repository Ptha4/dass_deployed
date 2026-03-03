from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.notification import Notification, NotificationResponse, NotificationUpdate, NotificationType
from app.core.database import get_database
from app.managers.user import UserManager


class NotificationManager:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.notifications
        self.user_manager = UserManager()

    async def create_notification(self, notification: Notification) -> NotificationResponse:
        """
        Create a new notification.

        Args:
            notification (Notification): Notification data

        Returns:
            NotificationResponse: Created notification with response details
        """
        notification_dict = notification.model_dump()

        # Set timestamps
        current_time = datetime.utcnow()
        notification_dict["createdAt"] = current_time
        notification_dict["updatedAt"] = current_time

        # Insert the notification
        result = await self.collection.insert_one(notification_dict)
        notification_dict["notificationId"] = str(result.inserted_id)
        # Ensure _id is also a string
        notification_dict["_id"] = str(result.inserted_id)

        # Get source user details
        source_user = await self.user_manager.get_user(notification.sourceUserId)
        if source_user:
            notification_dict["sourceUserDetails"] = {
                "name": f"{source_user.firstName} {source_user.lastName}".strip(),
                "avatar": source_user.avatar if hasattr(source_user, "avatar") else "/default-avatar.png"
            }

        return NotificationResponse(**notification_dict)

    async def get_notification(self, notification_id: str) -> Optional[NotificationResponse]:
        """
        Get a notification by ID.

        Args:
            notification_id (str): ID of the notification

        Returns:
            Optional[NotificationResponse]: Notification if found, None otherwise
        """
        try:
            notification = await self.collection.find_one({"_id": ObjectId(notification_id)})
            if notification:
                notification["notificationId"] = str(notification["_id"])
                # Convert _id to string
                notification["_id"] = str(notification["_id"])

                # Get source user details
                source_user = await self.user_manager.get_user(notification['sourceUserId'])
                if source_user:
                    notification["sourceUserDetails"] = {
                        "name": f"{source_user.firstName} {source_user.lastName}".strip(),
                        "avatar": source_user.avatar if hasattr(source_user, "avatar") else "/default-avatar.png"
                    }

                return NotificationResponse(**notification)
            return None
        except Exception as e:
            print(f"Error retrieving notification: {e}")
            return None

    async def get_user_notifications(
        self, user_id: str, skip: int = 0, limit: int = 10, unread_only: bool = False
    ) -> List[NotificationResponse]:
        """
        Get notifications for a specific user.

        Args:
            user_id (str): ID of the user
            skip (int): Number of records to skip
            limit (int): Maximum number of records to return
            unread_only (bool): If True, return only unread notifications

        Returns:
            List[NotificationResponse]: List of notifications
        """
        query = {"targetUserId": user_id}

        if unread_only:
            query["read"] = False

        cursor = self.collection.find(query)
        cursor.sort("createdAt", -1)  # Sort by creation time, newest first
        cursor.skip(skip).limit(limit)

        notifications = []
        async for notification in cursor:
            notification["notificationId"] = str(notification["_id"])
            # Convert _id to string
            notification["_id"] = str(notification["_id"])

            # Get source user details
            source_user = await self.user_manager.get_user(notification['sourceUserId'])
            if source_user:
                notification["sourceUserDetails"] = {
                    "name": f"{source_user.firstName} {source_user.lastName}".strip(),
                    "avatar": source_user.avatar if hasattr(source_user, "avatar") else "/default-avatar.png"
                }

            notifications.append(NotificationResponse(**notification))

        return notifications

    async def update_notification(
        self, notification_id: str, update_data: NotificationUpdate
    ) -> Optional[NotificationResponse]:
        """
        Update a notification.

        Args:
            notification_id (str): ID of the notification to update
            update_data (NotificationUpdate): Data to update

        Returns:
            Optional[NotificationResponse]: Updated notification if successful, None otherwise
        """
        try:
            update_dict = update_data.model_dump(exclude_none=True)
            update_dict["updatedAt"] = datetime.utcnow()

            # Update the notification
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {"$set": update_dict}
            )

            if result.modified_count or result.matched_count:
                return await self.get_notification(notification_id)
            return None
        except Exception as e:
            print(f"Error updating notification: {e}")
            return None

    async def mark_as_read(self, notification_id: str) -> Optional[NotificationResponse]:
        """
        Mark a notification as read.

        Args:
            notification_id (str): ID of the notification

        Returns:
            Optional[NotificationResponse]: Updated notification if successful, None otherwise
        """
        update_data = NotificationUpdate(read=True)
        return await self.update_notification(notification_id, update_data)

    async def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications for a user as read.

        Args:
            user_id (str): ID of the user

        Returns:
            int: Number of notifications updated
        """
        try:
            result = await self.collection.update_many(
                {"targetUserId": user_id, "read": False},
                {"$set": {"read": True, "updatedAt": datetime.utcnow()}}
            )
            return result.modified_count
        except Exception as e:
            print(f"Error marking notifications as read: {e}")
            return 0

    async def create_post_notification_for_followers(
        self, expert_user_id: str, post_id: str, post_content: str
    ) -> int:
        """
        Create notifications for all followers when an expert creates a new post.

        Args:
            expert_user_id (str): ID of the expert user
            post_id (str): ID of the created post
            post_content (str): Content of the post (for preview)

        Returns:
            int: Number of notifications created
        """
        try:
            # Get the expert's details
            expert = await self.user_manager.get_user(expert_user_id)
            if not expert:
                return 0

            # Get expert's followers
            followers = expert.followers
            if not followers:
                return 0

            # Get the expert ID if available
            expert_id = None
            if hasattr(expert, 'expertId'):
                expert_id = expert.expertId

            # Create a short preview of the post content
            content_preview = post_content[:100] + \
                "..." if len(post_content) > 100 else post_content
            notification_content = f"{expert.firstName} {expert.lastName} posted: {content_preview}"

            # Create notifications for each follower
            notification_count = 0
            for follower_id in followers:
                notification = Notification(
                    targetUserId=follower_id,
                    sourceUserId=expert_user_id,
                    type=NotificationType.NEW_POST,
                    content=notification_content,
                    referenceId=post_id,
                    referenceType="post",
                    read=False,
                    expertId=expert_id  # Add expert ID to notification
                )
                await self.create_notification(notification)
                notification_count += 1

            return notification_count
        except Exception as e:
            print(f"Error creating post notifications: {e}")
            return 0

    async def delete_notification(self, notification_id: str) -> bool:
        """
        Delete a notification.

        Args:
            notification_id (str): ID of the notification to delete

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            result = await self.collection.delete_one({"_id": ObjectId(notification_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting notification: {e}")
            return False
