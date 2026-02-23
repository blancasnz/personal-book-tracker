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
        """Parse genres from comma-separated string or list, sanitizing each entry"""
        if isinstance(v, str) and v:
            items = [g.strip() for g in v.split(",") if g.strip()]
        elif v is None:
            return []
        else:
            # Flatten any items that contain commas (e.g. "Fiction, American" -> "Fiction", "American")
            items = []
            for g in v:
                if isinstance(g, str) and "," in g:
                    items.extend(part.strip() for part in g.split(",") if part.strip())
                elif isinstance(g, str) and g.strip():
                    items.append(g.strip())
        # Strip characters not allowed by the validator (keep alphanumeric, spaces, hyphens, apostrophes, ampersands)
        cleaned = [re.sub(r"[^a-zA-Z0-9\s\-'&]", "", g).strip() for g in items]
        return [g for g in cleaned if g]

    @field_validator("genres")
    @classmethod
    def validate_genres(cls, v):
        """Validate genre list"""
        if not v:
            return v

        # Max 10 genres
        if len(v) > 10:
            v = v[:10]

        # Validate each genre
        for genre in v:
            if len(genre) > 50:
                raise ValueError(f"Genre '{genre}' is too long (max 50 characters)")

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
        """Parse genres from comma-separated string or list, sanitizing each entry"""
        if isinstance(v, str) and v:
            items = [g.strip() for g in v.split(",") if g.strip()]
        elif v is None:
            return []
        else:
            items = []
            for g in v:
                if isinstance(g, str) and "," in g:
                    items.extend(part.strip() for part in g.split(",") if part.strip())
                elif isinstance(g, str) and g.strip():
                    items.append(g.strip())
        cleaned = [re.sub(r"[^a-zA-Z0-9\s\-'&]", "", g).strip() for g in items]
        return [g for g in cleaned if g]

    @field_validator("genres")
    @classmethod
    def validate_genres(cls, v):
        """Validate genre list"""
        if not v:
            return v

        if len(v) > 10:
            v = v[:10]

        for genre in v:
            if len(genre) > 50:
                raise ValueError(f"Genre '{genre}' is too long (max 50 characters)")

        return v


# For returning a book (includes ID and DB fields)
class Book(BookBase):
    id: int

    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models
