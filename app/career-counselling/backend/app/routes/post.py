from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.models.post import PostResponse
from app.models.comment import Comment, CommentCreate, CommentResponse
from app.managers.post import PostManager
from app.managers.comment import CommentManager
from app.managers.community import CommunityManager
from app.managers.notification import NotificationManager
from app.core.auth_utils import get_current_user, require_user, get_optional_user
from datetime import datetime

router = APIRouter()
post_manager = PostManager()
comment_manager = CommentManager()
community_manager = CommunityManager()
notification_manager = NotificationManager()


class PostCommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None


class PostEditData(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class GeneralPostCreate(BaseModel):
    content: str
    title: Optional[str] = None
    tags: Optional[List[str]] = []


@router.post("/posts", response_model=PostResponse)
async def create_general_post(
    post_data: GeneralPostCreate,
    user_data: dict = Depends(require_user),
):
    """Create a post in c/general. Auto-joins the user to general if not already a member."""
    try:
        general = await community_manager.get_community("general")
        if not general:
            raise HTTPException(status_code=503, detail="c/general community not found. Please contact an admin.")

        general_id = general.communityId

        # Auto-join the user to c/general if not already a member
        await community_manager.join_community(general_id, user_data["id"])

        # Use provided title or derive one from content
        title = (post_data.title or "").strip()
        if not title:
            words = post_data.content.split()
            title = " ".join(words[:12]) + ("…" if len(words) > 12 else "")

        post = await post_manager.create_community_post(
            community_id=general_id,
            author_id=user_data["id"],
            title=title,
            content=post_data.content,
            tags=post_data.tags or [],
        )
        await community_manager.increment_post_count(general_id)

        # Notify followers if the author is an expert
        if user_data.get("role") == "expert":
            await notification_manager.create_post_notification_for_followers(
                expert_user_id=user_data["id"],
                post_id=post.postId,
                post_content=post_data.content,
            )

        return post
    except HTTPException:
        raise
    except Exception as e:
        print(f"create_general_post error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")


@router.get("/posts", response_model=List[PostResponse])
async def list_posts(community_id: Optional[str] = None, skip: int = 0, limit: int = 50):
    """List posts, optionally scoped to a community."""
    if community_id:
        return await post_manager.get_posts_by_community(community_id, skip, limit)
    return await post_manager.get_all_posts(skip, limit)

@router.get("/posts/feed", response_model=List[PostResponse])
async def get_feed(skip: int = 0, limit: int = 30, user_data: Optional[dict] = Depends(get_optional_user)):
    """Get posts from communities the current user has joined."""
    try:
        if user_data:
            return await post_manager.get_feed_posts(user_data["id"], skip, limit)
        return []
    except Exception as e:
        print(f"get_feed error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get feed")


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """Get a single post by ID."""
    post = await post_manager.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, user_data: dict = Depends(require_user)):
    """Like or unlike a post."""
    updated = await post_manager.like_post(post_id, user_data["id"])
    if not updated:
        raise HTTPException(status_code=404, detail="Post not found")
    return updated


@router.post("/posts/{post_id}/comment", response_model=CommentResponse)
async def comment_on_post(
    post_id: str,
    comment_data: PostCommentCreate,
    user_data: dict = Depends(require_user),
):
    """Add a comment to a post."""
    comment = Comment(
        content=comment_data.content,
        type="post",
        page_id=post_id,
        parent_id=comment_data.parent_id,
        userID=user_data["email"],
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    return await comment_manager.create_comment(comment)


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_post_comments(post_id: str, skip: int = 0, limit: int = 50):
    """Get all comments for a post."""
    result = await comment_manager.get_comments(post_id, "post", skip, limit)
    return result.get("comments", [])


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_data: dict = Depends(require_user)):
    """Delete a post. Any user can delete their own posts."""
    success = await post_manager.delete_post(post_id, user_data["id"])
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Post not found or you don't have permission to delete it",
        )
    return {"message": "Post deleted successfully"}


@router.put("/posts/{post_id}", response_model=PostResponse)
async def edit_post(post_id: str, edit_data: PostEditData, user_data: dict = Depends(require_user)):
    """Edit a post's title, content, or tags. Only the author can edit."""
    updated = await post_manager.edit_post(post_id, user_data["id"], edit_data.dict(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Post not found or you don't have permission to edit it")
    return updated


@router.post("/posts/{post_id}/view")
async def track_post_view(post_id: str):
    """Track a view event for a post."""
    success = await post_manager.increment_view(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found or view tracking failed")
    return {"message": "View tracked successfully"}