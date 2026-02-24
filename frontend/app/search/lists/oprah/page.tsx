"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { addExternalBookToDb } from "@/lib/api";
import { Book, BookCreate } from "@/types";
import AddToListModal from "@/components/lists/AddToListModal";
import BookDetailModal from "@/components/BookDetailModal";
import {
  OPRAH_BOOK_CLUB_2020S,
  OPRAH_BOOK_CLUB_2010S,
  OPRAH_BOOK_CLUB_2000S,
} from "@/data/lists";
import { useCopyListToCurations } from "@/hooks/useCopyListToCurations";
import ScrollToTop from "@/components/ui/ScrollToTop";
import toast from "react-hot-toast";
import BookCard from "@/components/ui/BookCard";

const BOOKS_PER_PAGE = 30;

const DECADE_TABS = [
  { id: "2020s", label: "2020s", data: OPRAH_BOOK_CLUB_2020S },
  { id: "2010s", label: "2010s", data: OPRAH_BOOK_CLUB_2010S },
  { id: "2000s", label: "2000s", data: OPRAH_BOOK_CLUB_2000S },
];

export default function OprahBookClubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("2020s");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);

  const { copyList, isCopying, progress } = useCopyListToCurations();

  const activeTabData = DECADE_TABS.find((tab) => tab.id === activeTab);
  const listData = activeTabData?.data || [];
  const allBooks = [...OPRAH_BOOK_CLUB_2020S, ...OPRAH_BOOK_CLUB_2010S, ...OPRAH_BOOK_CLUB_2000S];

  const books = listData.map((book, index) => ({
    ...book,
    id: -(index + 1),
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

  // Reset visible count when search or tab changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(BOOKS_PER_PAGE);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setVisibleCount(BOOKS_PER_PAGE);
  };

  // Determine year range for the active tab
  const years = listData
    .filter((b) => b.year)
    .map((b) => b.year as number)
    .sort((a, b) => a - b);
  const yearRange =
    years.length > 0 ? `${years[0]} to ${years[years.length - 1]}` : null;

  // Total books across all decades
  const totalBooks =
    OPRAH_BOOK_CLUB_2020S.length +
    OPRAH_BOOK_CLUB_2010S.length +
    OPRAH_BOOK_CLUB_2000S.length;

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
              &larr; Back to Discover
            </button>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-1">
                Oprah's Book Club
              </h1>
              <span className="text-sm text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                {totalBooks} picks since 2000
              </span>
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
            {totalBooks} books &middot; since 2000
          </p>
          <button
            onClick={() =>
              copyList({
                listName: "Oprah's Book Club",
                curatedBooks: allBooks,
                showYear: true,
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

        {/* Decade Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-primary-100">
            {DECADE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-pine-600 hover:bg-primary-50"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-75">
                  ({tab.data.length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search within this decade..."
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
                {yearRange && <span> from {yearRange}</span>}
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
            No books match "{searchQuery}" in this decade.
          </div>
        )}

        {/* Empty List */}
        {books.length === 0 && !searchQuery && (
          <div className="text-center py-12 text-pine-500">
            No books found for this decade.
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
