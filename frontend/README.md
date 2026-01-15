# Book Tracker

A full-stack book tracking application built with Next.js and FastAPI. Search for books, create reading lists, and organize your library.

## Features

- 🔍 Search books using Google Books API
- 📚 Add books to your personal library
- 📋 Create and manage reading lists
- 📝 Add notes to books in your lists
- 🎨 Clean, responsive UI with Tailwind CSS

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TanStack Query (React Query)
- Tailwind CSS
- React Hot Toast

**Backend:**
- FastAPI
- SQLAlchemy
- SQLite (development) / PostgreSQL (production)
- Alembic (migrations)
- Pydantic

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/blancasnz/personal-book-tracker.git
   cd book-tracker
```

2. **Backend Setup**
```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
```

3. **Frontend Setup**
```bash
   cd frontend
   npm install
```

### Running the Application

1. **Start the backend** (Terminal 1)
```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
```

2. **Start the frontend** (Terminal 2)
```bash
   cd frontend
   npm run dev
```

3. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API Docs: http://localhost:8000/docs

## Project Structure
```
book-tracker/
├── backend/
│   ├── app/
│   │   ├── crud/          # Database operations
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # External API integrations
│   │   ├── database.py    # Database configuration
│   │   └── main.py        # FastAPI application
│   ├── alembic/           # Database migrations
│   └── requirements.txt
└── frontend/
    ├── app/               # Next.js pages
    ├── components/        # React components
    ├── lib/               # API client & utilities
    └── types/             # TypeScript types
```

## API Endpoints

### Books
- `GET /books/` - Get all books
- `GET /books/search?q={query}` - Search library books
- `POST /books/` - Create a book
- `GET /books/{id}` - Get book details
- `PATCH /books/{id}` - Update a book
- `DELETE /books/{id}` - Delete a book

### Lists
- `GET /lists/` - Get all lists
- `POST /lists/` - Create a list
- `GET /lists/{id}` - Get list with books
- `PATCH /lists/{id}` - Update a list
- `DELETE /lists/{id}` - Delete a list
- `POST /lists/{id}/books` - Add book to list
- `DELETE /lists/{id}/books/{book_id}` - Remove book from list

### Search
- `GET /search/external?q={query}` - Search Google Books API
- `POST /search/external/add` - Add external book to library

## Database Migrations
```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Future Enhancements

- [ ] User authentication (multi-user support)
- [ ] Book ratings and reviews
- [ ] Reading progress tracking
- [ ] Import/export lists
- [ ] Dark mode
- [ ] Mobile app

## License

MIT