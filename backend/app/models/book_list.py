from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ReadingStatus(str, enum.Enum):
    """Reading status for books in lists"""

    TO_READ = "to_read"
    READING = "reading"
    FINISHED = "finished"


class BookList(Base):
    __tablename__ = "book_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_default = Column(Integer, default=0)  # 0=user created, 1=default list
    is_public = Column(Integer, default=0)  # 0=private, 1=public
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to items in this list
    items = relationship(
        "BookListItem", back_populates="book_list", cascade="all, delete-orphan"
    )


class BookListItem(Base):
    __tablename__ = "book_list_items"

    id = Column(Integer, primary_key=True, index=True)
    book_list_id = Column(
        Integer, ForeignKey("book_lists.id", ondelete="CASCADE"), nullable=False
    )
    book_id = Column(
        Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False
    )
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)  # Personal notes about this book in this list
    status = Column(
        SQLEnum(ReadingStatus), default=ReadingStatus.TO_READ, nullable=False
    )
    rating = Column(Integer, nullable=True)  # 1-5 stars
    is_favorite = Column(Integer, default=0, nullable=False)
    current_page = Column(Integer, default=0, nullable=False)

    # Relationships
    book_list = relationship("BookList", back_populates="items")
    book = relationship("Book")
