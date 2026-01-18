from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional
from app.core.auth_utils import get_current_user, require_admin
from app.models.user import UserBase
from app.models.meeting import Meeting, Transaction, RefundRequest
from app.managers.meeting import MeetingManager, TransactionManager, RefundManager
from app.managers.file import FileManager
from pydantic import BaseModel
from datetime import datetime, timedelta
import json

router = APIRouter()
# Initialize manager instances
meeting_manager = MeetingManager()
transaction_manager = TransactionManager()
refund_manager = RefundManager()


class MeetingCreate(BaseModel):
    expertId: str
    userId: str
    startTime: datetime
    endTime: datetime
    amount: float
    status: str = "scheduled"

    class Config:
        # Allow conversion from strings to datetime
        json_encoders = {datetime: lambda dt: dt.isoformat()}
        # Include extra fields not defined in the model
        extra = "ignore"


class RefundRequestCreate(BaseModel):
    meetingId: str
    reason: str


class RefundRequestUpdate(BaseModel):
    status: str
    adminNotes: Optional[str] = None


@router.post("/meetings", response_model=Meeting)
async def create_meeting(
    # Use raw dict instead of Pydantic model for debugging
    meeting_data: dict = Body(...),
    current_user_data: dict = Depends(get_current_user)
):
    """Create a new meeting between user and expert"""
    print("Received meeting creation request with data:", meeting_data)
    print("Current user data:", current_user_data)

    # Make sure the user is either the expert or the meeting participant
    userId = meeting_data.get("userId", "")
    if current_user_data["id"] != userId and current_user_data.get("role") != "admin":
        print(
            f"Authorization error: User {current_user_data['id']} is trying to create a meeting for user {userId}")
        raise HTTPException(
            status_code=403, detail="Not authorized to create this meeting")

    try:
        # Create a transaction first
        transaction_data = {
            "userId": meeting_data.get("userId"),
            "expertId": meeting_data.get("expertId"),
            "amount": float(meeting_data.get("amount", 0)),
            "type": "payment",
            "description": f"Payment for meeting with expert {meeting_data.get('expertId')}",
        }

        print("Creating transaction with data:", transaction_data)
        transaction = await transaction_manager.create_transaction(transaction_data)
        print("Transaction created:", transaction)

        # Create the meeting with transaction ID
        # Copy the dict since we're not using Pydantic model
        meeting_dict = meeting_data.copy()
        meeting_dict["isPaid"] = True
        meeting_dict["transactionId"] = transaction.id
        meeting_dict["status"] = meeting_dict.get(
            "status", "scheduled")  # Ensure status is set

        # Ensure datetime fields are properly converted
        try:
            meeting_dict["startTime"] = datetime.fromisoformat(
                meeting_dict.get("startTime").replace("Z", "+00:00"))
        except Exception as e:
            print(f"Error converting startTime: {e}")
            meeting_dict["startTime"] = datetime.now()

        try:
            meeting_dict["endTime"] = datetime.fromisoformat(
                meeting_dict.get("endTime").replace("Z", "+00:00"))
        except Exception as e:
            print(f"Error converting endTime: {e}")
            meeting_dict["endTime"] = datetime.now() + timedelta(hours=1)

        print("Creating meeting with data:", meeting_dict)
        meeting = await meeting_manager.create_meeting(meeting_dict)
        print("Meeting created:", meeting)

        # Update transaction with meeting ID (now that we have it)
        transaction_dict = {
            "meetingId": meeting.id
        }

        # For simplicity, update synchronously
        print("Updating transaction with meeting ID:", transaction_dict)
        await transaction_manager.update_transaction(transaction.id, transaction_dict)

        return meeting
    except ValueError as e:
        print(f"ValueError in create_meeting: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error in create_meeting: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to create meeting: {str(e)}")


@router.get("/meetings/{meeting_id}", response_model=Meeting)
async def get_meeting(
    meeting_id: str,
    current_user_data: dict = Depends(get_current_user)
):
    """Get a meeting by ID"""
    meeting = await meeting_manager.get_meeting(meeting_id)

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Check if the user is authorized to view this meeting
    if (current_user_data["id"] != meeting.userId and
        current_user_data["id"] != meeting.expertId and
            current_user_data.get("role") != "admin"):
        raise HTTPException(
            status_code=403, detail="Not authorized to view this meeting")

    return meeting


