import asyncio
import httpx
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
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


def _deduplicate_books(books: List[dict], query: str = "") -> List[dict]:
    """
    Remove duplicate books, keeping the one with most information.
    Deduplicates by title + author (case-insensitive).
    When a query is provided, books whose author matches the query get a
    relevance boost so they sort above books merely *about* that person.
    """
    seen = {}
    query_lower = query.lower().strip()

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
            # Boost books where the query matches the author name
            author_match = 1 if (query_lower and query_lower in author) else 0
            seen[key] = {"book": book, "score": quality_score, "author_match": author_match}

    # Sort by author relevance first, then quality score
    return [
        item["book"]
        for item in sorted(
            seen.values(),
            key=lambda x: (x["author_match"], x["score"]),
            reverse=True,
        )
    ]


async def _fetch_google_books(client: httpx.AsyncClient, query: str, max_results: int, api_key: Optional[str] = None) -> List[dict]:
    """Fetch books from Google Books API for a given query string."""
    params = {
        "q": query,
        "maxResults": min(max_results, 40),
        "printType": "books",
        "langRestrict": "en",
        "orderBy": "relevance",
    }

    if api_key:
        params["key"] = api_key

    response = await client.get(GOOGLE_BOOKS_API, params=params, timeout=10.0)
    response.raise_for_status()
    data = response.json()

    books = []
    for item in data.get("items", []):
        book = transform_google_book(item)
        if book:
            books.append(book)
    return books


def _transform_ol_doc(doc: dict) -> Optional[dict]:
    """Transform an Open Library search doc into our book format."""
    title = doc.get("title", "")
    authors = doc.get("author_name", [])
    if not title or not authors:
        return None

    cover_id = doc.get("cover_i")
    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None

    isbns = doc.get("isbn", [])
    isbn = isbns[0] if isbns else None

    first_sentence = doc.get("first_sentence")
    description = None
    if isinstance(first_sentence, dict):
        description = first_sentence.get("value")
    elif isinstance(first_sentence, list) and first_sentence:
        description = first_sentence[0]

    return {
        "title": title,
        "author": authors[0],
        "isbn": isbn,
        "cover_url": cover_url,
        "description": description,
        "published_year": doc.get("first_publish_year"),
        "page_count": doc.get("number_of_pages_median"),
        "genres": doc.get("subject", [])[:5],
        "edition_count": doc.get("edition_count", 0),
    }


