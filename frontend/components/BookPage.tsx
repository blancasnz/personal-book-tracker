"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkBookExists } from "@/lib/api";
import { Book } from "@/types";
import EditionSelector from "./EditionSelector";
import ListSelector from "./ListSelector";
import GenreBadges from "./ui/GenreBadges";
import Link from "next/link";

interface BookPageProps {
  book: Book;
  showAddButton?: boolean;
}

export default function BookPage({
  book,
  showAddButton = false,
}: BookPageProps) {
  const [currentBook, setCurrentBook] = useState<Book>(book);
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentBook(book);
  }, [book]);

  // Check if book already exists in library
  const { data: bookCheck, refetch: refetchBookCheck } = useQuery({
    queryKey: ["book-check", book.isbn, book.title, book.author],
    queryFn: () =>
      checkBookExists(book.isbn ?? undefined, book.title, book.author),
    enabled: showAddButton,
  });

  const bookExists = bookCheck?.exists || false;
  const existingLists = bookCheck?.lists || [];

  return (
    <div className="min-h-screen bg-pine-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="text-pine-600 hover:text-pine-800 font-medium"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-card p-8 border border-primary-100">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Book Cover */}
            <div className="flex-shrink-0">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
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
                  {book.title}
                </h1>
                <p className="text-xl text-pine-700">by {book.author}</p>
              </div>

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-pine-600 mb-2">
                    Genres:
                  </h3>
                  <GenreBadges genres={book.genres} maxVisible={10} />
                </div>
              )}

              {/* Page Count & Published Year */}
              <div className="flex gap-6 text-sm text-pine-600">
                {book.page_count && (
                  <div>
                    <span className="font-medium">Pages:</span>{" "}
                    {book.page_count}
                  </div>
                )}
                {book.published_year && (
                  <div>
                    <span className="font-medium">Published:</span>{" "}
                    {book.published_year}
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <div>
                  <h3 className="text-lg font-semibold text-pine-800 mb-3">
                    Description
                  </h3>
                  <p className="text-pine-700 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {!book.description && (
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
                          description: book.description || edition.description,
                          genres:
                            book.genres && book.genres.length > 0
                              ? book.genres
                              : edition.genres,
                        };
                        setCurrentBook(mergedBook);
                      }}
                      selectedFormat={currentBook.format ?? undefined}
                    />
                  </div>

                  {/* List Management */}
                  <div>
                    <h3 className="text-sm font-medium text-pine-600 mb-2">
                      {bookExists ? "Manage Lists:" : "Add to List:"}
                    </h3>
                    {bookExists && existingLists.length > 0 ? (
                      <ListSelector
                        book={bookCheck.book}
                        existingLists={existingLists}
                        onUpdate={refetchBookCheck}
                      />
                    ) : (
                      <Link
                        href={`/search?addBook=${book.isbn || book.title}`}
                        className="block w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all font-medium shadow-sm text-center"
                      >
                        Add to List
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Other Editions Section - Placeholder for future */}
        <div className="mt-8 bg-white rounded-xl shadow-card p-8 border border-primary-100">
          <h2 className="text-2xl font-bold text-pine-900 mb-4">
            Other Editions
          </h2>
          <p className="text-pine-600">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
