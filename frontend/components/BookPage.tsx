"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkBookExists } from "@/lib/api";
import { Book } from "@/types";
import EditionSelector from "./EditionSelector";
import AddToListModal from "./lists/AddToListModal";
import GenreBadges from "./ui/GenreBadges";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BookPageProps {
  book: Book;
  showAddButton?: boolean;
  searchQuery?: string;
}

export default function BookPage({
  book,
  showAddButton = false,
  searchQuery,
}: BookPageProps) {
  const router = useRouter();
  const [currentBook, setCurrentBook] = useState<Book>(book);
  const [showListModal, setShowListModal] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || "");

  useEffect(() => {
    setCurrentBook(book);
  }, [book]);

  // Check if book already exists in library — always use original title/author
  // so all editions of the same book are recognized as already in a list
  const { data: bookCheck, refetch: refetchBookCheck } = useQuery({
    queryKey: ["book-check", book.title, book.author],
    queryFn: () =>
      checkBookExists(undefined, book.title, book.author),
    enabled: showAddButton,
  });

  const bookExists = bookCheck?.exists || false;
  const existingLists = bookCheck?.lists || [];

  return (
    <div className="min-h-screen bg-pine-50">
      {/* Header with search bar */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          {/* Title row - matches search page layout */}
          <div className="flex items-center justify-between relative mb-4">
            {/* Back link - Left */}
            <div className="w-40">
              {searchQuery && (
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-pine-600 hover:text-pine-800 font-medium text-sm"
                >
                  ← Back to results
                </Link>
              )}
            </div>

            {/* Title - Center */}
            <Link
              href="/search"
              className="absolute left-1/2 transform -translate-x-1/2 text-center hover:opacity-80 transition-opacity"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                Explore Books
              </h1>
            </Link>

            {/* My Curations - Right */}
            <Link
              href="/lists"
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 rounded-lg transition-all text-sm font-semibold shadow-sm"
            >
              My Curations
            </Link>
          </div>

          {/* Search bar row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (localSearchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
              }
            }}
            className="flex gap-2 max-w-2xl mx-auto"
          >
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search for books..."
              className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-pine-900"
            />
            <button
              type="submit"
              disabled={!localSearchQuery.trim()}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-card p-8 border border-primary-100">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Book Cover */}
            <div className="flex-shrink-0">
              {currentBook.cover_url ? (
                <img
                  src={currentBook.cover_url}
                  alt={currentBook.title}
                  className="w-64 h-96 object-contain rounded-book book-cover-shadow mx-auto lg:mx-0"
                />
              ) : (
                <div className="w-64 h-96 bg-warm-100 rounded-book flex items-center justify-center text-pine-400">
                  No cover available
                </div>
              )}
            </div>

            {/* Right: Book Details */}
            <div className="flex-1 space-y-6">
              {/* Title & Author */}
              <div>
                <h1 className="text-4xl font-bold text-pine-900 mb-2">
                  {currentBook.title}
                </h1>
                <p className="text-xl text-pine-700">
                  by {currentBook.author}
                </p>
              </div>

              {/* Genres */}
              {currentBook.genres && currentBook.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-pine-600 mb-2">
                    Genres:
                  </h3>
                  <GenreBadges genres={currentBook.genres} maxVisible={10} />
                </div>
              )}

              {/* Page Count & Published Year */}
              <div className="flex gap-6 text-sm text-pine-600">
                {currentBook.page_count && (
                  <div>
                    <span className="font-medium">Pages:</span>{" "}
                    {currentBook.page_count}
                  </div>
                )}
                {currentBook.published_year && (
                  <div>
                    <span className="font-medium">Published:</span>{" "}
                    {currentBook.published_year}
                  </div>
                )}
              </div>

              {/* Description */}
              {currentBook.description && (
                <div>
                  <h3 className="text-lg font-semibold text-pine-800 mb-3">
                    Description
                  </h3>
                  <p className="text-pine-700 leading-relaxed">
                    {currentBook.description}
                  </p>
                </div>
              )}

              {!currentBook.description && (
                <div className="text-pine-400 italic">
                  No description available
                </div>
              )}

              {/* Edition & List Management */}
              {showAddButton && (
                <div className="space-y-4 pt-6 border-t border-primary-100">
                  {/* Edition Selector */}
                  <div>
                    <h3 className="text-sm font-medium text-pine-600 mb-2">
                      Edition:
                    </h3>
                    <EditionSelector
                      book={book}
                      onSelectEdition={(edition) => {
                        const mergedBook = {
                          ...book,
                          ...edition,
                          description:
                            book.description || edition.description,
                          genres:
                            book.genres && book.genres.length > 0
                              ? book.genres
                              : edition.genres,
                        };
                        setCurrentBook(mergedBook);
                      }}
                      selectedFormat={currentBook.format ?? undefined}
                      existingBookId={bookExists ? bookCheck.book.id : undefined}
                    />
                  </div>

                  {/* Add to List / In List */}
                  <div>
                    {bookExists && existingLists.length > 0 ? (
                      <button
                        onClick={() => setShowListModal(true)}
                        className="w-full px-4 py-3 bg-primary-50 text-pine-800 rounded-lg hover:bg-primary-100 transition-colors font-medium border border-primary-200"
                      >
                        In {existingLists.length} list
                        {existingLists.length !== 1 ? "s" : ""}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowListModal(true)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all font-medium shadow-sm"
                      >
                        Add to List
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add to List / Manage Lists Modal */}
      <AddToListModal
        book={bookExists ? bookCheck.book : currentBook}
        isOpen={showListModal}
        onClose={() => {
          setShowListModal(false);
          refetchBookCheck();
        }}
        existingLists={existingLists}
      />
    </div>
  );
}
