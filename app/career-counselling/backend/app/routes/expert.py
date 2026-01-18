from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from app.models.expert import Expert, ExpertResponse, ExpertUpdate
from app.managers.expert import ExpertManager
from app.core.auth_utils import get_current_user

router = APIRouter()
expert_manager = ExpertManager()


@router.post("/experts", response_model=Expert)
async def create_expert(expert: Expert):
    """Create a new expert profile"""
    return await expert_manager.create_expert(expert)


@router.get("/experts", response_model=dict)
async def list_experts(
    page: int = 1,
    limit: int = 10,
    sortBy: Optional[str] = None,
    available: Optional[bool] = None
):
    """
    Get a list of experts with pagination, sorting and filtering
    
    - **page**: Page number (starts at 1)
    - **limit**: Number of items per page
    - **sortBy**: Sort experts by "meetingCost", "rating", or "studentsGuided"
    - **available**: Filter to show only available experts if true
    """
    # Calculate skip based on page number and limit
    skip = (page - 1) * limit

    # Get paginated experts with sorting and filtering
    experts, total = await expert_manager.get_experts(
        skip=skip, 
        limit=limit, 
        sortBy=sortBy, 
        available=available
    )

    # Calculate total pages
    total_pages = (total + limit - 1) // limit

    return {
        "experts": experts,
        "total": total,
        "totalPages": total_pages,
        "page": page,
        "limit": limit
    }


@router.get("/experts/{expert_id}", response_model=ExpertResponse)
async def get_expert_profile(expert_id: str):
    """Get a specific expert's profile by ID"""
    expert = await expert_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    return expert


@router.put("/experts/{expert_id}", response_model=ExpertResponse)
async def update_expert_profile(
    expert_id: str,
    expert_update: ExpertUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update an expert's profile. Only the expert themselves or an admin can update the profile.
    """
    # Get current expert profile
    expert = await expert_manager.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")

    # Security check: only the expert themselves or admins can update
    if expert.userId != current_user["id"] and not current_user.get("isAdmin", False):
        raise HTTPException(
            status_code=403, detail="You don't have permission to update this profile")

    updated_expert = await expert_manager.update_expert(expert_id, expert_update)
    if not updated_expert:
        raise HTTPException(
            status_code=500, detail="Failed to update expert profile")

    return updated_expert


@router.get("/by-user/{user_id}", response_model=dict)
async def get_expert_by_user_id(user_id: str):
    """
    Get expert ID for a specific user ID if the user is an expert.
    """
    try:
        # Find the expert entry associated with this user ID
        expert = await expert_manager.get_expert_by_user_id(user_id)
        if not expert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No expert found for this user ID"
            )

        return {
            "expertId": expert.expertID,
            "name": f"{expert.userDetails.firstName} {expert.userDetails.lastName}",
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving expert by user ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve expert information"
        )
