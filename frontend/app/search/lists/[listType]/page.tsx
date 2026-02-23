"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { addExternalBookToDb } from "@/lib/api";
import { Book, BookCreate } from "@/types";
import AddToListModal from "@/components/lists/AddToListModal";
import BookDetailModal from "@/components/BookDetailModal";
import { CURATED_LISTS } from "@/data/lists";
import { TAB_CONFIG } from "@/data/exploreTabConfig";
import { useCopyListToCurations } from "@/hooks/useCopyListToCurations";
import toast from "react-hot-toast";
import BookCard from "@/components/ui/BookCard";
import ScrollToTop from "@/components/ui/ScrollToTop";

const BOOKS_PER_PAGE = 30;

// Build a map of list types to their titles, metadata, and parent tab
const LIST_METADATA: Record<
  string,
  { title: string; badge?: string; showYear?: boolean; tab: string }
> = {};
Object.entries(TAB_CONFIG).forEach(([tabId, lists]) => {
  lists.forEach((list) => {
    LIST_METADATA[list.listType] = {
      title: list.title,
      badge: list.badge,
      showYear: list.showYear,
      tab: tabId,
    };
  });
});

export default function ListsPage() {
  const params = useParams();
  const router = useRouter();
  const listType = params.listType as string;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);

  const listData = CURATED_LISTS[listType] || [];
  const metadata = LIST_METADATA[listType] || { title: "Book List" };
  const { copyList, isCopying, progress } = useCopyListToCurations();

  const books = listData.map((book, index) => ({
    ...book,
    id: -(index + 1), // Synthetic ID for type compatibility (not persisted)
    awardYear: book.year,
  }));

  const addBookMutation = useMutation({
    mutationFn: (book: BookCreate) => addExternalBookToDb(book),
    onSuccess: (addedBook) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setSelectedBook(addedBook);
    },
    onError: (error: any) => {
      if (error.response?.data?.detail?.includes("UNIQUE constraint")) {
        toast.error("Book already in your library");
      } else {
        toast.error("Failed to add book");
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Filter books by search query if provided
  const filteredBooks = searchQuery.trim()
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  // Paginate: show only visibleCount books
  const visibleBooks = useMemo(() => {
    return filteredBooks.slice(0, visibleCount);
  }, [filteredBooks, visibleCount]);

  const hasMoreBooks = visibleCount < filteredBooks.length;
  const remainingBooks = filteredBooks.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + BOOKS_PER_PAGE);
  };

  // Reset visible count when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(BOOKS_PER_PAGE);
  };

  // Determine year range for award lists
  const hasYears = listData.some((book) => book.year);
  const years = listData
    .filter((b) => b.year)
    .map((b) => b.year as number)
    .sort((a, b) => a - b);
  const yearRange =
    years.length > 0 ? `${years[0]} to ${years[years.length - 1]}` : null;

  // Determine if this is a ranked list
  const isRankedList = listData.some((book) => book.rank);

  return (
    <div className="min-h-screen gradient-soft">
      {/* Header Banner */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Back to Discover - Left */}
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white border border-primary-200 text-pine-700 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
            >
              ← Back to Discover
            </button>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-1">
                {metadata.title}
              </h1>
              {metadata.badge && (
                <span className="text-sm text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                  {metadata.badge}
                </span>
              )}
            </div>

            {/* My Curations - Right (nav) */}
            <Link
              href="/lists"
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 rounded-lg transition-all text-sm font-semibold shadow-sm"
            >
              My Curations
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Copy to My Curations action bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-pine-600">
            {books.length} books
            {yearRange && metadata.showYear && <span> &middot; {yearRange}</span>}
          </p>
          <button
            onClick={() =>
              copyList({
                listName: metadata.title,
                curatedBooks: listData,
              })
            }
            disabled={isCopying}
            className="px-4 py-2 bg-white border border-primary-200 text-pine-700 hover:bg-primary-50 disabled:opacity-60 rounded-lg transition-colors text-sm font-medium"
          >
            {isCopying && progress
              ? `Copying... (${progress.current}/${progress.total})`
              : "+ Copy to My Curations"}
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
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
              <>Showing {visibleBooks.length} of {filteredBooks.length} results</>
            ) : (
              <>
                Showing {visibleBooks.length} of {books.length} books
                {yearRange && metadata.showYear && <span> from {yearRange}</span>}
                {isRankedList && <span> (ranked list)</span>}
              </>
            )}
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleBooks.map((book, index) => (
            <BookCard
              key={index}
              book={book}
              onClickBook={(b) => setSelectedBookForDetail(b)}
              onAddBook={(b) => addBookMutation.mutate(b)}
              isAdding={addBookMutation.isPending}
            />
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
            No books match "{searchQuery}" in this list.
          </div>
        )}

        {/* Empty List */}
        {books.length === 0 && !searchQuery && (
          <div className="text-center py-12 text-pine-500">
            No books found in this list.
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
