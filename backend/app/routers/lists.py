from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.book_list import (
    BookList,
    BookListCreate,
    BookListUpdate,
    BookListSummary,
    BookListItemCreate,
)
from app.crud import book_list as crud_list

router = APIRouter(prefix="/lists", tags=["lists"])


@router.get("/", response_model=List[BookListSummary])
def get_lists(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get all lists with item counts"""
    lists = crud_list.get_book_lists_summary(db, skip=skip, limit=limit)
    return lists


@router.get("/{list_id}", response_model=BookList)
def get_list(list_id: int, db: Session = Depends(get_db)):
    """Get a specific list with all its books"""
    book_list = crud_list.get_book_list(db, list_id=list_id)
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
    """Delete a list"""
    success = crud_list.delete_book_list(db, list_id=list_id)
    if not success:
        raise HTTPException(status_code=404, detail="List not found")
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


@router.delete("/{list_id}/books/{book_id}", status_code=204)
def remove_book_from_list(list_id: int, book_id: int, db: Session = Depends(get_db)):
    """Remove a book from a list"""
    success = crud_list.remove_book_from_list(db, list_id=list_id, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not in list")
    return None


@router.patch("/{list_id}/books/{book_id}/notes")
def update_book_notes(
    list_id: int, book_id: int, notes: str, db: Session = Depends(get_db)
):
    """Update notes for a book in a list"""
    result = crud_list.update_list_item_notes(
        db, list_id=list_id, book_id=book_id, notes=notes
    )
    if not result:
        raise HTTPException(status_code=404, detail="Book not in list")
    return result
