import BookSearch from "@/components/BookSearch";
import Link from "next/link";

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Discover Books
              </h1>
              <p className="text-gray-600">
                Search millions of books and add them to your library
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
            >
              ← Home
            </Link>
          </div>

          <BookSearch />
        </div>
      </div>
    </main>
  );
}
