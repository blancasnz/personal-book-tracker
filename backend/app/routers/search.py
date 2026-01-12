from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.google_books import search_google_books
from app.schemas.book import Book, BookCreate
from app.crud import book as crud_book

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
    Checks for duplicates by ISBN first
    """
    # Check if book already exists by ISBN
    if book_data.isbn:
        existing = crud_book.get_book_by_isbn(db, isbn=book_data.isbn)
        if existing:
            return existing  # Return existing book instead of creating duplicate

    # Create new book
    return crud_book.create_book(db, book=book_data)
