from pydantic import BaseModel, Field
from typing import Optional


# Base schema with common fields
class BookBase(BaseModel):
    title: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    isbn: Optional[str] = Field(None, max_length=13)
    cover_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    published_year: Optional[int] = None
    page_count: Optional[int] = None


# For creating a book (no ID yet)
class BookCreate(BookBase):
    pass


# For updating a book (all fields optional)
class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    author: Optional[str] = Field(None, max_length=255)
    isbn: Optional[str] = Field(None, max_length=13)
    cover_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    published_year: Optional[int] = None
    page_count: Optional[int] = None


# For returning a book (includes ID and DB fields)
class Book(BookBase):
    id: int

    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models
