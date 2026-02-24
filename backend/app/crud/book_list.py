from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.book_list import BookList, BookListItem, ReadingStatus
from app.models.book import Book as Book
from app.schemas.book_list import (
    BookListCreate,
    BookListUpdate,
    BookListItemCreate,
    BookListItemUpdate,
)
from typing import List, Optional
import random


# BookList operations
def get_book_list(
    db: Session, list_id: int, sort_order: str = "desc"
) -> Optional[BookList]:
    """Get a single list with all its books, sorted by date added"""
    book_list = db.query(BookList).filter(BookList.id == list_id).first()

    if not book_list:
        return None

    # Build query for items with eager loading
    items_query = (
        db.query(BookListItem)
        .options(joinedload(BookListItem.book))
        .filter(BookListItem.book_list_id == list_id)
    )

    # Sort by date added or award year
    if sort_order == "asc":
        items_query = items_query.order_by(BookListItem.added_at.asc())
    elif sort_order == "award_year_desc":
        items_query = items_query.order_by(
            BookListItem.award_year.desc().nulls_last(),
            BookListItem.added_at.desc()
        )
    elif sort_order == "award_year_asc":
        items_query = items_query.order_by(
            BookListItem.award_year.asc().nulls_last(),
            BookListItem.added_at.desc()
        )
    elif sort_order == "rank_asc":
        items_query = items_query.order_by(
            BookListItem.rank.asc().nulls_last(),
            BookListItem.added_at.asc()
        )
    elif sort_order == "rank_desc":
        items_query = items_query.order_by(
            BookListItem.rank.desc().nulls_last(),
            BookListItem.added_at.desc()
        )
    else:  # desc (default - newest first)
        items_query = items_query.order_by(BookListItem.added_at.desc())

    # Replace the items with sorted items
    book_list.items = items_query.all()

    return book_list


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
            "is_public": book_list.is_public,
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
    # Only check that the list exists — don't load items (avoids cascade
    # conflicts when multiple books are added concurrently)
    list_exists = db.query(BookList.id).filter(BookList.id == list_id).first()
    if not list_exists:
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
        {"name": "Favorites", "description": "Your favorite books", "is_default": 1},
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
    Move book between status lists (Want to Read, Currently Reading, Finished).
    Remove from old status list, add to new status list.
    Keep in non-status lists (Favorites, custom lists) and update their status.
    """
    # Map status to default list names
    status_to_list = {
        ReadingStatus.TO_READ: "Want to Read",
        ReadingStatus.READING: "Currently Reading",
        ReadingStatus.FINISHED: "Finished",
    }

    target_list_name = status_to_list[new_status]
    default_status_list_names = ["Want to Read", "Currently Reading", "Finished"]

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

    # Get ALL instances of this book across all lists
    all_items = (
        db.query(BookListItem)
        .join(BookList)
        .filter(BookListItem.book_id == book_id)
        .all()
    )

    # Remove from all DEFAULT STATUS LISTS (except target)
    for item in all_items:
        if (
            item.book_list.name in default_status_list_names
            and item.book_list.is_default == 1
            and item.book_list.name != target_list_name
        ):
            db.delete(item)

    # Update status in ALL NON-STATUS LISTS (Favorites, custom lists)
    for item in all_items:
        if (
            item.book_list.name not in default_status_list_names
            or item.book_list.is_default == 0
        ):
            item.status = new_status
            # Sync rating, notes, and current_page
            if old_item.rating:
                item.rating = old_item.rating
            if old_item.notes and not item.notes:
                item.notes = old_item.notes
            item.current_page = old_item.current_page

    # Check if already in target status list
    existing_in_target = (
        db.query(BookListItem)
        .filter(
            BookListItem.book_list_id == target_list.id, BookListItem.book_id == book_id
        )
        .first()
    )

    if existing_in_target:
        # Update status
        existing_in_target.status = new_status
        existing_in_target.notes = old_item.notes
        existing_in_target.rating = old_item.rating
        existing_in_target.is_favorite = old_item.is_favorite
        existing_in_target.current_page = old_item.current_page
        db.commit()
        db.refresh(existing_in_target)
        return existing_in_target
    else:
        # Create new item in target status list
        new_item = BookListItem(
            book_list_id=target_list.id,
            book_id=book_id,
            status=new_status,
            notes=old_item.notes,
            rating=old_item.rating,
            is_favorite=old_item.is_favorite,
            current_page=old_item.current_page,
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item


def get_random_book_from_list(
    db: Session,
    list_id: int,
    status: Optional[ReadingStatus] = None,
    max_pages: Optional[int] = None,
    min_pages: Optional[int] = None,
    genre: Optional[str] = None,
) -> Optional[BookListItem]:
    """
    Get a random book from a list with optional filters
    """
    query = (
        db.query(BookListItem)
        .options(joinedload(BookListItem.book))
        .filter(BookListItem.book_list_id == list_id)
    )

    # Apply filters
    if status:
        query = query.filter(BookListItem.status == status)

    if max_pages:
        query = query.join(BookListItem.book).filter(Book.page_count <= max_pages)

    if min_pages:
        query = query.join(BookListItem.book).filter(Book.page_count >= min_pages)

    if genre:
        query = query.join(Book).filter(Book.genres.like(f"%{genre}%"))

    # Get all matching items
    items = query.all()

    if not items:
        return None

    # Return random item
    return random.choice(items)


def get_public_lists(db: Session, skip: int = 0, limit: int = 50) -> List[BookList]:
    """Get all public lists with their items and books"""
    return (
        db.query(BookList)
        .options(joinedload(BookList.items).joinedload(BookListItem.book))
        .filter(BookList.is_public == 1)
        .order_by(BookList.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def search_public_lists_by_book(
    db: Session, query: str, skip: int = 0, limit: int = 50
):
    """Search public lists by book title or author"""
    search_term = f"%{query}%"

    # Subquery for item counts per list
    item_count_sq = (
        db.query(
            BookListItem.book_list_id,
            func.count(BookListItem.id).label("item_count"),
        )
        .group_by(BookListItem.book_list_id)
        .subquery()
    )

    results = (
        db.query(BookList, Book, item_count_sq.c.item_count)
        .join(BookListItem, BookList.id == BookListItem.book_list_id)
        .join(Book, BookListItem.book_id == Book.id)
        .outerjoin(item_count_sq, BookList.id == item_count_sq.c.book_list_id)
        .filter(
            BookList.is_public == 1,
            Book.title.ilike(search_term) | Book.author.ilike(search_term),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    output = []
    for book_list, book, item_count in results:
        output.append(
            {
                "list_id": book_list.id,
                "list_name": book_list.name,
                "list_description": book_list.description,
                "item_count": item_count or 0,
                "matching_book": book,
            }
        )
    return output


def reset_book_progress(db: Session, book_id: int) -> int:
    """Reset current_page to 0 for all instances of a book across all lists"""
    result = (
        db.query(BookListItem)
        .filter(BookListItem.book_id == book_id)
        .update({BookListItem.current_page: 0})
    )
    db.commit()
    return result
