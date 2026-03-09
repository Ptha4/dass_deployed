#!/usr/bin/env python3
"""
Seed the MongoDB database with a set of default communities.
Run once from the backend directory:
  python seed_communities.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from app.config import settings

DEFAULT_COMMUNITIES = [
    {
        "name": "general",
        "displayName": "General",
        "description": "A place for all topics — career questions, introductions, and anything else that doesn't fit a specific community.",
        "iconColor": "#6366f1",
    },
    {
        "name": "career-guidance",
        "displayName": "Career Guidance",
        "description": "Get advice on choosing the right career path, skill development, and career transitions.",
        "iconColor": "#6366f1",
    },
    {
        "name": "engineering-students",
        "displayName": "Engineering Students",
        "description": "A community for engineering students to discuss academics, projects, and career opportunities.",
        "iconColor": "#ec4899",
    },
    {
        "name": "college-admissions",
        "displayName": "College Admissions",
        "description": "Tips, strategies, and discussions around college applications, entrance exams, and admissions.",
        "iconColor": "#10b981",
    },
    {
        "name": "interview-prep",
        "displayName": "Interview Prep",
        "description": "Share resources, mock interview tips, and success stories for technical and HR interviews.",
        "iconColor": "#f59e0b",
    },
    {
        "name": "study-abroad",
        "displayName": "Study Abroad",
        "description": "Discuss opportunities for studying abroad, scholarships, visa requirements, and university choices.",
        "iconColor": "#3b82f6",
    },
    {
        "name": "placements",
        "displayName": "Campus Placements",
        "description": "Discuss campus recruitment drives, placement strategies, and company experiences.",
        "iconColor": "#8b5cf6",
    },
    {
        "name": "entrepreneurship",
        "displayName": "Entrepreneurship",
        "description": "For budding entrepreneurs to discuss startups, business ideas, funding, and growth strategies.",
        "iconColor": "#ef4444",
    },
    {
        "name": "higher-education",
        "displayName": "Higher Education",
        "description": "Discussions about master's programs, PhD opportunities, and further education choices.",
        "iconColor": "#14b8a6",
    },
]


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    communities_col = db.communities

    now = datetime.now(timezone.utc)
    created_count = 0
    skipped_count = 0

    for comm in DEFAULT_COMMUNITIES:
        existing = await communities_col.find_one({"name": comm["name"]})
        if existing:
            print(f"  ⏭  Skipping '{comm['name']}' (already exists)")
            skipped_count += 1
            continue

        doc = {
            **comm,
            "createdBy": "system",
            "memberCount": 0,
            "postCount": 0,
            "members": [],
            "createdAt": now,
            "updatedAt": now,
        }
        result = await communities_col.insert_one(doc)
        print(f"  ✅ Created '{comm['name']}' → {result.inserted_id}")
        created_count += 1

    client.close()
    print(f"\nDone: {created_count} created, {skipped_count} skipped.")


if __name__ == "__main__":
    asyncio.run(seed())
