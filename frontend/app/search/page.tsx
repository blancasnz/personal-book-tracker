import BookSearch from '@/components/BookSearch';

export default function SearchPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Search Books</h1>
        <p className="text-gray-600 mb-8">
          Search for books from Google Books and add them to your library
        </p>

        <BookSearch />
      </div>
    </main>
  );
}