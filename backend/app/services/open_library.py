import httpx
from typing import List, Optional
from datetime import datetime, timedelta

OPEN_LIBRARY_API = "https://openlibrary.org"
OPEN_LIBRARY_SEARCH = f"{OPEN_LIBRARY_API}/search.json"
# Simple in-memory cache
_cache = {}
CACHE_DURATION = timedelta(hours=6)


def _get_from_cache(key: str) -> Optional[List[dict]]:
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            return data
        else:
            del _cache[key]
    return None


def _set_cache(key: str, data: List[dict]):
    if data:
        _cache[key] = (data, datetime.now())


def _determine_format(edition: dict) -> str:
    """Determine book format from edition data"""
    # Check for explicit ebook formats
    format_lower = edition.get("format", "").lower()

    if "ebook" in format_lower or "kindle" in format_lower or "digital" in format_lower:
        return "ebook"

    # Check physical_format field
    physical_format = edition.get("physical_format", "").lower()

    if "hardcover" in physical_format or "hardback" in physical_format:
        return "hardcover"
    elif "paperback" in physical_format or "mass market" in physical_format:
        return "paperback"
    elif "audio" in physical_format or "audiobook" in format_lower:
        return "audiobook"
    elif "ebook" in physical_format:
        return "ebook"

    # Check in title as last resort
    title = edition.get("title", "").lower()
    if "kindle edition" in title or "ebook" in title:
        return "ebook"
    elif "audiobook" in title or "audio cd" in title:
        return "audiobook"

    # Default to paperback if physical book
    if edition.get("number_of_pages"):
        return "paperback"

    return "unknown"


async def search_open_library_editions(title: str, author: str) -> List[dict]:
    """
    Search Open Library for all editions of a book
    Returns a list of editions with format information
    """
    cache_key = f"ol_editions:{title}:{author}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    # First, search for the work
    params = {"title": title, "author": author, "limit": 1}

    async with httpx.AsyncClient() as client:
        try:
            # Search for the work
            search_response = await client.get(
                OPEN_LIBRARY_SEARCH, params=params, timeout=10.0
            )
            search_response.raise_for_status()
            search_data = search_response.json()

            if not search_data.get("docs"):
                return []

            # Get the work key
            work_key = search_data["docs"][0].get("key")
            if not work_key:
                return []

            # Fetch all editions for this work
            editions_url = f"{OPEN_LIBRARY_API}{work_key}/editions.json"
            editions_response = await client.get(editions_url, timeout=10.0)
            editions_response.raise_for_status()
            editions_data = editions_response.json()

            # Transform editions to our format
            editions = []
            seen_formats = set()  # Track unique format + page count combinations

            for entry in editions_data.get("entries", []):
                edition = transform_open_library_edition(entry, title, author)
                if edition:
                    # Create unique key to avoid duplicates
                    format_key = f"{edition['format']}_{edition.get('page_count', 0)}"

                    # Only add if we haven't seen this format/page count combo
                    if format_key not in seen_formats:
                        editions.append(edition)
                        seen_formats.add(format_key)

            # Cache results
            _set_cache(cache_key, editions)
            return editions

        except httpx.HTTPError as e:
            print(f"Error fetching from Open Library: {e}")
            return []


def transform_open_library_edition(
    entry: dict, original_title: str, original_author: str
) -> Optional[dict]:
    """Transform Open Library edition data to our format"""
    try:
        # Get ISBN (prefer ISBN-13)
        isbn_13 = entry.get("isbn_13", [])
        isbn_10 = entry.get("isbn_10", [])
        isbn = isbn_13[0] if isbn_13 else (isbn_10[0] if isbn_10 else None)

        # Get cover image
        cover_id = entry.get("covers", [None])[0]
        cover_url = None
        if cover_id:
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"

        # Get publisher
        publishers = entry.get("publishers", [])
        publisher = publishers[0] if publishers else None

        # Get publication date
        publish_date = entry.get("publish_date")
        published_year = None
        if publish_date:
            try:
                # Try to extract year from various date formats
                for year_str in publish_date.split():
                    if year_str.isdigit() and len(year_str) == 4:
                        published_year = int(year_str)
                        break
            except:
                pass

        # Determine format
        format_type = _determine_format(entry)

        # Get page count
        page_count = entry.get("number_of_pages")

        # Build edition string
        edition_parts = []
        if entry.get("edition_name"):
            edition_parts.append(entry.get("edition_name"))
        if publisher:
            edition_parts.append(publisher)
        edition_str = ", ".join(edition_parts) if edition_parts else None

        return {
            "title": entry.get("title", original_title),
            "author": original_author,
            "isbn": isbn,
            "cover_url": cover_url,
            "description": None,  # Open Library editions don't have descriptions
            "published_year": published_year,
            "page_count": page_count,
            "genres": [],  # Open Library editions don't have genre info
            "format": format_type,
            "edition": edition_str,
            "publisher": publisher,
        }
    except Exception as e:
        print(f"Error transforming Open Library edition: {e}")
        return None


