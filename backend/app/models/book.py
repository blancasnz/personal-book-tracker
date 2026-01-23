from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    isbn = Column(String(13), nullable=True, unique=True, index=True)
    cover_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    published_year = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    genres = Column(Text)
