"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentlyReading } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import { useState } from "react";
import BookDetailModal from "@/components/BookDetailModal";
import NYTBookRow from "@/components/NYTBookRow";
import AwardWinnersRow from "@/components/AwardWinnersRow";

export default function Home() {
  const currentlyReadingQuery = useQuery({
    queryKey: ["currently-reading"],
    queryFn: getCurrentlyReading,
  });
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const queryClient = useQueryClient();

  return (
    <main className="min-h-screen gradient-soft">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-4">
            Curio
          </h1>
          <p className="text-xl text-pine-700 max-w-2xl mx-auto font-medium">
            A space to curate your reading
          </p>
        </div>

        {/* Search for Books */}
        <SearchBar />

        {/* Currently Reading Section */}
        <div className="max-w-5xl mx-auto py-10">
          {currentlyReadingQuery.data &&
            currentlyReadingQuery.data.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">📖</span>
                  <h2 className="text-3xl font-bold text-pine-900">
                    Currently Reading
                  </h2>
                </div>
                <div className="bg-white rounded-2xl shadow-card p-8 border border-primary-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {currentlyReadingQuery.data.slice(0, 6).map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedBook(item)}
                        className="flex gap-4 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl hover:shadow-card-hover transition-all cursor-pointer border border-primary-100"
                      >
                        {item.book.cover_url && (
                          <img
                            src={item.book.cover_url}
                            alt={item.book.title}
                            className="w-16 h-24 object-cover rounded-book book-cover-shadow"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2 text-pine-900">
                            {item.book.title}
                          </h3>
                          <p className="text-xs text-pine-600 mt-1">
                            {item.book.author}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* See All Lists Button */}
                  <div className="mt-6 text-center">
                    <Link
                      href="/lists"
                      className="text-primary-700 hover:text-primary-800 text-lg font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      📚 See all my lists
                      <span className="text-2xl">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

          {/* Book Detail Modal */}
          {selectedBook && (
            <BookDetailModal
              book={selectedBook.book}
              bookListItem={selectedBook}
              isOpen={!!selectedBook}
              onClose={() => {
                console.log("BookDetailModal onClose called");
                setSelectedBook(null);
                queryClient.invalidateQueries({
                  queryKey: ["currently-reading"],
                });
              }}
              showAddButton={false}
            />
          )}
        </div>

        {/* Curated Book Lists */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">✨</span>
            <h2 className="text-3xl font-bold text-pine-900">Discover Books</h2>
          </div>
          <div className="space-y-8">
            {/* Pulitzer Prize Winners */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                  <span>🏆</span> Pulitzer Prize Winners
                </h3>
                <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                  Fiction
                </span>
              </div>
              <AwardWinnersRow awardType="pulitzer" maxBooks={10} />
            </div>

            {/* Booker Prize Winners */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                  <span>🏆</span> Booker Prize Winners
                </h3>
                <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                  International
                </span>
              </div>
              <AwardWinnersRow awardType="booker" maxBooks={10} />
            </div>
          </div>

          {/* See More Link */}
          <div className="text-center pt-8">
            <Link
              href="/search"
              className="inline-flex items-center gap-3 px-8 py-5 bg-white rounded-full shadow-card hover:shadow-card-hover transition-all border border-primary-100 group"
            >
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <p className="font-semibold text-pine-800 group-hover:text-primary-600 transition-colors">
                  Discover more books
                </p>
                <p className="text-sm text-pine-600">
                  Browse bestsellers, award winners & more
                </p>
              </div>
              <span className="text-2xl text-pine-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
