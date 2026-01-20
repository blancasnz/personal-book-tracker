"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCurrentlyReading } from "@/lib/api";

export default function Home() {
  const currentlyReadingQuery = useQuery({
    queryKey: ["currently-reading"],
    queryFn: getCurrentlyReading,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Book Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Organize your reading life. Track books, create lists, and never
            forget what to read next.
          </p>
        </div>

        {/* Currently Reading Section */}
        {currentlyReadingQuery.data &&
          currentlyReadingQuery.data.length > 0 && (
            <div className="mb-12 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">📖</span>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Currently Reading
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentlyReadingQuery.data.slice(0, 6).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl hover:shadow-md transition-shadow"
                    >
                      {item.book.cover_url && (
                        <img
                          src={item.book.cover_url}
                          alt={item.book.title}
                          className="w-16 h-24 object-cover rounded-lg shadow-md"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
                          {item.book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.book.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Action Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/search"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-blue-100"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-3xl font-bold mb-3 text-gray-900">
                Discover Books
              </h2>
              <p className="text-gray-600">
                Search millions of books and add them to your library
              </p>
            </div>
          </Link>

          <Link
            href="/lists"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-purple-100"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-3xl font-bold mb-3 text-gray-900">
                My Lists
              </h2>
              <p className="text-gray-600">
                Organize your books into custom reading lists
              </p>
            </div>
          </Link>
        </div>

        {/* Stats Section (if you want to add later) */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-md border border-gray-100">
              <div className="text-3xl mb-2">📖</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentlyReadingQuery.data?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Currently Reading</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md border border-gray-100">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-gray-900">Track</div>
              <div className="text-sm text-gray-600">Rate & Review</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md border border-gray-100">
              <div className="text-3xl mb-2">🎲</div>
              <div className="text-2xl font-bold text-gray-900">Random</div>
              <div className="text-sm text-gray-600">Pick Your Next Read</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
