import httpx
import os
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

# Simple in-memory cache
_cache = {}
CACHE_DURATION = timedelta(hours=1)


def _get_from_cache(key: str) -> Optional[List[dict]]:
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            print(f"Cache hit for: {key}")
            return data
        else:
            del _cache[key]
    return None


def _set_cache(key: str, data: List[dict]):
    if data:
        _cache[key] = (data, datetime.now())
        print(f"Cached {len(data)} results for: {key}")


def _calculate_book_quality_score(book: dict) -> int:
    """Calculate quality score for a book based on available information"""
    score = 0

    # Essential fields
    if book.get("cover_url"):
        score += 3
    if book.get("description"):
        score += 2
    if book.get("page_count"):
        score += 2
    if book.get("isbn"):
        score += 1
    if book.get("published_year"):
        score += 1
    if book.get("genres"):
        score += 1

    return score


def _deduplicate_books(books: List[dict]) -> List[dict]:
    """
    Remove duplicate books, keeping the one with most information
    Deduplicates by title + author (case-insensitive)
    """
    seen = {}

    for book in books:
        # Create a key from normalized title and author
        title = book.get("title", "").lower().strip()
        author = book.get("author", "").lower().strip()
        key = f"{title}|{author}"

        # Skip if we don't have title or author
        if not title or not author or author == "unknown author":
            continue

        # Calculate quality score
        quality_score = _calculate_book_quality_score(book)

        # Keep the book with higher quality score
        if key not in seen or quality_score > seen[key]["score"]:
            seen[key] = {"book": book, "score": quality_score}

    # Return only the books, sorted by quality score (highest first)
    return [
        item["book"]
        for item in sorted(seen.values(), key=lambda x: x["score"], reverse=True)
    ]


def _filter_low_quality_books(books: List[dict]) -> List[dict]:
    """Filter out books with insufficient information"""
    filtered = []

    for book in books:
        # Must have at least: title, author, and cover
        if not book.get("title"):
            continue
        if not book.get("author") or book.get("author") == "Unknown Author":
            continue
        if not book.get("cover_url"):
            continue

        # Calculate quality score - minimum threshold of 5
        quality_score = _calculate_book_quality_score(book)
        if quality_score >= 5:
            filtered.append(book)

    return filtered


async def search_google_books(query: str, max_results: int = 20) -> List[dict]:
    """
    Search Google Books API and return deduplicated, high-quality results
    """
    # Check cache first
    cache_key = f"search:{query}:{max_results}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    params = {
        "q": query,
        "maxResults": min(max_results, 40),
        "printType": "books",
        "langRestrict": "en",
        "orderBy": "relevance",
    }

    # Add API key if available
    api_key = os.getenv("GOOGLE_BOOKS_API_KEY")
    if api_key:
        params["key"] = api_key
        print(f"Using Google Books API key")
    else:
        print("Warning: No Google Books API key found")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(GOOGLE_BOOKS_API, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            # Transform Google Books format to our format
            books = []
            for item in data.get("items", []):
                book = transform_google_book(item)
                if book:
                    books.append(book)

            # Filter out low-quality books
            # books = _filter_low_quality_books(books)

            # Deduplicate, keeping best version of each book
            books = _deduplicate_books(books)

            # Limit to requested max_results after deduplication
            books = books[:max_results]

            # Only cache successful results with data
            if books:
                _set_cache(cache_key, books)

            return books
        except httpx.HTTPError as e:
            print(f"Error fetching from Google Books: {e}")
            return []


def extract_year(date_string: Optional[str]) -> Optional[int]:
    """Extract year from date string like '2024-01-15' or '2024'"""
    if not date_string:
        return None
    try:
        return int(date_string[:4])
    except (ValueError, IndexError):
        return None


def transform_google_book(item: dict) -> Optional[dict]:
    """Transform Google Books API response to our format"""
    try:
        volume_info = item.get("volumeInfo", {})

        # Get cover image
        image_links = volume_info.get("imageLinks", {})
        cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail")

        if cover_url:
            cover_url = cover_url.replace("http://", "https://")

        # Get ISBN (prefer ISBN-13)
        isbn = None
        for identifier in volume_info.get("industryIdentifiers", []):
            if identifier.get("type") == "ISBN_13":
                isbn = identifier.get("identifier")
                break
            elif identifier.get("type") == "ISBN_10" and not isbn:
                isbn = identifier.get("identifier")

        # Get author
        authors = volume_info.get("authors", [])
        author = authors[0] if authors else "Unknown Author"

        # Get genres/categories
        categories = volume_info.get("categories", [])

        return {
            "title": volume_info.get("title", "Unknown Title"),
            "author": author,
            "isbn": isbn,
            "cover_url": cover_url,
            "description": volume_info.get("description"),
            "published_year": extract_year(volume_info.get("publishedDate")),
            "page_count": volume_info.get("pageCount"),
            "genres": categories,
        }
    except Exception as e:
        print(f"Error transforming book: {e}")
        return None


def parse_publish_year(date_string: Optional[str]) -> Optional[int]:
    """
    Extract year from various date formats
    """
    if not date_string:
        return None

    try:
        year = int(date_string[:4])
        return year if 1000 <= year <= 9999 else None
    except (ValueError, IndexError):
        return None
