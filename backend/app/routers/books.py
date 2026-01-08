from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.book import Book, BookCreate, BookUpdate
from app.crud import book as crud_book

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/", response_model=List[Book])
def get_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get all books with pagination"""
    books = crud_book.get_books(db, skip=skip, limit=limit)
    return books


@router.get("/search", response_model=List[Book])
def search_books(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search books by title or author"""
    books = crud_book.search_books(db, query=q, skip=skip, limit=limit)
    return books


@router.get("/{book_id}", response_model=Book)
def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID"""
    book = crud_book.get_book(db, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post("/", response_model=Book, status_code=201)
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    """Create a new book"""
    # Check if ISBN already exists
    if book.isbn:
        existing = crud_book.get_book_by_isbn(db, isbn=book.isbn)
        if existing:
            raise HTTPException(
                status_code=400, detail="Book with this ISBN already exists"
            )

    return crud_book.create_book(db, book=book)


@router.patch("/{book_id}", response_model=Book)
def update_book(book_id: int, book_update: BookUpdate, db: Session = Depends(get_db)):
    """Update a book"""
    book = crud_book.update_book(db, book_id=book_id, book_update=book_update)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.delete("/{book_id}", status_code=204)
def delete_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book"""
    success = crud_book.delete_book(db, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")
    return None
