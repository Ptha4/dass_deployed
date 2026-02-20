from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.models.community import CommunityCreate, CommunityResponse
from app.managers.community import CommunityManager
from app.managers.post import PostManager
from app.core.auth_utils import get_current_user, require_user

router = APIRouter()
community_manager = CommunityManager()
post_manager = PostManager()


# ── Community endpoints ───────────────────────────────────────────────────────

@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(
    skip: int = 0,
    limit: int = 50,
    user_data: Optional[dict] = Depends(get_current_user),
):
    """List all communities (public). Includes isJoined status if authenticated."""
    try:
        user_id = user_data["id"] if user_data else None
        return await community_manager.list_communities(skip, limit, user_id)
    except Exception as e:
        print(f"list_communities error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list communities")


@router.post("/communities", response_model=CommunityResponse)
async def create_community(data: CommunityCreate, user_data: dict = Depends(require_user)):
    """Create a new community. Requires login. Creator auto-joins."""
    try:
        return await community_manager.create_community(data, user_data["id"])
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        print(f"create_community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create community")


@router.get("/communities/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: str,
    user_data: Optional[dict] = Depends(get_current_user),
):
    """Get a single community by ID or slug."""
    try:
        user_id = user_data["id"] if user_data else None
        community = await community_manager.get_community(community_id, user_id)
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")
        return community
    except HTTPException:
        raise
    except Exception as e:
        print(f"get_community error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get community")


@router.post("/communities/{community_id}/join")
async def join_community(community_id: str, user_data: dict = Depends(require_user)):
    """Join a community."""
    success = await community_manager.join_community(community_id, user_data["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Could not join community")
    return {"message": "Joined community successfully"}


@router.post("/communities/{community_id}/leave")
async def leave_community(community_id: str, user_data: dict = Depends(require_user)):
    """Leave a community."""
    success = await community_manager.leave_community(community_id, user_data["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Could not leave community")
    return {"message": "Left community successfully"}


# ── Post endpoints scoped to a community ─────────────────────────────────────

@router.get("/communities/{community_id}/posts")
async def get_community_posts(
    community_id: str,
    skip: int = 0,
    limit: int = 30,
):
    """Get all posts for a specific community."""
    try:
        posts = await post_manager.get_posts_by_community(community_id, skip, limit)
        return posts
    except Exception as e:
        print(f"get_community_posts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve posts")


class CommunityPostCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []


@router.post("/communities/{community_id}/posts")
async def create_community_post(
    community_id: str,
    post_data: CommunityPostCreate,
    user_data: dict = Depends(require_user),
):
    """Create a new post within a community."""
    try:
        # Verify community exists
        community = await community_manager.get_community(community_id)
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")

        post = await post_manager.create_community_post(
            community_id=community_id,
            author_id=user_data["id"],
            title=post_data.title,
            content=post_data.content,
            tags=post_data.tags or [],
        )

        # Update post count on community
        await community_manager.increment_post_count(community_id)

        return post
    except HTTPException:
        raise
    except Exception as e:
        print(f"create_community_post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")
