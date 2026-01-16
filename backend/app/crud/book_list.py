from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.book_list import BookList, BookListItem, ReadingStatus
from app.schemas.book_list import (
    BookListCreate,
    BookListUpdate,
    BookListItemCreate,
    BookListItemUpdate,
)
from typing import List, Optional


# BookList operations
def get_book_list(db: Session, list_id: int) -> Optional[BookList]:
    """Get a single list with all its books"""
    return db.query(BookList).filter(BookList.id == list_id).first()


def get_book_lists(db: Session, skip: int = 0, limit: int = 100) -> List[BookList]:
    """Get all lists, default lists first"""
    return (
        db.query(BookList)
        .order_by(BookList.is_default.desc(), BookList.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_book_lists_summary(db: Session, skip: int = 0, limit: int = 100):
    """Get all lists with item counts (without loading all books)"""
    lists = (
        db.query(BookList, func.count(BookListItem.id).label("item_count"))
        .outerjoin(BookListItem)
        .group_by(BookList.id)
        .order_by(BookList.is_default.desc(), BookList.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for book_list, item_count in lists:
        list_dict = {
            "id": book_list.id,
            "name": book_list.name,
            "description": book_list.description,
            "is_default": book_list.is_default,
            "created_at": book_list.created_at,
            "updated_at": book_list.updated_at,
            "item_count": item_count,
        }
        result.append(list_dict)
    return result


def create_book_list(
    db: Session, book_list: BookListCreate, is_default: int = 0
) -> BookList:
    """Create a new list"""
    db_list = BookList(**book_list.model_dump(), is_default=is_default)
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
    """Delete a list (cascade deletes items). Cannot delete default lists."""
    db_list = get_book_list(db, list_id)
    if not db_list:
        return False

    # Prevent deleting default lists
    if db_list.is_default == 1:
        return False

    db.delete(db_list)
    db.commit()
    return True


# BookListItem operations
def add_book_to_list(
    db: Session, list_id: int, item: BookListItemCreate
) -> Optional[BookListItem]:
    """Add a book to a list"""
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
        return existing

    db_item = BookListItem(book_list_id=list_id, **item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_book_list_item(
    db: Session, list_id: int, book_id: int, item_update: BookListItemUpdate
) -> Optional[BookListItem]:
    """Update a book's status, rating, or notes in a list"""
    db_item = (
        db.query(BookListItem)
        .filter(BookListItem.book_list_id == list_id, BookListItem.book_id == book_id)
        .first()
    )

    if not db_item:
        return None

    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)

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


def get_books_by_status(
    db: Session, status: ReadingStatus, skip: int = 0, limit: int = 100
):
    """Get all books with a specific status across all lists"""
    items = (
        db.query(BookListItem)
        .filter(BookListItem.status == status)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return items


# Default lists initialization
def create_default_lists(db: Session):
    """Create default lists if they don't exist"""
    default_lists = [
        {
            "name": "Want to Read",
            "description": "Books you plan to read",
            "is_default": 1,
        },
        {
            "name": "Currently Reading",
            "description": "Books you're reading now",
            "is_default": 1,
        },
        {"name": "Finished", "description": "Books you've completed", "is_default": 1},
    ]

    for list_data in default_lists:
        # Check if list already exists
        existing = (
            db.query(BookList)
            .filter(BookList.name == list_data["name"], BookList.is_default == 1)
            .first()
        )

        if not existing:
            db_list = BookList(**list_data)
            db.add(db_list)

    db.commit()


def move_book_to_status_list(
    db: Session, book_id: int, old_list_id: int, new_status: ReadingStatus
) -> Optional[BookListItem]:
    """
    Move a book to the appropriate default list based on status.
    Removes from old list and adds to new list.
    """
    # Map status to default list names
    status_to_list = {
        ReadingStatus.TO_READ: "Want to Read",
        ReadingStatus.READING: "Currently Reading",
        ReadingStatus.FINISHED: "Finished",
    }

    target_list_name = status_to_list[new_status]

    # Find the target default list
    target_list = (
        db.query(BookList)
        .filter(BookList.name == target_list_name, BookList.is_default == 1)
        .first()
    )

    if not target_list:
        return None

    # Get the book from old list (to preserve notes, rating, favorite)
    old_item = (
        db.query(BookListItem)
        .filter(
            BookListItem.book_list_id == old_list_id, BookListItem.book_id == book_id
        )
        .first()
    )

    if not old_item:
        return None

    # Check if book already in target list
    existing_in_target = (
        db.query(BookListItem)
        .filter(
            BookListItem.book_list_id == target_list.id, BookListItem.book_id == book_id
        )
        .first()
    )

    if existing_in_target:
        # Just update status in target list
        existing_in_target.status = new_status
        # Optionally preserve notes/rating/favorite from old item
        if old_list_id != target_list.id:
            existing_in_target.notes = old_item.notes
            existing_in_target.rating = old_item.rating
            existing_in_target.is_favorite = old_item.is_favorite
            # Remove from old list
            db.delete(old_item)
        db.commit()
        db.refresh(existing_in_target)
        return existing_in_target
    else:
        # Create new item in target list
        new_item = BookListItem(
            book_list_id=target_list.id,
            book_id=book_id,
            status=new_status,
            notes=old_item.notes,
            rating=old_item.rating,
            is_favorite=old_item.is_favorite,
        )
        db.add(new_item)

        # Remove from old list (only if it's a different list)
        if old_list_id != target_list.id:
            db.delete(old_item)

        db.commit()
        db.refresh(new_item)
        return new_item
