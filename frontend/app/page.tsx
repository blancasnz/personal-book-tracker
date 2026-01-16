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
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Book Tracker</h1>

        {/* Currently Reading Section */}
        {currentlyReadingQuery.data &&
          currentlyReadingQuery.data.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h2 className="text-2xl font-semibold mb-4">
                📖 Currently Reading
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentlyReadingQuery.data.slice(0, 4).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-white p-3 rounded-lg"
                  >
                    {item.book.cover_url && (
                      <img
                        src={item.book.cover_url}
                        alt={item.book.title}
                        className="w-16 h-24 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {item.book.title}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {item.book.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {currentlyReadingQuery.data.length > 4 && (
                <p className="text-sm text-gray-600 mt-3">
                  And {currentlyReadingQuery.data.length - 4} more...
                </p>
              )}
            </div>
          )}

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/search"
            className="p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">🔍 Search Books</h2>
            <p className="text-gray-600">
              Find books and add them to your library
            </p>
          </Link>

          <Link
            href="/lists"
            className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">📋 My Lists</h2>
            <p className="text-gray-600">Manage your reading lists</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
