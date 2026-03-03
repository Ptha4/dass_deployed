from datetime import datetime
from typing import List, Optional
from app.models.meeting import Meeting, Transaction, RefundRequest
from app.models.user import UserBase
from app.models.expert import Expert
from app.core.database import get_database
from app.managers.user import UserManager
from app.managers.expert import ExpertManager
from app.models.notification import Notification
from app.managers.notification import NotificationManager
from bson import ObjectId


class MeetingManager:
    def __init__(self):
        """Initialize MeetingManager with database connection."""
        self.db = get_database()
        self._user_manager = None
        self._expert_manager = None
        self._notification_manager = None

    @property
    def user_manager(self):
        """Lazy load the UserManager to avoid circular imports"""
        if self._user_manager is None:
            self._user_manager = UserManager()
        return self._user_manager

    @property
    def expert_manager(self):
        """Lazy load the ExpertManager to avoid circular imports"""
        if self._expert_manager is None:
            self._expert_manager = ExpertManager()
        return self._expert_manager

    @property
    def notification_manager(self):
        """Lazy load the NotificationManager to avoid circular imports"""
        if self._notification_manager is None:
            self._notification_manager = NotificationManager()
        return self._notification_manager

    async def create_meeting(self, meeting_data: dict) -> Meeting:
        try:
            # Validate required fields
            if "userId" not in meeting_data:
                raise ValueError("Missing required field: userId")
            if "expertId" not in meeting_data:
                raise ValueError("Missing required field: expertId")

            print(f"Creating meeting with data: {meeting_data}")

            # Get user and expert details
            user = await self.user_manager.get_user_by_id(meeting_data["userId"])
            if not user:
                raise ValueError(
                    f"User not found with ID: {meeting_data['userId']}")

            expert = await self.expert_manager.get_expert_by_id(meeting_data["expertId"])
            if not expert:
                raise ValueError(
                    f"Expert not found with ID: {meeting_data['expertId']}")

            # Add additional meeting details
            meeting_data["userName"] = f"{user.firstName} {user.lastName}"
            meeting_data["expertName"] = f"{expert.userDetails.firstName} {expert.userDetails.lastName}"

            # Create the meeting record
            result = await self.db.meetings.insert_one(meeting_data)
            meeting_data["_id"] = str(result.inserted_id)
            
            # Increment the studentsGuided count for the expert
            await self.expert_manager.increment_students_guided(meeting_data["expertId"])

            return Meeting(**meeting_data)
        except ValueError as e:
            # Re-raise ValueError for handling in the route
            raise
        except Exception as e:
            # Convert other exceptions to ValueError with details
            print(f"Error creating meeting: {str(e)}")
            raise ValueError(f"Failed to create meeting: {str(e)}")

    async def get_meeting(self, meeting_id: str) -> Optional[Meeting]:
        meeting_data = await self.db.meetings.find_one({"_id": ObjectId(meeting_id)})
        if meeting_data:
            meeting_data["id"] = str(meeting_data.pop("_id"))
            return Meeting(**meeting_data)
        return None

    async def get_user_meetings(self, user_id: str) -> List[Meeting]:
        cursor = self.db.meetings.find({"userId": user_id})
        meetings = []
        async for meeting_data in cursor:
            meeting_data["id"] = str(meeting_data.pop("_id"))
            meetings.append(Meeting(**meeting_data))
        return meetings

    async def get_expert_meetings(self, expert_id: str) -> List[Meeting]:
        cursor = self.db.meetings.find({"expertId": expert_id})
        meetings = []
        async for meeting_data in cursor:
            meeting_data["id"] = str(meeting_data.pop("_id"))
            meetings.append(Meeting(**meeting_data))
        return meetings

    async def update_meeting(self, meeting_id: str, update_data: dict) -> Optional[Meeting]:
        result = await self.db.meetings.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": update_data}
        )
        if result.modified_count:
            return await self.get_meeting(meeting_id)
        return None


