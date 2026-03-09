"""
Daily.co integration service for creating video meeting rooms and generating tokens.
"""
import httpx
from typing import Optional
from app.config import settings


DAILY_API_BASE = "https://api.daily.co/v1"


async def create_daily_room(room_name: str, expiry_minutes: int = 120) -> Optional[dict]:
    """
    Create a new Daily.co room for a meeting.

    Args:
        room_name: Unique name for the room (e.g., "meeting-abc123")
        expiry_minutes: Minutes after which the room auto-expires

    Returns:
        dict with room details (url, name) or None on failure
    """
    if not settings.DAILY_API_KEY:
        print("DAILY_API_KEY not configured, skipping room creation")
        return {"url": f"https://career-counselor.daily.co/{room_name}", "name": room_name}

    headers = {
        "Authorization": f"Bearer {settings.DAILY_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "name": room_name,
        "privacy": "public",  # Free plan only supports public rooms; tokens still gate access
        "properties": {
            "enable_chat": True,
            "enable_screenshare": True,
            "max_participants": 2,
        },
    }

    try:
        print(f"[Daily.co] Creating room '{room_name}'...")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAILY_API_BASE}/rooms",
                headers=headers,
                json=payload,
                timeout=15.0,
            )
            print(f"[Daily.co] Room creation response: {response.status_code}")
            if response.status_code in (200, 201):
                data = response.json()
                print(f"[Daily.co] Room created: {data.get('url')}")
                return {"url": data["url"], "name": data["name"]}
            else:
                print(f"[Daily.co] Room creation failed: {response.status_code} {response.text}")
                return None
    except Exception as e:
        print(f"[Daily.co] Error creating room: {e}")
        return None


async def create_meeting_token(
    room_name: str,
    user_name: str,
    is_owner: bool = False,
    expiry_minutes: int = 120,
) -> Optional[str]:
    """
    Generate a meeting token for a user to join a specific Daily.co room.

    Args:
        room_name: The Daily.co room name
        user_name: Display name for the participant
        is_owner: If True, grants host/owner privileges
        expiry_minutes: Token validity in minutes

    Returns:
        Token string or None on failure
    """
    if not settings.DAILY_API_KEY:
        print("DAILY_API_KEY not configured, returning placeholder token")
        return "placeholder-token"

    headers = {
        "Authorization": f"Bearer {settings.DAILY_API_KEY}",
        "Content-Type": "application/json",
    }

    import time

    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": user_name,
            "is_owner": is_owner,
            "exp": int(time.time()) + (expiry_minutes * 60),
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAILY_API_BASE}/meeting-tokens",
                headers=headers,
                json=payload,
                timeout=10.0,
            )
            if response.status_code == 200:
                return response.json().get("token")
            else:
                print(f"Daily.co token creation failed: {response.status_code} {response.text}")
                return None
    except Exception as e:
        print(f"Error creating Daily.co meeting token: {e}")
        return None


async def delete_daily_room(room_name: str) -> bool:
    """
    Delete a Daily.co room.

    Args:
        room_name: The room name to delete

    Returns:
        True if successful, False otherwise
    """
    if not settings.DAILY_API_KEY:
        return True

    headers = {
        "Authorization": f"Bearer {settings.DAILY_API_KEY}",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{DAILY_API_BASE}/rooms/{room_name}",
                headers=headers,
                timeout=10.0,
            )
            return response.status_code in (200, 204, 404)
    except Exception as e:
        print(f"Error deleting Daily.co room: {e}")
        return False
