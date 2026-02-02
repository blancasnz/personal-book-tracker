"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getNYTBestsellers, addExternalBookToDb } from "@/lib/api";
import AddToListModal from "./lists/AddToListModal";
import Link from "next/link";
import { getBookPageUrl } from "@/lib/bookUtils";

import { Book, BookCreate } from "@/types";
import toast from "react-hot-toast";

interface NYTBookRowProps {
  listName: string;
}

export default function NYTBookRow({ listName }: NYTBookRowProps) {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nyt-bestsellers", listName],
    queryFn: () => getNYTBestsellers(listName),
    staleTime: 1000 * 60 * 60, // Data stays fresh for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
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

  const books = data?.results || [];

  if (books.length === 0) {
    return <p className="text-gray-500 text-sm">No books found</p>;
  }

  return (
    <>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {books.slice(0, 10).map((book: any, index: number) => (
            <Link
              key={index}
              href={getBookPageUrl(book)}
              className="flex-shrink-0 w-32 cursor-pointer group"
            >
              {/* Book Cover */}
              {book.cover_url ? (
                <div className="relative mb-2">
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                  />
                  {/* Rank Badge - Subtle */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    #{book.rank}
                  </div>
                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // ← Add this
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
              <p className="text-xs text-gray-600 line-clamp-1">
                {book.author}
              </p>

              {/* Weeks on List */}
              {book.weeks_on_list > 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  {book.weeks_on_list} weeks on list
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* See All Button */}
        <button
          onClick={() => router.push(`/search/nyt/${listName}`)}
          className="px-4 py-2 text-sm bg-warm-200 hover:bg-primary-200 text-primary-800  rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          See all {books.length} books →
        </button>
      </div>

      {/* Add to List Modal */}
      {selectedBook && (
        <AddToListModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </>
  );
}
