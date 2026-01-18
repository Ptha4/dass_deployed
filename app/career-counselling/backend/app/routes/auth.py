from fastapi import APIRouter, HTTPException, Depends
from app.models.user import UserSignUp, UserLogin
from app.managers.auth import AuthManager
from app.managers.user import UserManager
from app.core.auth_utils import get_token, require_admin, require_expert, require_user, get_current_user

router = APIRouter()
auth_manager = AuthManager()
user_manager = UserManager()


@router.post("/signup")
async def signup(user_data: UserSignUp):
    """
    Register a new user, hash their password, and return a JWT token.
    Requires email, password, first name, last name, and middle name.
    """
    existing_user = await user_manager.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=400, detail="User with this email already exists")

    token = await auth_manager.signup(user_data)
    if not token:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    # Log new user registration
    new_user = await user_manager.get_user_by_email(user_data.email)
    if new_user:
        await user_manager.log_activity(
            activity_type="user_registration",
            description=f"New user registered: {user_data.firstName} {user_data.lastName}",
            user_id=str(new_user.id)
        )

    return {"token": token}


@router.post("/login")
async def login(user_login: UserLogin):
    """
    Authenticate a user, verify credentials, and return a JWT token.
    Only requires email and password.
    """
    token = await auth_manager.login(user_login)
    if not token:
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    return {"token": token}


@router.get("/role")
async def get_user_role(user_data: dict = Depends(get_current_user)):
    """
    Get the role of the current user based on the JWT token.
    """
    return {"role": user_data["role"]}