async def _ol_search(client: httpx.AsyncClient, params: dict, max_results: int = 30) -> List[dict]:
    """Run a single Open Library search and return transformed results."""
    try:
        resp = await client.get(
            "https://openlibrary.org/search.json",
            params={**params, "limit": max_results, "sort": "editions"},
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for doc in data.get("docs", []):
            book = _transform_ol_doc(doc)
            if book:
                results.append(book)
        return results
    except Exception as e:
        print(f"Error fetching Open Library: {e}")
        return []


async def _fetch_open_library_popularity(
    client: httpx.AsyncClient, query: str, max_results: int = 30
) -> Tuple[List[dict], bool]:
    """
    Fetch books from Open Library sorted by edition count (popularity proxy).
    Runs both an author search and a title search in parallel.
    Returns (merged_results, is_author_query) where is_author_query indicates
    whether the query is better interpreted as an author name.
    """
    try:
        author_results, title_results = await asyncio.gather(
            _ol_search(client, {"author": query}, max_results),
            _ol_search(client, {"title": query}, max_results),
        )

        # Determine if this is an author query or title query
        # by comparing the top edition counts from each search
        top_author_editions = author_results[0]["edition_count"] if author_results else 0
        top_title_editions = title_results[0]["edition_count"] if title_results else 0

        is_author_query = top_author_editions > top_title_editions

        # Use the winning set as primary, supplement with the other
        if is_author_query:
            primary, secondary = author_results, title_results
        else:
            primary, secondary = title_results, author_results

        # Merge: deduplicate by normalized title, keeping whichever has more editions
        seen: Dict[str, dict] = {}
        for book in primary + secondary:
            key = _normalize_title(book["title"])
            if not key:
                continue
            if key not in seen or book["edition_count"] > seen[key]["edition_count"]:
                seen[key] = book

        merged = sorted(seen.values(), key=lambda b: b["edition_count"], reverse=True)
        return merged, is_author_query
    except Exception as e:
        print(f"Error fetching Open Library popularity: {e}")
        return [], False


def _normalize_title(title: str) -> str:
    """Normalize a title for fuzzy matching."""
    import re
    t = title.lower().strip()
    # Remove subtitles after colon
    t = t.split(":")[0].strip()
    # Remove common articles from start
    t = re.sub(r"^(the|a|an)\s+", "", t)
    # Remove non-alphanumeric
    t = re.sub(r"[^a-z0-9\s]", "", t)
    return t.strip()


def _merge_with_popularity(
    google_books: List[dict],
    ol_popularity: List[dict],
    query: str,
) -> List[dict]:
    """
    Merge Google Books results with Open Library popularity data.
    - Google results matched to OL entries get ranked by edition count.
    - Popular OL books not in Google results are included with OL data.
    - Google-only books are appended at the end.
    """
    query_lower = query.lower().strip()

    # Build a popularity map from OL: normalized_title -> {edition_count, ol_book}
    popularity_map: Dict[str, dict] = {}
    for ol_book in ol_popularity:
        key = _normalize_title(ol_book["title"])
        if key and key not in popularity_map:
            popularity_map[key] = {
                "edition_count": ol_book.get("edition_count", 0),
                "ol_book": ol_book,
            }

    # Score and match Google books against OL popularity
    matched_keys = set()
    scored_books: List[Tuple[int, int, int, dict]] = []

    for book in google_books:
        norm_title = _normalize_title(book.get("title", ""))
        edition_count = 0
        if norm_title in popularity_map:
            edition_count = popularity_map[norm_title]["edition_count"]
            matched_keys.add(norm_title)

        author_match = 1 if (query_lower and query_lower in book.get("author", "").lower()) else 0
        quality = _calculate_book_quality_score(book)

        scored_books.append((author_match, edition_count, quality, book))

    # Add popular OL books that weren't found in Google results,
    # but only if the query is meaningfully related to the book.
    # Use strict matching: the query must be a major part of the title
    # or closely match the author name — not just a substring.
    query_norm = _normalize_title(query)
    for norm_title, entry in popularity_map.items():
        if norm_title not in matched_keys and entry["edition_count"] >= 10:
            ol_book = entry["ol_book"]
            if not ol_book.get("cover_url"):
                continue

            ol_author_lower = ol_book.get("author", "").lower()

            # Title relevance: query must be the title or the title starts with the query
            title_relevant = (
                norm_title == query_norm
                or norm_title.startswith(query_norm)
                or query_norm.startswith(norm_title)
            )
            # Author relevance: query closely matches the author name
            author_relevant = query_lower in ol_author_lower and len(query_lower) > len(ol_author_lower) * 0.4

            if not title_relevant and not author_relevant:
                continue

            author_match = 1 if author_relevant else 0
            quality = _calculate_book_quality_score(ol_book)
            scored_books.append((author_match, entry["edition_count"], quality, ol_book))

    # Sort: author match first, then edition count (popularity), then quality
    scored_books.sort(key=lambda x: (x[0], x[1], x[2]), reverse=True)

    return [book for _, _, _, book in scored_books]


async def search_google_books(query: str, max_results: int = 20) -> List[dict]:
    """
    Search Google Books API + Open Library popularity data, then merge results.
    Runs three requests in parallel: Google general, Google inauthor, and
    Open Library sorted by edition count. Uses edition count as a popularity
    signal to rank results so well-known books appear first.
    """
    # Check cache first
    cache_key = f"search:{query}:{max_results}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    api_key = os.getenv("GOOGLE_BOOKS_API_KEY")
    if not api_key:
        print("Warning: No Google Books API key found")

    has_prefix = any(prefix in query for prefix in ["intitle:", "inauthor:", "isbn:"])

    async with httpx.AsyncClient() as client:
        try:
            if has_prefix:
                # User provided an explicit qualifier — use it as-is
                google_books = await _fetch_google_books(client, query, max_results, api_key)
                ol_popularity = []
            else:
                # Run Google general + OL popularity in parallel.
                # OL determines whether the query is an author or title search.
                general_task = _fetch_google_books(client, query, max_results, api_key)
                ol_task = _fetch_open_library_popularity(client, query, 30)

                general_books, (ol_popularity, is_author_query) = await asyncio.gather(
                    general_task, ol_task
                )

                if is_author_query:
                    # Fetch inauthor: results from Google for author queries
                    author_books = await _fetch_google_books(
                        client, f"inauthor:{query}", max_results, api_key
                    )
                    google_books = author_books + general_books
                else:
                    # Fetch intitle: results from Google for title queries
                    title_books = await _fetch_google_books(
                        client, f"intitle:{query}", max_results, api_key
                    )
                    google_books = title_books

            # Deduplicate Google results first
            google_books = _deduplicate_books(google_books, query)

            # Merge with OL popularity data for final ranking
            if ol_popularity:
                books = _merge_with_popularity(google_books, ol_popularity, query)
            else:
                books = google_books

            # Limit to requested max_results
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
        book_id = item.get("id")

        # Get cover image - construct URL from book ID for reliability
        # The search API returns URLs without the imgtk token which often fail (HTTP 204)
        # Using the publisher content format with fife parameter works reliably
        cover_url = None
        if book_id:
            cover_url = f"https://books.google.com/books/publisher/content/images/frontcover/{book_id}?fife=w400-h600"
        else:
            # Fallback to imageLinks if no book ID
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


