import BookSearch from '@/components/BookSearch';
import Link from 'next/link';

export default function SearchPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Search Books</h1>
            <p className="text-gray-600">
              Search for books from Google Books and add them to your library
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            ← Home
          </Link>
        </div>

        <BookSearch />
      </div>
    </main>
  );
}