import httpx
from typing import List, Optional
from app.schemas.book import BookCreate

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


def transform_google_book(item: dict) -> Optional[dict]:
    """
    Transform Google Books API response to our Book schema format
    """
    try:
        volume_info = item.get("volumeInfo", {})

        # Get ISBN (prefer ISBN-13, fallback to ISBN-10)
        isbn = None
        for identifier in volume_info.get("industryIdentifiers", []):
            if identifier.get("type") == "ISBN_13":
                isbn = identifier.get("identifier")
                break
            elif identifier.get("type") == "ISBN_10":
                isbn = identifier.get("identifier")

        # Get cover image (prefer high quality)
        image_links = volume_info.get("imageLinks", {})
        cover_url = (
            image_links.get("large")
            or image_links.get("medium")
            or image_links.get("thumbnail")
            or image_links.get("smallThumbnail")
        )

        # Get authors (join multiple authors)
        authors = volume_info.get("authors", [])
        author = ", ".join(authors) if authors else "Unknown Author"

        # Get genres/categories
        categories = volume_info.get("categories", [])

        book = {
            "title": volume_info.get("title", "Unknown Title"),
            "author": author,
            "isbn": isbn,
            "cover_url": cover_url,
            "description": volume_info.get("description"),
            "published_year": parse_publish_year(volume_info.get("publishedDate")),
            "page_count": volume_info.get("pageCount"),
            "genres": categories,
        }

        return book
    except Exception as e:
        print(f"Error transforming book data: {e}")
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
