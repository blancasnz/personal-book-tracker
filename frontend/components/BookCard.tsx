"use client";

import { useQuery } from "@tanstack/react-query";
import { checkBookExists } from "@/lib/api";
import { Book } from "@/types";
import ListSelector from "./ListSelector";
import Link from "next/link";
import { getBookPageUrl } from "@/lib/bookUtils";

interface BookCardProps {
  book: any;
  onAddToList: () => void;
}

export default function BookCard({ book, onAddToList }: BookCardProps) {
  // Check if book already exists in library
  const { data: bookCheck, refetch } = useQuery({
    queryKey: ["book-check", book.isbn, book.title, book.author],
    queryFn: () => checkBookExists(
      book.isbn ?? undefined,
      book.title,
      book.author
    ),
  });

  const bookExists = bookCheck?.exists || false;
  const existingLists = bookCheck?.lists || [];

  return (
    <div className="border border-primary-100 rounded-lg p-4 hover:shadow-card-hover transition-all bg-white">
      <Link href={getBookPageUrl(book)} className="cursor-pointer block">
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-48 object-contain mb-3 rounded-book book-cover-shadow"
          />
        )}

        <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-pine-900">
          {book.title}
        </h3>
        <p className="text-pine-600 text-sm mb-2">{book.author}</p>

        {/* Format Badge */}
        {book.format && (
          <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-medium mb-2">
            {book.format === "hardcover" && "📘 Hardcover"}
            {book.format === "paperback" && "📖 Paperback"}
            {book.format === "ebook" && "📱 eBook"}
            {book.format === "audiobook" && "🎧 Audiobook"}
          </span>
        )}

        {book.published_year && (
          <p className="text-pine-500 text-xs mb-2">
            Published: {book.published_year}
          </p>
        )}

        {book.description && (
          <p className="text-pine-600 text-sm mb-3 line-clamp-3">
            {book.description}
          </p>
        )}
      </Link>

      {/* Show ListSelector if book exists, otherwise show Add to List button */}
      {bookExists && existingLists.length > 0 ? (
        <div onClick={(e) => e.stopPropagation()}>
          <ListSelector
            book={bookCheck.book}
            existingLists={existingLists}
            onUpdate={refetch}
          />
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToList();
          }}
          className="w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 text-sm font-medium transition-all"
        >
          Add to List
        </button>
      )}
    </div>
  );
}