class TransactionManager:
    def __init__(self):
        """Initialize TransactionManager with database connection."""
        self.db = get_database()
        self._user_manager = None
        self._expert_manager = None

    @property
    def user_manager(self):
        """Lazy load the UserManager to avoid circular imports"""
        if self._user_manager is None:
            self._user_manager = UserManager()
        return self._user_manager

    @property
    def expert_manager(self):
        """Lazy load the ExpertManager to avoid circular imports"""
        if self._expert_manager is None:
            self._expert_manager = ExpertManager()
        return self._expert_manager

    async def create_transaction(self, transaction_data: dict) -> Transaction:
        try:
            # Validate required fields
            if "userId" not in transaction_data:
                raise ValueError("Missing required field: userId")
            if "amount" not in transaction_data:
                raise ValueError("Missing required field: amount")
            if "type" not in transaction_data:
                raise ValueError("Missing required field: type")

            print(f"Creating transaction with data: {transaction_data}")

            # Verify user exists
            user = await self.user_manager.get_user_by_id(transaction_data["userId"])
            if not user:
                raise ValueError(
                    f"User not found with ID: {transaction_data['userId']}")

            # For payments, verify user has sufficient balance
            if transaction_data["type"] == "payment":
                # Get current wallet balance
                if hasattr(user, "wallet"):
                    current_balance = user.wallet
                elif isinstance(user, dict) and "wallet" in user:
                    current_balance = user["wallet"]
                else:
                    current_balance = 0

                print(
                    f"User wallet balance: {current_balance}, Required amount: {transaction_data['amount']}")

                if current_balance < transaction_data["amount"]:
                    raise ValueError(
                        f"Insufficient funds: User has {current_balance} coins, but {transaction_data['amount']} is required. Please add more coins to your wallet.")

            # Verify expert exists if expertId is provided
            if transaction_data.get("expertId"):
                try:
                    print(
                        f"Checking if expert exists with ID: {transaction_data['expertId']}")
                    expert = await self.expert_manager.get_expert_by_id(transaction_data["expertId"])
                    if not expert:
                        # Try one more time with a different field name, it might be 'expertID' instead of 'expertId'
                        print(f"Expert not found, trying with alternate field format")
                        # See if we can find the expert by userId instead
                        expert_user = await self.user_manager.get_user_by_id(transaction_data["expertId"])
                        if expert_user and expert_user.isExpert:
                            print(
                                f"Found expert via user record: {expert_user}")
                        else:
                            raise ValueError(
                                f"Expert not found with ID: {transaction_data['expertId']}")
                except Exception as e:
                    print(f"Error verifying expert: {str(e)}")
                    raise ValueError(
                        f"Failed to verify expert with ID: {transaction_data['expertId']}")

            # Set creation timestamp
            transaction_data["createdAt"] = datetime.now()

            # Insert transaction record
            result = await self.db.transactions.insert_one(transaction_data)
            transaction_data["_id"] = str(result.inserted_id)

            # Update user and expert wallets
            if transaction_data["type"] == "payment":
                # Deduct from user wallet
                user_update = await self.user_manager.update_wallet(
                    transaction_data["userId"],
                    -transaction_data["amount"]
                )

                if not user_update:
                    raise ValueError(
                        f"Failed to update user wallet for payment: {transaction_data['userId']}")

                # Add to expert wallet
                if transaction_data.get("expertId"):
                    expert_update = await self.user_manager.update_wallet(
                        expert.userId,
                        transaction_data["amount"]
                    )

                    if not expert_update:
                        # If failed to update expert wallet, revert user wallet change
                        await self.user_manager.update_wallet(
                            transaction_data["userId"],
                            transaction_data["amount"]
                        )
                        raise ValueError(
                            f"Failed to update expert wallet for payment: {transaction_data['expertId']}")

            elif transaction_data["type"] == "refund":
                # Add to user wallet
                user_update = await self.user_manager.update_wallet(
                    transaction_data["userId"],
                    transaction_data["amount"]
                )

                if not user_update:
                    raise ValueError(
                        f"Failed to update user wallet for refund: {transaction_data['userId']}")

                # Deduct from expert wallet
                if transaction_data.get("expertId"):
                    expert_update = await self.user_manager.update_wallet(
                        expert.userId,
                        -transaction_data["amount"]
                    )

                    if not expert_update:
                        # If failed to update expert wallet, revert user wallet change
                        await self.user_manager.update_wallet(
                            transaction_data["userId"],
                            -transaction_data["amount"]
                        )
                        raise ValueError(
                            f"Failed to update expert wallet for refund: {transaction_data['expertId']}")

            transaction_data["expertUID"] = expert.userId

            return Transaction(**transaction_data)

        except ValueError as e:
            # Re-raise ValueError for handling in the route
            raise
        except Exception as e:
            # Convert other exceptions to ValueError with details
            print(f"Error creating transaction: {str(e)}")
            raise ValueError(f"Failed to create transaction: {str(e)}")

    async def get_transaction(self, transaction_id: str) -> Optional[Transaction]:
        transaction_data = await self.db.transactions.find_one({"_id": ObjectId(transaction_id)})
        if transaction_data:
            transaction_data["id"] = str(transaction_data.pop("_id"))
            return Transaction(**transaction_data)
        return None

    async def get_user_transactions(self, user_id: str) -> List[Transaction]:
        cursor = self.db.transactions.find({"userId": user_id})
        transactions = []
        async for transaction_data in cursor:
            transaction_data["id"] = str(transaction_data.pop("_id"))
            transactions.append(Transaction(**transaction_data))
        return transactions

    async def get_expert_transactions(self, expert_id: str) -> List[Transaction]:
        cursor = self.db.transactions.find({"expertId": expert_id})
        transactions = []
        async for transaction_data in cursor:
            transaction_data["id"] = str(transaction_data.pop("_id"))
            transactions.append(Transaction(**transaction_data))
        return transactions

    async def update_transaction(self, transaction_id: str, update_data: dict) -> Optional[Transaction]:
        result = await self.db.transactions.update_one(
            {"_id": ObjectId(transaction_id)},
            {"$set": update_data}
        )
        if result.modified_count:
            return await self.get_transaction(transaction_id)
        return None


