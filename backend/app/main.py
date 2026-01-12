from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db, Base, engine
from app.models import Book, BookList
from app.routers import books, lists, search

# Create tables (in production, use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Book Tracker API")

# CORS setup for Next.js development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(lists.router)
app.include_router(search.router)


@app.get("/")
def read_root():
    return {"message": "Book Tracker API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/test-db")
def test_database(db: Session = Depends(get_db)):
    """Test endpoint to verify database connection"""
    # Try to count books
    book_count = db.query(Book).count()
    list_count = db.query(BookList).count()

    return {"database": "connected", "books": book_count, "lists": list_count}
