from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List, Optional

from app.database import get_db
from app.models.book_list import BookListItem, ReadingStatus
from app.schemas.book_list import (
    BookList,
    BookListCreate,
    BookListUpdate,
    BookListSummary,
    BookListItemCreate,
    BookListItemUpdate,
)
from app.crud import book_list as crud_list

router = APIRouter(prefix="/lists", tags=["lists"])


@router.get("/", response_model=List[BookListSummary])
def get_lists(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get all lists with item counts (default lists first)"""
    lists = crud_list.get_book_lists_summary(db, skip=skip, limit=limit)
    return lists


@router.get("/currently-reading")
def get_currently_reading_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get all books currently being read"""
    items = (
        db.query(BookListItem)
        .options(joinedload(BookListItem.book))
        .filter(BookListItem.status == ReadingStatus.READING)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items


@router.get("/{list_id}", response_model=BookList)
def get_list(
    list_id: int,
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """Get a specific list with all its books"""
    book_list = crud_list.get_book_list(db, list_id=list_id, sort_order=sort_order)
    if not book_list:
        raise HTTPException(status_code=404, detail="List not found")
    return book_list


@router.post("/", response_model=BookList, status_code=201)
def create_list(book_list: BookListCreate, db: Session = Depends(get_db)):
    """Create a new list"""
    return crud_list.create_book_list(db, book_list=book_list)


@router.patch("/{list_id}", response_model=BookList)
def update_list(
    list_id: int, list_update: BookListUpdate, db: Session = Depends(get_db)
):
    """Update a list"""
    book_list = crud_list.update_book_list(db, list_id=list_id, list_update=list_update)
    if not book_list:
        raise HTTPException(status_code=404, detail="List not found")
    return book_list


@router.delete("/{list_id}", status_code=204)
def delete_list(list_id: int, db: Session = Depends(get_db)):
    """Delete a list (cannot delete default lists)"""
    success = crud_list.delete_book_list(db, list_id=list_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="List not found or cannot delete default list"
        )
    return None


@router.post("/{list_id}/books", status_code=201)
def add_book_to_list(
    list_id: int, item: BookListItemCreate, db: Session = Depends(get_db)
):
    """Add a book to a list"""
    result = crud_list.add_book_to_list(db, list_id=list_id, item=item)
    if not result:
        raise HTTPException(status_code=404, detail="List not found")
    return result


@router.patch("/{list_id}/books/{book_id}")
def update_book_in_list(
    list_id: int,
    book_id: int,
    item_update: BookListItemUpdate,
    db: Session = Depends(get_db),
):
    """Update a book's status, rating, or notes in a list"""
    result = crud_list.update_book_list_item(
        db, list_id=list_id, book_id=book_id, item_update=item_update
    )
    if not result:
        raise HTTPException(status_code=404, detail="Book not in list")
    return result


@router.delete("/{list_id}/books/{book_id}", status_code=204)
def remove_book_from_list(list_id: int, book_id: int, db: Session = Depends(get_db)):
    """Remove a book from a list"""
    success = crud_list.remove_book_from_list(db, list_id=list_id, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not in list")
    return None


@router.post("/{list_id}/books/{book_id}/move-status")
def move_book_status(
    list_id: int, book_id: int, new_status: ReadingStatus, db: Session = Depends(get_db)
):
    """Move a book to the appropriate default list based on status change"""
    result = crud_list.move_book_to_status_list(db, book_id, list_id, new_status)
    if not result:
        raise HTTPException(
            status_code=404, detail="Book not found or target list missing"
        )
    return result


@router.get("/{list_id}/random")
def get_random_book(
    list_id: int,
    status: Optional[ReadingStatus] = Query(
        None, description="Filter by reading status"
    ),
    max_pages: Optional[int] = Query(None, ge=1, description="Maximum page count"),
    min_pages: Optional[int] = Query(None, ge=1, description="Minimum page count"),
    db: Session = Depends(get_db),
):
    """Get a random book from the list with optional filters"""
    book_list = crud_list.get_book_list(db, list_id=list_id)
    if not book_list:
        raise HTTPException(status_code=404, detail="List not found")

    random_item = crud_list.get_random_book_from_list(
        db, list_id, status=status, max_pages=max_pages, min_pages=min_pages
    )

    if not random_item:
        raise HTTPException(status_code=404, detail="No books match the criteria")

    return random_item
