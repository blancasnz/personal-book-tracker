"use client";

import { Book, BookCreate } from "@/types";

interface BookCardProps {
  book: Book & { rank?: number; weeks_on_list?: number; awardYear?: number };
  onClickBook: (book: Book) => void;
  onAddBook: (book: BookCreate) => void;
  isAdding?: boolean;
}

export default function BookCard({
  book,
  onClickBook,
  onAddBook,
  isAdding,
}: BookCardProps) {
  return (
    <div
      className="cursor-pointer group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      onClick={() => onClickBook(book)}
    >
      {/* Book Cover */}
      <div className="relative h-52 flex items-center justify-center bg-gray-50 p-3">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <span className="text-gray-400 text-sm">No cover</span>
        )}

        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddBook(book as BookCreate);
          }}
          disabled={isAdding}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50 disabled:opacity-50"
          title="Add to library"
        >
          <span className="text-sm leading-none">+</span>
        </button>
      </div>

      {/* Book Info */}
      <div className="p-3">
        {/* Badge - Rank or Award Year */}
        {(book.rank || book.awardYear) && (
          <div className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mb-1">
            {book.rank ? `#${book.rank}` : `🏆 ${book.awardYear}`}
          </div>
        )}

        {/* Book Title */}
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
          {book.title}
        </h4>

        {/* Author */}
        <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>

        {/* Weeks on list (NYT only) */}
        {book.weeks_on_list && book.weeks_on_list > 1 && (
          <p className="text-xs text-gray-400 mt-1">
            {book.weeks_on_list} weeks on list
          </p>
        )}
      </div>
    </div>
  );
}
