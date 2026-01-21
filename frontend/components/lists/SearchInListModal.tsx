"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchExternalBooks,
  addExternalBookToDb,
  addBookToList,
  getLists,
} from "@/lib/api";
import { BookCreate } from "@/types";
import toast from "react-hot-toast";

interface SearchInListModalProps {
  listId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchInListModal({
  listId,
  isOpen,
  onClose,
}: SearchInListModalProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  const getStatusForList = async () => {
    try {
      const lists = await queryClient.fetchQuery({
        queryKey: ["lists"],
        queryFn: getLists,
      });

      const currentList = lists.find((l: any) => l.id === listId);
      if (!currentList) return "to_read";

      // Only auto-set status for default status lists (not Favorites)
      if (currentList.is_default !== 1) {
        return "to_read";
      }

      // Match exact names for status lists only
      if (currentList.name === "Currently Reading") {
        return "reading";
      }
      if (currentList.name === "Finished") {
        return "finished";
      }
      if (currentList.name === "Want to Read") {
        return "to_read";
      }

      // For Favorites or any other default list, default to to_read
      return "to_read";
    } catch {
      return "to_read";
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchExternalBooks(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const addBookMutation = useMutation({
    mutationFn: async (book: BookCreate) => {
      // First add to library
      const addedBook = await addExternalBookToDb(book);

      // Get the appropriate status for this list
      const status = await getStatusForList();

      // Then add to this list with correct status
      await addBookToList(listId, {
        book_id: addedBook.id,
        status: status,
      });
      return addedBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list", listId] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("Book added to list!");
    },
    onError: (error: any) => {
      if (error.response?.data?.detail?.includes("UNIQUE constraint")) {
        toast.error("Book already in your library");
      } else {
        toast.error("Failed to add book");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold">Search & Add Books</h2>
              <p className="text-gray-600">
                Find books and add them to this list
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              ×
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by title, author, or ISBN..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && searchResults.results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.results.map((book: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3">
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-xs mb-2">
                        {book.author}
                      </p>
                      {book.published_year && (
                        <p className="text-gray-500 text-xs mb-2">
                          {book.published_year}
                        </p>
                      )}
                      <button
                        onClick={() => addBookMutation.mutate(book)}
                        disabled={addBookMutation.isPending}
                        className="w-full px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-xs"
                      >
                        {addBookMutation.isPending
                          ? "Adding..."
                          : "+ Add to List"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {searchResults && searchResults.results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No books found. Try a different search.
            </div>
          )}

          {/* Initial State */}
          {!searchResults && !isSearching && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p>Search for books to add to your list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
