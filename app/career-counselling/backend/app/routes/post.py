from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.models.post import Post, PostResponse, PostCreate, PostLike
from app.models.comment import Comment, CommentCreate, CommentResponse
from app.managers.post import PostManager
from app.managers.comment import CommentManager
from app.managers.expert import ExpertManager
from app.core.auth_utils import get_current_user, require_user, require_expert
from datetime import datetime

router = APIRouter()
post_manager = PostManager()
comment_manager = CommentManager()
expert_manager = ExpertManager()


class PostCommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None


@router.post("/posts", response_model=PostResponse)
async def create_post(post_data: PostCreate, user_data: dict = Depends(require_expert)):
    """
    Create a new post (experts only)
    """
    # Verify the expert is creating a post for their own profile
    try:
        expert = await expert_manager.get_expert_by_user_id(user_data["id"])
        if not expert or expert.expertID != post_data.expertId:
            raise HTTPException(
                status_code=403,
                detail="You can only create posts for your own expert profile"
            )
        
        post = Post(
            content=post_data.content,
            expertId=post_data.expertId,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
            likes=0,
            likedBy=[]
        )
        
        created_post = await post_manager.create_post(post)
        return created_post
    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create post"
        )


@router.get("/posts")
async def get_all_posts(skip: int = 0, limit: int = 50):
    """
    Get all posts from all experts (public endpoint)
    """
    try:
        posts = await post_manager.get_all_posts(skip=skip, limit=limit)
        return posts
    except Exception as e:
        print(f"Error retrieving all posts: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve posts"
        )


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """
    Get a single post by ID
    """
    try:
        post = await post_manager.get_post(post_id)
        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )
        return post
    except Exception as e:
        print(f"Error retrieving post: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve post"
        )


@router.get("/experts/{expert_id}/posts", response_model=List[PostResponse])
async def get_expert_posts(expert_id: str):
    """
    Get all posts by a specific expert
    """
    try:
        posts = await post_manager.get_posts_by_expert(expert_id)
        return posts
    except Exception as e:
        print(f"Error retrieving posts: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve posts"
        )


@router.post("/posts/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, user_data: dict = Depends(require_user)):
    """
    Like or unlike a post
    """
    try:
        updated_post = await post_manager.like_post(post_id, user_data["id"])
        if not updated_post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )
        return updated_post
    except Exception as e:
        print(f"Error liking post: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to like post"
        )


@router.post("/posts/{post_id}/comment", response_model=CommentResponse)
async def comment_on_post(post_id: str, comment_data: PostCommentCreate, user_data: dict = Depends(require_user)):
    """
    Add a comment to a post
    """
    try:
        # Create comment with post type
        comment = Comment(
            content=comment_data.content,
            type="post",
            page_id=post_id,
            parent_id=comment_data.parent_id,
            userID=user_data["email"],  # CommentManager expects email
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        created_comment = await comment_manager.create_comment(comment)
        return created_comment
    except Exception as e:
        print(f"Error creating comment: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create comment"
        )


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_post_comments(post_id: str, skip: int = 0, limit: int = 50):
    """
    Get all comments for a post
    """
    try:
        result = await comment_manager.get_comments(post_id, "post", skip, limit)
        return result.get("comments", [])
    except Exception as e:
        print(f"Error retrieving comments: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve comments"
        )


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_data: dict = Depends(require_expert)):
    """
    Delete a post (expert can only delete their own posts)
    """
    try:
        # Get the expert ID for the logged-in user
        expert = await expert_manager.get_expert_by_user_id(user_data["id"])
        if not expert:
            raise HTTPException(
                status_code=403,
                detail="Only experts can delete posts"
            )
        
        success = await post_manager.delete_post(post_id, expert.expertID)
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Post not found or you don't have permission to delete it"
            )
        
        return {"message": "Post deleted successfully"}
    except Exception as e:
        print(f"Error deleting post: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete post"
        )


@router.post("/posts/{post_id}/view")
async def track_post_view(post_id: str):
    """
    Track a view event for a post.
    """
    try:
        success = await post_manager.increment_view(post_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Post not found or view tracking failed"
            )
        
        return {"message": "View tracked successfully"}
    except Exception as e:
        print(f"Error tracking post view: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to track post view"
        )