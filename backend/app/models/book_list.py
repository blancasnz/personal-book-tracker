from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BookList(Base):
    __tablename__ = "book_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
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

    # Relationships
    book_list = relationship("BookList", back_populates="items")
    book = relationship("Book")
