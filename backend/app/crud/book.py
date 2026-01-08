from sqlalchemy.orm import Session
from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate
from typing import List, Optional


def get_book(db: Session, book_id: int) -> Optional[Book]:
    """Get a single book by ID"""
    return db.query(Book).filter(Book.id == book_id).first()


def get_books(db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
    """Get all books with pagination"""
    return db.query(Book).offset(skip).limit(limit).all()


def get_book_by_isbn(db: Session, isbn: str) -> Optional[Book]:
    """Get a book by ISBN"""
    return db.query(Book).filter(Book.isbn == isbn).first()


def create_book(db: Session, book: BookCreate) -> Book:
    """Create a new book"""
    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def update_book(db: Session, book_id: int, book_update: BookUpdate) -> Optional[Book]:
    """Update an existing book"""
    db_book = get_book(db, book_id)
    if not db_book:
        return None

    # Update only provided fields
    update_data = book_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)

    db.commit()
    db.refresh(db_book)
    return db_book


def delete_book(db: Session, book_id: int) -> bool:
    """Delete a book"""
    db_book = get_book(db, book_id)
    if not db_book:
        return False

    db.delete(db_book)
    db.commit()
    return True


def search_books(db: Session, query: str, skip: int = 0, limit: int = 20) -> List[Book]:
    """Search books by title or author"""
    search_pattern = f"%{query}%"
    return (
        db.query(Book)
        .filter(
            (Book.title.ilike(search_pattern)) | (Book.author.ilike(search_pattern))
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