class RefundManager:
    def __init__(self):
        """Initialize RefundManager with database connection."""
        self.db = get_database()
        self._meeting_manager = None
        self._notification_manager = None
        self._transaction_manager = None
        # also add user and expert managers
        self._user_manager = None
        self._expert_manager = None

    @property
    def meeting_manager(self):
        """Lazy load the MeetingManager to avoid circular imports"""
        if self._meeting_manager is None:
            self._meeting_manager = MeetingManager()
        return self._meeting_manager

    @property
    def notification_manager(self):
        """Lazy load the NotificationManager to avoid circular imports"""
        if self._notification_manager is None:
            self._notification_manager = NotificationManager()
        return self._notification_manager

    @property
    def transaction_manager(self):
        """Lazy load the TransactionManager to avoid circular imports"""
        if self._transaction_manager is None:
            self._transaction_manager = TransactionManager()
        return self._transaction_manager

    @property
    def user_manager(self):
        """Lazy load the UserManager to avoid circular imports"""
        if self._user_manager is None:
            self._user_manager = UserManager()
        return self._user_manager

    @property
    def expert_manager(self):
        """Lazy load the ExpertManager to avoid circular imports"""
        if self._expert_manager is None:
            self._expert_manager = ExpertManager()
        return self._expert_manager

    async def create_refund_request(self, refund_data: dict) -> RefundRequest:
        # Check if the meeting exists
        meeting = await self.meeting_manager.get_meeting(refund_data["meetingId"])
        if not meeting:
            raise ValueError("Meeting not found")

        # Set additional data
        refund_data["expertId"] = meeting.expertId
        refund_data["amount"] = meeting.amount
        refund_data["requestedAt"] = datetime.now()
        refund_data["status"] = "pending"

        # Create refund request
        result = await self.db.refund_requests.insert_one(refund_data)
        refund_data["_id"] = str(result.inserted_id)

        # Notify admin of new refund request
        print(f"New refund request: {refund_data['_id']}")

        return RefundRequest(**refund_data)

    async def get_refund_request(self, refund_id: str) -> Optional[RefundRequest]:
        refund_data = await self.db.refund_requests.find_one({"_id": ObjectId(refund_id)})
        if refund_data:
            refund_data["id"] = str(refund_data.pop("_id"))
            return RefundRequest(**refund_data)
        return None

    async def get_user_refund_requests(self, user_id: str) -> List[RefundRequest]:
        cursor = self.db.refund_requests.find({"userId": user_id})
        refunds = []
        async for refund_data in cursor:
            refund_data["id"] = str(refund_data.pop("_id"))
            refunds.append(RefundRequest(**refund_data))
        return refunds

    async def get_expert_refund_requests(self, expert_id: str) -> List[RefundRequest]:
        cursor = self.db.refund_requests.find({"expertId": expert_id})
        refunds = []
        async for refund_data in cursor:
            refund_data["id"] = str(refund_data.pop("_id"))
            refunds.append(RefundRequest(**refund_data))
        return refunds

    async def get_all_refund_requests(self) -> List[RefundRequest]:
        cursor = self.db.refund_requests.find()
        refunds = []
        async for refund_data in cursor:
            refund_data["id"] = str(refund_data.pop("_id"))
            # fetch user and expert details
            user = await self.user_manager.get_user_by_id(refund_data["userId"])
            expert = await self.expert_manager.get_expert_by_id(refund_data["expertId"])
            if user:
                refund_data["userName"] = f"{user.firstName} {user.lastName}"
            if expert:
                refund_data["expertName"] = f"{expert.userDetails.firstName} {expert.userDetails.lastName}"
            refunds.append(RefundRequest(**refund_data))
        return refunds

    async def update_refund_status(self, refund_id: str, status: str, admin_notes: str = None, admin_id: str = "admin") -> Optional[RefundRequest]:
        # Get the refund request
        refund_request = await self.get_refund_request(refund_id)
        if not refund_request:
            raise ValueError("Refund request not found")

        # Update the status
        update_data = {
            "status": status,
            "processedAt": datetime.now()
        }

        if admin_notes:
            update_data["adminNotes"] = admin_notes

        result = await self.db.refund_requests.update_one(
            {"_id": ObjectId(refund_id)},
            {"$set": update_data}
        )

        # If approved, process the refund
        if status == "approved":
            transaction_data = {
                "userId": refund_request.userId,
                "expertId": refund_request.expertId,
                "amount": refund_request.amount,
                "type": "refund",
                "description": f"Refund for meeting {refund_request.meetingId}",
                "meetingId": refund_request.meetingId
            }

            # Create the refund transaction
            transaction = await self.transaction_manager.create_transaction(transaction_data)

            # Update the refund request with the transaction ID
            await self.db.refund_requests.update_one(
                {"_id": ObjectId(refund_id)},
                {"$set": {"transactionId": transaction.id}}
            )

            # Create notification data as dictionary instead of Pydantic model
            notification_data_user = {
                "targetUserId": refund_request.userId,
                "sourceUserId": admin_id,
                "type": "refund",
                "content": f"Your refund request for {refund_request.amount} coins has been approved.",
                "referenceId": refund_request.meetingId,
                "referenceType": "meeting"
            }

            notification_data_expert = {
                "targetUserId": transaction.expertUID,
                "sourceUserId": admin_id,
                "type": "refund",
                "content": f"A refund request for {refund_request.amount} coins has been approved.",
                "referenceId": refund_request.meetingId,
                "referenceType": "meeting"
            }

            # Create the notifications
            await self.notification_manager.create_notification(Notification(**notification_data_user))
            await self.notification_manager.create_notification(Notification(**notification_data_expert))

        elif status == "denied":
            # Create notification data as dictionary for denied refund
            notification_data_user = {
                "targetUserId": refund_request.userId,
                "sourceUserId": admin_id,
                "type": "refund",
                "content": f"Your refund request for {refund_request.amount} coins has been denied.",
                "referenceId": refund_request.meetingId,
                "referenceType": "meeting"
            }

            # Create the notification
            await self.notification_manager.create_notification(Notification(**notification_data_user))

        if result.modified_count:
            return await self.get_refund_request(refund_id)
        return None
