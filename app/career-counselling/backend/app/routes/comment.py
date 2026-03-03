from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any
from app.models.comment import Comment, CommentCreate, CommentResponse
from app.managers.comment import CommentManager
from app.core.auth_utils import get_current_user
from datetime import datetime

router = APIRouter()

comment_manager = CommentManager()

@router.post("/comments", response_model=CommentResponse)
async def create_comment(comment_data: CommentCreate, user_data: dict = Depends(get_current_user)):
    # Create a new comment object with all required fields
    comment = Comment(
        content=comment_data.content,
        type=comment_data.type,
        page_id=comment_data.page_id,
        parent_id=comment_data.parent_id,  # Include parent_id for replies
        userID=user_data["email"],
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    return await comment_manager.create_comment(comment)

@router.get("/comments", response_model=Dict[str, Any])
async def list_comments(
    page_id: str,
    type: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of records per page"),
):
    skip = (page - 1) * limit
    return await comment_manager.get_comments(page_id=page_id, type=type, skip=skip, limit=limit)