@router.get("/meetings/user/{user_id}", response_model=List[Meeting])
async def get_user_meetings(
    user_id: str,
    current_user_data: dict = Depends(get_current_user)
):
    """Get meetings for a user"""
    # Check if the user is authorized to view these meetings
    if current_user_data["id"] != user_id and current_user_data.get("role") != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to view these meetings")

    meetings = await meeting_manager.get_user_meetings(user_id)
    return meetings


@router.get("/meetings/expert/{expert_id}", response_model=List[Meeting])
async def get_expert_meetings(
    expert_id: str,
    current_user_data: dict = Depends(get_current_user)
):
    """Get meetings for an expert"""
    # Check if the user is authorized to view these meetings
    is_expert_user = current_user_data.get(
        "role") == "expert" and current_user_data.get("expertId") == expert_id

    if not is_expert_user and current_user_data.get("role") != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to view these meetings")

    meetings = await meeting_manager.get_expert_meetings(expert_id)
    return meetings


@router.post("/refunds", response_model=RefundRequest)
async def create_refund_request(
    # Changed from dict = Body(...) to str = Form(...)
    refund_data: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user_data: dict = Depends(get_current_user)
):
    """Create a refund request for a meeting"""
    try:
        # Parse JSON string to dict
        try:
            refund_dict_data = json.loads(refund_data)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="Invalid JSON in refund_data")

        # Parse the refund data from form
        refund_dict = {
            "meetingId": refund_dict_data.get("meetingId"),
            "userId": current_user_data["id"],
            "reason": refund_dict_data.get("reason"),
        }

        print(f"Processing refund request with data: {refund_dict}")

        # Upload the file if provided
        if file and file.filename:
            file_manager = FileManager()
            file_id = await file_manager.upload_file(file, folder="refund_documents")
            refund_dict["fileId"] = file_id

        refund_request = await refund_manager.create_refund_request(refund_dict)
        return refund_request
    except ValueError as e:
        print(f"ValueError in create_refund_request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in create_refund_request: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to create refund request: {str(e)}")


@router.get("/refunds/user", response_model=List[RefundRequest])
async def get_user_refund_requests(
    current_user_data: dict = Depends(get_current_user)
):
    """Get refund requests for current user"""
    refunds = await refund_manager.get_user_refund_requests(current_user_data["id"])
    return refunds


@router.get("/refunds/expert", response_model=List[RefundRequest])
async def get_expert_refund_requests(
    current_user_data: dict = Depends(get_current_user)
):
    """Get refund requests for current expert"""
    if current_user_data.get("role") != "expert":
        raise HTTPException(
            status_code=403, detail="Only experts can access this endpoint")

    if not current_user_data.get("expertId"):
        raise HTTPException(
            status_code=400, detail="User is not linked to an expert profile")

    refunds = await refund_manager.get_expert_refund_requests(current_user_data["expertId"])
    return refunds


@router.get("/refunds", response_model=List[RefundRequest])
async def get_all_refund_requests(
    current_user_data: dict = Depends(require_admin)
):
    """Get all refund requests (admin only)"""
    refunds = await refund_manager.get_all_refund_requests()
    return refunds


@router.put("/refunds/{refund_id}", response_model=RefundRequest)
async def update_refund_status(
    refund_id: str,
    update_data: RefundRequestUpdate,
    current_user_data: dict = Depends(require_admin)
):
    """Update a refund request status (admin only)"""
    try:
        refund = await refund_manager.update_refund_status(
            refund_id,
            update_data.status,
            update_data.adminNotes,
            current_user_data["id"]
        )

        if not refund:
            raise HTTPException(
                status_code=404, detail="Refund request not found")

        return refund
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update refund request: {str(e)}")


@router.get("/transactions/user", response_model=List[Transaction])
async def get_user_transactions(
    current_user_data: dict = Depends(get_current_user)
):
    """Get transactions for current user"""
    transactions = await transaction_manager.get_user_transactions(current_user_data["id"])
    return transactions


@router.get("/transactions/expert", response_model=List[Transaction])
async def get_expert_transactions(
    current_user_data: dict = Depends(get_current_user)
):
    """Get transactions for current expert"""
    if current_user_data.get("role") != "expert":
        raise HTTPException(
            status_code=403, detail="Only experts can access this endpoint")

    if not current_user_data.get("expertId"):
        raise HTTPException(
            status_code=400, detail="User is not linked to an expert profile")

    transactions = await transaction_manager.get_expert_transactions(current_user_data["expertId"])
    return transactions
