"""
Main FastAPI application configuration
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import blog, branch, college_branch, college, expert, search, user, video, auth, comment, post, admin, expert_analytics, notification, rating, expert_application, file, chatbot, meeting, community, activity
from app.managers.user import UserManager
from app.config import settings

app = FastAPI(title="AlumNiti API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(blog.router, tags=["blogs"], prefix="/api")
app.include_router(branch.router, tags=["branch"], prefix="/api")
app.include_router(college_branch.router, tags=[
                   "college_branch"], prefix="/api")
app.include_router(college.router, tags=["college"], prefix="/api")
app.include_router(expert.router, tags=["expert"], prefix="/api")
app.include_router(expert_application.router, tags=[
                   "expert_application"], prefix="/api")
app.include_router(file.router, tags=["file"], prefix="/api")
app.include_router(search.router, tags=["search"], prefix="/api")
app.include_router(user.router, tags=["user"], prefix="/api")
app.include_router(video.router, tags=["video"], prefix="/api")
app.include_router(auth.router, tags=["auth"], prefix="/api")
app.include_router(comment.router, tags=["comment"], prefix="/api")
app.include_router(post.router, tags=["post"], prefix="/api")
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(expert_analytics.router, tags=[
                   "expert_analytics"], prefix="/api")
app.include_router(notification.router, tags=["notification"], prefix="/api")
app.include_router(rating.router, tags=["rating"], prefix="/api")
app.include_router(chatbot.router, tags=["chatbot"], prefix="/api/chatbot")
app.include_router(meeting.router, tags=["meeting"], prefix="/api")
app.include_router(community.router, tags=["community"], prefix="/api")
app.include_router(activity.router, tags=["activity"], prefix="/api")


from app.managers.community import CommunityManager

@app.on_event("startup")
async def startup_db_client():
    """Initialize database on startup"""
    # Ensure all users have a wallet
    user_manager = UserManager()
    await user_manager.initialize_wallet_for_existing_users()
    
    # Seed default communities
    community_manager = CommunityManager()
    await community_manager.seed_default_communities()


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/")
async def root():
    return {"message": "AlumNiti API"}
