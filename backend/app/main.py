from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import get_db, Base, engine
from app.routers import books, lists, search, nyt
from app.crud import book_list as crud_list

# Create tables
Base.metadata.create_all(bind=engine)


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize default lists
    db = next(get_db())
    try:
        crud_list.create_default_lists(db)
    finally:
        db.close()

    yield  # Application runs here

    # Shutdown: Add cleanup code here if needed in the future
    pass


app = FastAPI(title="Book Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(books.router)
app.include_router(lists.router)
app.include_router(search.router)
app.include_router(nyt.router)


@app.get("/")
def read_root():
    return {"message": "Book Tracker API", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
