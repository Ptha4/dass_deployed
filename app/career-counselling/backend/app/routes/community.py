from fastapi import APIRouter, HTTPException, Depends, UploadFile, File as FastAPIFile
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId
from app.models.community import CommunityCreate, CommunityResponse
from app.managers.community import CommunityManager
from app.managers.post import PostManager
from app.managers.file import FileManager
from app.core.auth_utils import get_current_user, require_user, get_optional_user

router = APIRouter()
community_manager = CommunityManager()
post_manager = PostManager()
file_manager = FileManager()


# ── Community endpoints ───────────────────────────────────────────────────────

@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(
    skip: int = 0,
    limit: int = 50,
    user_data: Optional[dict] = Depends(get_optional_user),
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


@router.get("/communities/user/joined", response_model=List[CommunityResponse])
async def get_user_joined_communities(user_data: dict = Depends(require_user)):
    """Get all communities the current user has joined."""
    try:
        return await community_manager.get_user_communities(user_data["id"])
    except Exception as e:
        print(f"get_user_joined_communities error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get joined communities")


@router.get("/communities/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: str,
    user_data: Optional[dict] = Depends(get_optional_user),
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
    """Get all posts for a specific community (supports ID or slug)."""
    try:
        # Resolve slug or ID to the actual ObjectId string
        community = await community_manager.get_community(community_id)
        actual_id = community.communityId if community else community_id
        posts = await post_manager.get_posts_by_community(actual_id, skip, limit)
        return posts
    except Exception as e:
        print(f"get_community_posts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve posts")


class MediaItem(BaseModel):
    url: str
    type: str
    fileId: str

class CommunityPostCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []
    media: Optional[List[MediaItem]] = []


@router.post("/communities/{community_id}/posts")
async def create_community_post(
    community_id: str,
    post_data: CommunityPostCreate,
    user_data: dict = Depends(require_user),
):
    """Create a new post within a community (supports ID or slug)."""
    try:
        # Verify community exists (supports both ObjectId and slug)
        community = await community_manager.get_community(community_id)
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")

        # Always use the resolved ObjectId for DB operations
        actual_community_id = community.communityId

        # Verify user is a member
        community_doc = await community_manager.collection.find_one(
            {"_id": ObjectId(actual_community_id), "members": user_data["id"]}
        )
        if not community_doc:
            raise HTTPException(status_code=403, detail="You must join this community before posting")

        post = await post_manager.create_community_post(
            community_id=actual_community_id,
            author_id=user_data["id"],
            title=post_data.title,
            content=post_data.content,
            tags=post_data.tags or [],
            media=[m.dict() for m in (post_data.media or [])],
        )

        # Update post count on community
        await community_manager.increment_post_count(actual_community_id)

        return post
    except HTTPException:
        raise
    except Exception as e:
        print(f"create_community_post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")


ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_VIDEO_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/communities/upload-media")
async def upload_post_media(
    file: UploadFile = FastAPIFile(...),
    user_data: dict = Depends(require_user),
):
    """Upload an image or short video for a community post."""
    content_type = file.content_type or ""

    if content_type in ALLOWED_IMAGE_TYPES:
        media_type = "image"
        max_size = MAX_IMAGE_SIZE
    elif content_type in ALLOWED_VIDEO_TYPES:
        media_type = "video"
        max_size = MAX_VIDEO_SIZE
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM."
        )

    file_id = await file_manager.upload_file(
        file,
        folder="post-media",
        allowed_types=ALLOWED_IMAGE_TYPES + ALLOWED_VIDEO_TYPES,
        max_size=max_size,
    )

    return {
        "fileId": file_id,
        "url": f"/api/files/{file_id}",
        "type": media_type,
    }
