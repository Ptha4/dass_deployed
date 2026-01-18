from fastapi import APIRouter, Query
from app.models.search import SearchType, SearchResult
from app.managers.search import SearchManager

router = APIRouter()
search_manager = SearchManager()


@router.get("/search", response_model=SearchResult)
async def search(
    q: str = Query(..., min_length=1, description="Search query string"),
    type: SearchType = Query(
        SearchType.ALL, description="Type of content to search"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        10, ge=1, le=50, description="Maximum number of records to return")
):
    """
    Search across different types of content.

    This endpoint allows searching across blogs, videos, experts, and colleges.
    Results can be filtered by type and paginated.

    Args:
        q: Search query string
        type: Type of content to search (all, blog, video, expert, college)
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return

    Returns:
        SearchResult containing matched items by type
    """
    return await search_manager.search(
        query=q,
        search_type=type,
        skip=skip,
        limit=limit
    )
