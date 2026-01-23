from sqlalchemy.orm import Session
from app.models.book import Book as BookModel
from app.schemas.book import BookCreate, BookUpdate
from typing import List, Optional


def get_book(db: Session, book_id: int) -> Optional[BookModel]:
    """Get a book by ID"""
    return db.query(BookModel).filter(BookModel.id == book_id).first()


def get_books(db: Session, skip: int = 0, limit: int = 100) -> List[BookModel]:
    """Get all books with pagination"""
    return db.query(BookModel).offset(skip).limit(limit).all()


def get_book_by_isbn(db: Session, isbn: str) -> Optional[BookModel]:
    """Get a book by ISBN"""
    return db.query(BookModel).filter(BookModel.isbn == isbn).first()


def create_book(db: Session, book: BookCreate) -> BookModel:
    """Create a new book"""
    book_data = book.model_dump()

    # Convert genres list to comma-separated string
    if book_data.get("genres"):
        book_data["genres"] = ",".join(book_data["genres"])
    else:
        book_data["genres"] = None

    db_book = BookModel(**book_data)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)

    # Don't modify the object - let Pydantic handle it
    return db_book


def update_book(
    db: Session, book_id: int, book_update: BookUpdate
) -> Optional[BookModel]:
    """Update an existing book"""
    db_book = get_book(db, book_id)
    if not db_book:
        return None

    # Update only provided fields
    update_data = book_update.model_dump(exclude_unset=True)

    # Convert genres list to comma-separated string if present
    if "genres" in update_data:
        if update_data["genres"]:
            update_data["genres"] = ",".join(update_data["genres"])
        else:
            update_data["genres"] = None

    for field, value in update_data.items():
        setattr(db_book, field, value)

    db.commit()
    db.refresh(db_book)

    # Parse genres back to list for response
    if db_book.genres:
        db_book.genres = [g.strip() for g in db_book.genres.split(",") if g.strip()]
    else:
        db_book.genres = []

    return db_book


def delete_book(db: Session, book_id: int) -> bool:
    """Delete a book"""
    db_book = get_book(db, book_id)
    if not db_book:
        return False

    db.delete(db_book)
    db.commit()
    return True


def search_books(
    db: Session, query: str, skip: int = 0, limit: int = 20
) -> List[BookModel]:
    """Search books by title or author"""
    search_pattern = f"%{query}%"
    return (
        db.query(BookModel)
        .filter(
            (BookModel.title.ilike(search_pattern))
            | (BookModel.author.ilike(search_pattern))
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
