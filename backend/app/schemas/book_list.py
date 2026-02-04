from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.book import Book

# from enum import Enum
from app.models.book_list import ReadingStatus


# class ReadingStatus(str, Enum):
#     TO_READ = "to_read"
#     READING = "reading"
#     FINISHED = "finished"


# BookListItem schemas
class BookListItemBase(BaseModel):
    book_id: int
    notes: Optional[str] = None
    status: ReadingStatus = ReadingStatus.TO_READ
    rating: Optional[int] = Field(None, ge=1, le=5)
    is_favorite: int = 0
    current_page: int = 0


class BookListItemCreate(BookListItemBase):
    pass


class BookListItemUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[ReadingStatus] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    is_favorite: Optional[int] = None
    current_page: Optional[int] = Field(None, ge=0)


class BookListItem(BookListItemBase):
    id: int
    book_list_id: int
    added_at: datetime
    book: Book

    class Config:
        from_attributes = True


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
    is_default: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[BookListItem] = []

    class Config:
        from_attributes = True


class BookListSummary(BookListBase):
    id: int
    is_default: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    item_count: int = 0

    class Config:
        from_attributes = True
