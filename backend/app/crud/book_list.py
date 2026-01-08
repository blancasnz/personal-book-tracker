from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.book_list import BookList, BookListItem
from app.schemas.book_list import BookListCreate, BookListUpdate, BookListItemCreate
from typing import List, Optional


# BookList operations
def get_book_list(db: Session, list_id: int) -> Optional[BookList]:
    """Get a single list with all its books"""
    return db.query(BookList).filter(BookList.id == list_id).first()


def get_book_lists(db: Session, skip: int = 0, limit: int = 100) -> List[BookList]:
    """Get all lists"""
    return db.query(BookList).offset(skip).limit(limit).all()


def get_book_lists_summary(db: Session, skip: int = 0, limit: int = 100):
    """Get all lists with item counts (without loading all books)"""
    lists = (
        db.query(BookList, func.count(BookListItem.id).label("item_count"))
        .outerjoin(BookListItem)
        .group_by(BookList.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Transform to include item_count
    result = []
    for book_list, item_count in lists:
        list_dict = {
            "id": book_list.id,
            "name": book_list.name,
            "description": book_list.description,
            "created_at": book_list.created_at,
            "updated_at": book_list.updated_at,
            "item_count": item_count,
        }
        result.append(list_dict)
    return result


def create_book_list(db: Session, book_list: BookListCreate) -> BookList:
    """Create a new list"""
    db_list = BookList(**book_list.model_dump())
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list


def update_book_list(
    db: Session, list_id: int, list_update: BookListUpdate
) -> Optional[BookList]:
    """Update a list"""
    db_list = get_book_list(db, list_id)
    if not db_list:
        return None

    update_data = list_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_list, field, value)

    db.commit()
    db.refresh(db_list)
    return db_list


def delete_book_list(db: Session, list_id: int) -> bool:
    """Delete a list (cascade deletes items)"""
    db_list = get_book_list(db, list_id)
    if not db_list:
        return False

    db.delete(db_list)
    db.commit()
    return True


# BookListItem operations
def add_book_to_list(
    db: Session, list_id: int, item: BookListItemCreate
) -> Optional[BookListItem]:
    """Add a book to a list"""
    # Check if list exists
    db_list = get_book_list(db, list_id)
    if not db_list:
        return None

    # Check if book already in list
    existing = (
        db.query(BookListItem)
        .filter(
            BookListItem.book_list_id == list_id, BookListItem.book_id == item.book_id
        )
        .first()
    )

    if existing:
        return existing  # Already exists, return it

    # Create new item
    db_item = BookListItem(book_list_id=list_id, **item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def remove_book_from_list(db: Session, list_id: int, book_id: int) -> bool:
    """Remove a book from a list"""
    db_item = (
        db.query(BookListItem)
        .filter(BookListItem.book_list_id == list_id, BookListItem.book_id == book_id)
        .first()
    )

    if not db_item:
        return False

    db.delete(db_item)
    db.commit()
    return True


def update_list_item_notes(
    db: Session, list_id: int, book_id: int, notes: str
) -> Optional[BookListItem]:
    """Update notes for a book in a list"""
    db_item = (
        db.query(BookListItem)
        .filter(BookListItem.book_list_id == list_id, BookListItem.book_id == book_id)
        .first()
    )

    if not db_item:
        return None

    db_item.notes = notes
    db.commit()
    db.refresh(db_item)
    return db_item
