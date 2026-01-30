from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.book_list import BookList, BookListItem
from app.models.book import Book as BookModel

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


@router.get("/check")
async def check_book_exists(
    isbn: Optional[str] = Query(None),
    title: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Check if a book exists in the user's library
    Returns the book and which lists it's in with status info
    """
    book = None

    # Try to find by ISBN first (most accurate)
    if isbn:
        book = crud_book.get_book_by_isbn(db, isbn=isbn)

    # If not found and we have title/author, try that
    if not book and title and author:
        books = (
            db.query(BookModel)
            .filter(
                BookModel.title.ilike(f"%{title}%"),
                BookModel.author.ilike(f"%{author}%"),
            )
            .all()
        )
        if books:
            book = books[0]

    if not book:
        return {"exists": False, "book": None, "lists": []}

    # Get which lists this book is in with status
    book_list_items = (
        db.query(BookListItem).filter(BookListItem.book_id == book.id).all()
    )

    list_ids = [item.book_list_id for item in book_list_items]
    lists_data = []
    
    if list_ids:
        lists = db.query(BookList).filter(BookList.id.in_(list_ids)).all()
        # Create a map of list_id to list name
        list_map = {l.id: l.name for l in lists}
        
        # Build response with list name, status, and item_id
        for item in book_list_items:
            lists_data.append({
                "id": item.book_list_id,
                "name": list_map.get(item.book_list_id, "Unknown"),
                "status": item.status.value,  # to_read, reading, finished
                "item_id": item.id,  # Need this for updating
                "rating": item.rating,
                "is_favorite": item.is_favorite,
            })

    return {
        "exists": True,
        "book": book,
        "lists": lists_data,
    }


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
    """Update a book's details including genres"""
    updated_book = crud_book.update_book(db, book_id, book_update)
    if not updated_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return updated_book


@router.delete("/{book_id}", status_code=204)
def delete_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book"""
    success = crud_book.delete_book(db, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")
    return None