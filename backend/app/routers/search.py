from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.google_books import search_google_books
from app.schemas.book import Book, BookCreate
from app.crud import book as crud_book
from app.services.open_library import search_open_library_editions

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/external")
async def search_external_books(
    q: str = Query(..., min_length=1, description="Search query"),
    max_results: int = Query(20, ge=1, le=40),
):
    """
    Search for books using Google Books API
    Returns book data that can be added to the database
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    books = await search_google_books(q, max_results)
    return {"query": q, "results": books, "count": len(books)}


@router.post("/external/add", response_model=Book, status_code=201)
async def add_external_book_to_db(book_data: BookCreate, db: Session = Depends(get_db)):
    """
    Add a book from external search results to the database
    Checks for duplicates by ISBN first, updates if exists
    """
    if book_data.isbn:
        existing = crud_book.get_book_by_isbn(db, isbn=book_data.isbn)
        if existing:
            # Update existing book with new data
            existing.title = book_data.title
            existing.author = book_data.author
            existing.cover_url = book_data.cover_url
            existing.description = book_data.description
            existing.published_year = book_data.published_year
            existing.page_count = book_data.page_count
            existing.format = book_data.format
            existing.edition = book_data.edition

            # Handle genres - convert list to comma-separated string
            if book_data.genres:
                existing.genres = ",".join(
                    book_data.genres
                )  # ← This converts list to string
            else:
                existing.genres = None

            db.commit()
            db.refresh(existing)
            return existing

    # Create new book
    return crud_book.create_book(db, book=book_data)


@router.get("/editions")
async def get_book_editions(
    title: str = Query(..., description="Book title"),
    author: str = Query(..., description="Book author"),
):
    """
    Get all available editions of a book from Open Library
    """
    editions = await search_open_library_editions(title, author)
    return {
        "title": title,
        "author": author,
        "editions": editions,
        "count": len(editions),
    }
