"""
Meeting API routes for booking, listing, joining, and cancelling meetings.
"""
from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.managers.meeting import MeetingManager
from app.managers.expert import ExpertManager
from app.core.auth_utils import require_user, get_current_user
from app.services.daily_service import create_meeting_token

router = APIRouter()
meeting_manager = MeetingManager()
expert_manager = ExpertManager()


class BookMeetingRequest(BaseModel):
    expertId: str
    startTime: str  # ISO format datetime string
    endTime: str    # ISO format datetime string


@router.get("/experts/{expert_id}/slots")
async def get_available_slots(
    expert_id: str,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
):
    """
    Get available 1-hour meeting slots for an expert on a specific date.
    """
    try:
        # Verify expert exists
        expert = await expert_manager.get_expert(expert_id)
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")

        slots = await meeting_manager.get_available_slots(expert_id, date)
        return {"date": date, "expertId": expert_id, "slots": slots}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting available slots: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available slots")

@router.get("/experts/{expert_id}/availability")
async def get_month_availability(
    expert_id: str,
    year: int = Query(..., description="Year (e.g., 2024)"),
    month: int = Query(..., description="Month (1-12)"),
):
    """
    Get availability for an entire month.
    Returns a dictionary mapping 'YYYY-MM-DD' to boolean indicating if the 
    expert has at least one available slot that day.
    """
    try:
        # Verify expert exists
        expert = await expert_manager.get_expert(expert_id)
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")

        availability_map = await meeting_manager.get_month_availability(expert_id, year, month)
        return {"expertId": expert_id, "year": year, "month": month, "availability": availability_map}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting month availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to get month availability")


