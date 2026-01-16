'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchExternalBooks, addExternalBookToDb } from '@/lib/api';
import { BookCreate, Book } from '@/types';
import AddToListModal from './lists/AddToListModal';
import { BookCardSkeleton } from './ui/Skeleton';
import toast from 'react-hot-toast';
import BookDetailModal from './BookDetailModal';

export default function BookSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchExternalBooks(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const addBookMutation = useMutation({
    mutationFn: (book: BookCreate) => addExternalBookToDb(book),
    onSuccess: (addedBook) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBook(addedBook);
      toast.success('Book added! Now add it to a list.');
    },
    onError: (error) => {
      console.error('Error adding book:', error);
      toast.error('Failed to add book');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setDebouncedQuery(searchQuery.trim());
    }
  };

  const handleAddBook = (book: BookCreate) => {
    addBookMutation.mutate(book);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!searchQuery.trim() || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          Error searching for books. Please try again.
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {searchResults && searchResults.results && !isLoading && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Found {searchResults.count} results for "{searchResults.query}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.results.map((book: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div 
        onClick={() => setSelectedBookForDetail(book)}
        className="cursor-pointer"
      >
                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-48 object-contain mb-3"
                  />
                )}

                <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{book.author}</p>

                {book.published_year && (
                  <p className="text-gray-500 text-xs mb-2">
                    Published: {book.published_year}
                  </p>
                )}

                {book.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {book.description}
                  </p>
                )}
                </div>
                {/* Button NOT clickable for details - only adds to library */}
                <button
                  onClick={(e) => {
          e.stopPropagation(); // Prevent opening modal
          handleAddBook(book);
        }}
                  disabled={addBookMutation.isPending}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                >
                  {addBookMutation.isPending ? 'Adding...' : 'Add to Library'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {debouncedQuery && searchResults && searchResults.count === 0 && (
        <div className="text-center py-12 text-gray-500">
          No books found for "{debouncedQuery}". Try a different search term.
        </div>
      )}

      {selectedBook && (
        <AddToListModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          isOpen={!!selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
        />
      )}
    </div>
  );
}