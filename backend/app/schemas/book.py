from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import re


# Base schema with common fields
class BookBase(BaseModel):
    title: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    isbn: Optional[str] = Field(None, max_length=13)
    cover_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    published_year: Optional[int] = None
    page_count: Optional[int] = None
    genres: Optional[List[str]] = None
    format: Optional[str] = Field(None, max_length=50)
    edition: Optional[str] = Field(None, max_length=100)

    @field_validator("genres", mode="before")
    @classmethod
    def parse_genres(cls, v):
        """Parse genres from comma-separated string to list"""
        if isinstance(v, str) and v:
            return [g.strip() for g in v.split(",") if g.strip()]
        if v is None:
            return []
        return v

    @field_validator("genres")
    @classmethod
    def validate_genres(cls, v):
        """Validate genre list"""
        if not v:
            return v

        # Max 10 genres
        if len(v) > 10:
            raise ValueError("Maximum 10 genres allowed")

        # Validate each genre
        for genre in v:
            # Max 50 characters
            if len(genre) > 50:
                raise ValueError(f"Genre '{genre}' is too long (max 50 characters)")

            # Only alphanumeric, spaces, hyphens, apostrophes, ampersands
            if not re.match(r"^[a-zA-Z0-9\s\-'&]+$", genre):
                raise ValueError(f"Genre '{genre}' contains invalid characters")

        return v


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
    genres: Optional[List[str]] = None
    format: Optional[str] = Field(None, max_length=50)
    edition: Optional[str] = Field(None, max_length=100)

    @field_validator("genres", mode="before")
    @classmethod
    def parse_genres(cls, v):
        """Parse genres from comma-separated string to list"""
        if isinstance(v, str) and v:
            return [g.strip() for g in v.split(",") if g.strip()]
        if v is None:
            return []
        return v

    @field_validator("genres")
    @classmethod
    def validate_genres(cls, v):
        """Validate genre list"""
        if not v:
            return v

        # Max 10 genres
        if len(v) > 10:
            raise ValueError("Maximum 10 genres allowed")

        # Validate each genre
        for genre in v:
            # Max 50 characters
            if len(genre) > 50:
                raise ValueError(f"Genre '{genre}' is too long (max 50 characters)")

            # Only alphanumeric, spaces, hyphens, apostrophes, ampersands
            if not re.match(r"^[a-zA-Z0-9\s\-'&]+$", genre):
                raise ValueError(f"Genre '{genre}' contains invalid characters")

        return v


# For returning a book (includes ID and DB fields)
class Book(BookBase):
    id: int

    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models
