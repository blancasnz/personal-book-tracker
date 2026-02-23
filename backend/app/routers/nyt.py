from fastapi import APIRouter, Query
from app.services.nyt_books import get_bestsellers, get_bestseller_lists

router = APIRouter(prefix="/nyt", tags=["nyt-books"])


@router.get("/bestsellers")
async def get_nyt_bestsellers(
    list_name: str = Query(
        "combined-print-and-e-book-fiction", description="NYT bestseller list name"
    )
):
    """
    Get current NYT bestsellers.

    Popular list names:
    - combined-print-and-e-book-fiction
    - combined-print-and-e-book-nonfiction
    - hardcover-fiction
    - hardcover-nonfiction
    - young-adult-hardcover
    - childrens-middle-grade-hardcover
    """
    books = await get_bestsellers(list_name)
    return {"list_name": list_name, "results": books, "count": len(books)}


@router.get("/lists")
async def get_available_lists():
    """Get all available NYT bestseller list names"""
    lists = await get_bestseller_lists()
    return {"results": lists, "count": len(lists)}
