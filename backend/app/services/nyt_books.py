import httpx
import os
from typing import List, Optional
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timedelta

# Load .env from backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

NYT_API_KEY = os.getenv("NYT_API_KEY")
NYT_BOOKS_API = "https://api.nytimes.com/svc/books/v3"

# Simple in-memory cache
_cache = {}
CACHE_DURATION = timedelta(hours=1)  # Cache for 1 hour


def _get_from_cache(key: str) -> Optional[List[dict]]:
    """Get data from cache if not expired"""
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            print(f"Cache HIT for: {key}")
            return data
        else:
            print(f"Cache EXPIRED for: {key}")
            del _cache[key]
    print(f"Cache MISS for: {key}")
    return None


def _set_cache(key: str, data: List[dict]):
    """Store data in cache"""
    _cache[key] = (data, datetime.now())
    print(f"Cache SET for: {key}")


async def get_bestseller_lists() -> List[dict]:
    """Get available bestseller list names"""
    cache_key = "nyt_lists"

    # Check cache first
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    url = f"{NYT_BOOKS_API}/lists/names.json"
    params = {"api-key": NYT_API_KEY}

    print(f"Fetching lists from: {url}")  # Debug

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            print(f"Response status: {response.status_code}")  # Debug
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])

            # Store in cache
            _set_cache(cache_key, results)

            return results
        except httpx.HTTPError as e:
            print(f"Error fetching NYT lists: {e}")
            return []


async def get_bestsellers(
    list_name: str = "combined-print-and-e-book-fiction",
) -> List[dict]:
    """
    Get current bestsellers from a specific list.
    Results are cached for 1 hour.
    """
    cache_key = f"nyt_bestsellers_{list_name}"

    # Check cache first
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    url = f"{NYT_BOOKS_API}/lists/current/{list_name}.json"
    params = {"api-key": NYT_API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            books = []
            for book_data in data.get("results", {}).get("books", []):
                book = transform_nyt_book(book_data)
                if book:
                    books.append(book)

            # Store in cache
            _set_cache(cache_key, books)

            return books
        except httpx.HTTPError as e:
            print(f"Error fetching NYT bestsellers: {e}")
            return []


def transform_nyt_book(book_data: dict) -> Optional[dict]:
    """Transform NYT book data to our format"""
    try:
        cover_url = book_data.get("book_image") or None
        isbn = book_data.get("primary_isbn13") or book_data.get("primary_isbn10")

        return {
            "title": book_data.get("title", "Unknown Title"),
            "author": book_data.get("author", "Unknown Author"),
            "isbn": isbn,
            "cover_url": cover_url,
            "description": book_data.get("description"),
            "published_year": None,
            "page_count": None,
            "genres": [],
            "rank": book_data.get("rank"),
            "weeks_on_list": book_data.get("weeks_on_list"),
            "amazon_url": book_data.get("amazon_product_url"),
        }
    except Exception as e:
        print(f"Error transforming NYT book: {e}")
        return None
