"""
Socket.IO server instance and connection management.
Clients authenticate by passing their JWT as the `token` query parameter.
Each authenticated user joins a personal room named after their user ID,
so notifications can be pushed with sio.emit("notification", data, room=user_id).
"""

import socketio
import jwt as pyjwt
from app.config import settings

# Single async Socket.IO server — CORS is inherited from FastAPI middleware,
# but we must list origins here too so the Socket.IO handshake doesn't get blocked.
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)


@sio.event
async def connect(sid, environ, auth):
    """
    Called when a client connects.
    Expects auth={'token': '<jwt>'} from the client.
    Joins the user to their personal room on success.
    """
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    if not token:
        # Also try query string fallback (?token=...)
        query = environ.get("QUERY_STRING", "")
        for part in query.split("&"):
            if part.startswith("token="):
                token = part[len("token="):]
                break

    if not token:
        print(f"Socket connection rejected (no token): sid={sid}")
        return False  # reject

    try:
        payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("id") or payload.get("sub")
        if not user_id:
            return False
        await sio.enter_room(sid, user_id)
        await sio.save_session(sid, {"user_id": user_id})
        print(f"Socket connected: sid={sid}, user_id={user_id}")
    except pyjwt.ExpiredSignatureError:
        print(f"Socket connection rejected (expired token): sid={sid}")
        return False
    except pyjwt.PyJWTError as e:
        print(f"Socket connection rejected (invalid token): sid={sid}, error={e}")
        return False


@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else "unknown"
    print(f"Socket disconnected: sid={sid}, user_id={user_id}")
