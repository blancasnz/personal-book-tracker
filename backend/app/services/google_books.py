import httpx
from typing import List, Optional

GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"


async def search_google_books(query: str, max_results: int = 20) -> List[dict]:
    """
    Search Google Books API and return results
    """
    params = {
        "q": query,
        "maxResults": min(max_results, 40),  # Google Books max is 40
        "printType": "books",
        "langRestrict": "en",  # ADD THIS: Only English books
        "orderBy": "relevance",  # ADD THIS: Most relevant (popular) first
    }

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

            return books
        except httpx.HTTPError as e:
            print(f"Error fetching from Google Books: {e}")
            return []


def extract_year(date_string: Optional[str]) -> Optional[int]:
    """Extract year from date string like '2024-01-15' or '2024'"""
    if not date_string:
        return None
    try:
        # Take first 4 characters (the year)
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
    Extract year from various date formats (e.g., '2020', '2020-01', '2020-01-15')
    """
    if not date_string:
        return None

    try:
        # Just get the first 4 characters (the year)
        year = int(date_string[:4])
        return year if 1000 <= year <= 9999 else None
    except (ValueError, IndexError):
        return None
