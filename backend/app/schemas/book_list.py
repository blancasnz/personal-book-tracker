from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.book import Book


# BookListItem schemas
class BookListItemBase(BaseModel):
    book_id: int
    notes: Optional[str] = None


class BookListItemCreate(BookListItemBase):
    pass


class BookListItem(BookListItemBase):
    id: int
    book_list_id: int
    added_at: datetime
    book: Book  # Include full book details

    class Config:
        from_attributes = True  # allows to read/return SQLAlchemy objects, not needed for creating or updating


# BookList schemas
class BookListBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None


class BookListCreate(BookListBase):
    pass


class BookListUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class BookList(BookListBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[BookListItem] = []  # Include all books in the list

    class Config:
        from_attributes = True


# Simplified version without nested items (for list views)
class BookListSummary(BookListBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    item_count: int = 0

    class Config:
        from_attributes = True