@router.post("/meetings/book")
async def book_meeting(
    request: BookMeetingRequest,
    user_data: dict = Depends(require_user),
):
    """
    Book a meeting with an expert. Deducts coins from the student's wallet
    and creates a Daily.co room for the video call.
    """
    try:
        # Get the current user
        from app.managers.user import UserManager
        user_manager = UserManager()
        user = await user_manager.get_user_by_email(user_data["email"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        start_time = datetime.fromisoformat(request.startTime)
        end_time = datetime.fromisoformat(request.endTime)

        # Server-side validation: reject bookings in the past
        if start_time < datetime.now():
            raise HTTPException(status_code=400, detail="Cannot book a slot in the past")

        meeting = await meeting_manager.book_meeting(
            expert_id=request.expertId,
            user_id=user.id,
            start_time=start_time,
            end_time=end_time,
        )

        if not meeting:
            raise HTTPException(status_code=500, detail="Failed to book meeting")

        return {
            "success": True,
            "message": "Meeting booked successfully",
            "meeting": meeting,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error booking meeting: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to book meeting: {str(e)}")


@router.get("/meetings/my")
async def get_my_meetings(
    status_filter: Optional[str] = Query(None, alias="status"),
    user_data: dict = Depends(require_user),
):
    """
    Get all meetings for the currently logged-in user (student).
    """
    try:
        from app.managers.user import UserManager
        user_manager = UserManager()
        user = await user_manager.get_user_by_email(user_data["email"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        meetings = await meeting_manager.get_all_meetings_for_user(user.id, status_filter)
        return {"meetings": meetings}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user meetings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get meetings")


@router.get("/meetings/expert/{expert_id}")
async def get_expert_meetings(
    expert_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    user_data: dict = Depends(require_user),
):
    """
    Get all meetings for an expert. Only the expert themselves can view this.
    """
    try:
        # Verify the caller is the expert
        expert = await expert_manager.get_expert(expert_id)
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")

        if expert.userId != user_data.get("id"):
            raise HTTPException(status_code=403, detail="You can only view your own meetings")

        meetings = await meeting_manager.get_expert_meetings(expert_id, status_filter)
        return {"meetings": meetings}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting expert meetings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get meetings")


@router.get("/meetings/{meeting_id}")
async def get_meeting(
    meeting_id: str,
    user_data: dict = Depends(require_user),
):
    """
    Get a single meeting by ID. Only participants can view it.
    """
    meeting = await meeting_manager.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Verify the caller is a participant
    from app.managers.user import UserManager
    user_manager = UserManager()
    user = await user_manager.get_user_by_email(user_data["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_student = meeting["userId"] == user.id
    is_expert = False
    expert = await expert_manager.get_expert(meeting["expertId"])
    if expert and expert.userId == user.id:
        is_expert = True

    if not is_student and not is_expert:
        raise HTTPException(status_code=403, detail="You are not a participant of this meeting")

    return meeting


@router.get("/meetings/{meeting_id}/token")
async def get_meeting_token(
    meeting_id: str,
    user_data: dict = Depends(require_user),
):
    """
    Get a Daily.co meeting token for joining a meeting.
    Only participants can request a token.
    """
    meeting = await meeting_manager.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="This meeting has been cancelled")

    # Determine if the caller is the student or the expert
    from app.managers.user import UserManager
    user_manager = UserManager()
    user = await user_manager.get_user_by_email(user_data["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_student = meeting["userId"] == user.id
    is_expert = False
    expert = await expert_manager.get_expert(meeting["expertId"])
    if expert and expert.userId == user.id:
        is_expert = True

    if not is_student and not is_expert:
        raise HTTPException(status_code=403, detail="You are not a participant of this meeting")

    user_name = f"{user.firstName} {user.lastName}"
    room_name = meeting.get("dailyRoomName", "")

    # Always verify room exists — old rooms may have been created with wrong
    # settings (private, enable_recording, etc.). Force re-creation when needed.
    # The room creation API is idempotent-safe (new name each time).
    needs_room = True  # Always create a fresh public room for reliability
    if needs_room:
        import uuid
        from app.services.daily_service import create_daily_room as _create_room
        from app.core.database import get_database
        room_name = f"meeting-{uuid.uuid4().hex[:12]}"
        room_data = await _create_room(room_name)
        daily_room_url = room_data["url"] if room_data else f"https://career-counselor.daily.co/{room_name}"
        daily_room_name = room_data["name"] if room_data else room_name
        # Persist so we don't recreate every time
        db = get_database()
        from bson import ObjectId as _OID
        await db.meetings.update_one(
            {"_id": _OID(meeting_id)},
            {"$set": {"dailyRoomUrl": daily_room_url, "dailyRoomName": daily_room_name}}
        )
        meeting["dailyRoomUrl"] = daily_room_url
        meeting["dailyRoomName"] = daily_room_name
        room_name = daily_room_name

    token = await create_meeting_token(
        room_name=room_name,
        user_name=user_name,
        is_owner=is_expert,  # Expert gets host privileges
    )

    if not token:
        raise HTTPException(status_code=500, detail="Failed to generate meeting token")

    return {
        "token": token,
        "roomUrl": meeting.get("dailyRoomUrl", ""),
        "roomName": room_name,
        "isOwner": is_expert,
    }


@router.post("/meetings/{meeting_id}/cancel")
async def cancel_meeting(
    meeting_id: str,
    user_data: dict = Depends(require_user),
):
    """
    Cancel a meeting. Refunds coins to the student's wallet.
    """
    try:
        from app.managers.user import UserManager
        user_manager = UserManager()
        user = await user_manager.get_user_by_email(user_data["email"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        success = await meeting_manager.cancel_meeting(meeting_id, user.id)
        if not success:
            raise HTTPException(status_code=400, detail="Unable to cancel meeting")

        return {"success": True, "message": "Meeting cancelled. Coins have been refunded."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling meeting: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel meeting")


class ExtendMeetingRequest(BaseModel):
    durationMinutes: int = 30


@router.post("/meetings/{meeting_id}/extend")
async def extend_meeting(
    meeting_id: str,
    request: ExtendMeetingRequest,
    user_data: dict = Depends(require_user),
):
    """
    Extend a meeting by a certain number of minutes. Costs coins.
    """
    try:
        from app.managers.user import UserManager
        user_manager = UserManager()
        user = await user_manager.get_user_by_email(user_data["email"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        success, message = await meeting_manager.extend_meeting(
            meeting_id, user.id, request.durationMinutes
        )
        if not success:
            raise HTTPException(status_code=400, detail=message)

        return {"success": True, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error extending meeting: {e}")
        raise HTTPException(status_code=500, detail="Failed to extend meeting")
