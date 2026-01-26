"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { searchExternalBooks, addExternalBookToDb } from "@/lib/api";
import AddToListModal from "./lists/AddToListModal";
import BookDetailModal from "./BookDetailModal";
import { Book, BookCreate } from "@/types";
import toast from "react-hot-toast";

interface CuratedBookRowProps {
  query: string;
}

export default function CuratedBookRow({ query }: CuratedBookRowProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["curated", query],
    queryFn: async () => {
      const response = await searchExternalBooks(query, 10);
      const results = response.results || [];
      return results
        .filter(
          (book: Book) =>
            book.cover_url &&
            !book.cover_url.includes("no_cover") &&
            book.author !== "Unknown Author"
        )
        .slice(0, 10); // Take first 10 good ones
    },
  });

  const addBookMutation = useMutation({
    mutationFn: (book: BookCreate) => addExternalBookToDb(book),
    onSuccess: (addedBook) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setSelectedBook(addedBook);
      toast.success("Book added! Now add it to a list.");
    },
    onError: (error: any) => {
      if (error.response?.data?.detail?.includes("UNIQUE constraint")) {
        toast.error("Book already in your library");
      } else {
        toast.error("Failed to add book");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-32 h-48 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">No books found</p>;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {data.slice(0, 10).map((book: Book, index: number) => (
          <div
            key={index}
            className="flex-shrink-0 w-32 cursor-pointer group"
            onClick={() => setSelectedBookForDetail(book)}
          >
            {/* Book Cover */}
            {book.cover_url ? (
              <div className="relative mb-2">
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                />
                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addBookMutation.mutate(book as BookCreate);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50"
                  title="Add to library"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No cover</span>
              </div>
            )}

            {/* Book Title */}
            <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
              {book.title}
            </h4>

            {/* Author */}
            <p className="text-xs text-gray-600 line-clamp-1">{book.author}</p>
          </div>
        ))}
      </div>

      {/* Add to List Modal */}
      {selectedBook && (
        <AddToListModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Book Detail Modal */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          isOpen={!!selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          showAddButton={true}
        />
      )}
    </>
  );
}
