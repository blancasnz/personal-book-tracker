"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getPublicLists } from "@/lib/api";
import { Book, BookList } from "@/types";
import AddToListModal from "@/components/lists/AddToListModal";
import BookDetailModal from "@/components/BookDetailModal";
import { useCopyListToCurations } from "@/hooks/useCopyListToCurations";
import ScrollToTop from "@/components/ui/ScrollToTop";
import toast from "react-hot-toast";

const BOOKS_PER_PAGE = 30;

export default function CommunityListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = Number(params.listId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);

  const { copyList, isCopying, progress } = useCopyListToCurations();

  const { data: publicLists, isLoading } = useQuery({
    queryKey: ["publicLists"],
    queryFn: getPublicLists,
  });

  const list = useMemo(
    () => publicLists?.find((l: BookList) => l.id === listId) ?? null,
    [publicLists, listId]
  );

  const books = useMemo(() => {
    if (!list) return [];
    return list.items.map((item) => ({
      ...item.book,
      id: item.book.id,
    }));
  }, [list]);

  const filteredBooks = searchQuery.trim()
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  const visibleBooks = useMemo(
    () => filteredBooks.slice(0, visibleCount),
    [filteredBooks, visibleCount]
  );

  const hasMoreBooks = visibleCount < filteredBooks.length;
  const remainingBooks = filteredBooks.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + BOOKS_PER_PAGE);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(BOOKS_PER_PAGE);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <p className="text-pine-500">Loading list...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen gradient-soft flex flex-col items-center justify-center gap-4">
        <p className="text-pine-500">List not found.</p>
        <button
          onClick={() => router.push("/search?mode=lists&tab=community")}
          className="px-4 py-2 bg-white border border-primary-200 text-pine-700 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
        >
          Back to Community Curations
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-soft">
      {/* Header Banner */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white border border-primary-200 text-pine-700 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
            >
              ← Back to Community
            </button>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-1">
                {list.name}
              </h1>
              {list.description && (
                <p className="text-sm text-pine-600 mt-0.5 max-w-md">
                  {list.description}
                </p>
              )}
            </div>

            {/* Add to My Curations */}
            <button
              onClick={() =>
                copyList({
                  listName: list.name,
                  listDescription: list.description || undefined,
                  communityItems: list.items,
                })
              }
              disabled={isCopying}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 disabled:opacity-60 rounded-lg transition-all text-sm font-medium shadow-sm"
            >
              {isCopying && progress
                ? `Copying... (${progress.current}/${progress.total})`
                : "Add to My Curations"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={(e) => e.preventDefault()} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search within this list..."
              className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-pine-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-warm-200 text-pine-800 hover:bg-warm-300 rounded-lg transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <div className="mb-6">
          <p className="text-pine-600">
            {searchQuery ? (
              <>
                Showing {visibleBooks.length} of {filteredBooks.length} results
              </>
            ) : (
              <>
                Showing {visibleBooks.length} of {books.length} books
              </>
            )}
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleBooks.map((book) => (
            <div
              key={book.id}
              className="cursor-pointer group bg-white rounded-lg shadow-sm hover:shadow-card-hover transition-all overflow-hidden border border-primary-100"
              onClick={() => setSelectedBookForDetail(book)}
            >
              <div className="relative h-52 flex items-center justify-center bg-warm-50 p-3">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200 rounded-book book-cover-shadow"
                  />
                ) : (
                  <span className="text-pine-400 text-sm">No cover</span>
                )}

                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBook(book);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-50"
                  title="Add to list"
                >
                  <span className="text-sm leading-none text-primary-600">+</span>
                </button>
              </div>

              <div className="p-3">
                <h4 className="text-sm font-semibold text-pine-900 line-clamp-2 mb-1">
                  {book.title}
                </h4>
                <p className="text-xs text-pine-600 line-clamp-1">
                  {book.author}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMoreBooks && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium shadow-sm"
            >
              Load More ({remainingBooks} remaining)
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredBooks.length === 0 && searchQuery && (
          <div className="text-center py-12 text-pine-500">
            No books match &quot;{searchQuery}&quot; in this list.
          </div>
        )}

        {/* Empty List */}
        {books.length === 0 && !searchQuery && (
          <div className="text-center py-12 text-pine-500">
            This list has no books yet.
          </div>
        )}
      </div>

      {/* Add to List Modal */}
      {selectedBook && (
        <AddToListModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Book Detail Modal */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          isOpen={!!selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          showAddButton={true}
        />
      )}

      <ScrollToTop />
    </div>
  );
}
