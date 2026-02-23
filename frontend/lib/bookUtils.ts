export function getBookPageUrl(book: any, searchQuery?: string): string {
  const params = new URLSearchParams();

  params.append("title", book.title || "");
  params.append("author", book.author || "");

  if (book.isbn) params.append("isbn", book.isbn);
  if (book.cover_url) params.append("cover_url", book.cover_url);
  if (book.description) params.append("description", book.description);
  if (book.published_year) params.append("published_year", book.published_year.toString());
  if (book.page_count) params.append("page_count", book.page_count.toString());
  if (book.genres && book.genres.length > 0) params.append("genres", book.genres.join(","));
  if (book.format) params.append("format", book.format);
  if (book.edition) params.append("edition", book.edition);
  if (searchQuery) params.append("q", searchQuery);

  // Use ISBN as identifier if available, otherwise use title slug
  const identifier = book.isbn || encodeURIComponent(book.title.toLowerCase().replace(/\s+/g, "-"));

  return `/books/preview/${identifier}?${params.toString()}`;
}