"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, removeBookFromList } from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import StatusBadge from "../ui/StatusBadge";
import FavoriteHeart from "../ui/FavoriteHeart";
import { useState } from "react";
import UpdateStatusModal from "./UpdateStatusModal";
import { Book, BookListItem } from "@/types";
import BookDetailModal from "../BookDetailModal";

interface ListDetailProps {
  listId: number;
}

export default function ListDetail({ listId }: ListDetailProps) {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<BookListItem | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);

  const {
    data: list,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["list", listId],
    queryFn: () => getList(listId),
  });

  const removeBookMutation = useMutation({
    mutationFn: (bookId: number) => removeBookFromList(listId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list", listId] });
      toast.success("Book removed from list");
    },
    onError: (error) => {
      console.error("Error removing book:", error);
      toast.error("Failed to remove book from list");
    },
  });

  const handleRemoveBook = (bookId: number, bookTitle: string) => {
    if (confirm(`Remove "${bookTitle}" from this list?`)) {
      removeBookMutation.mutate(bookId);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading list...</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        Error loading list. Please try again.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{list.name}</h1>
        {list.description && (
          <p className="text-gray-600 mb-3">{list.description}</p>
        )}
        <p className="text-sm text-gray-500">
          Created {new Date(list.created_at).toLocaleDateString()} •{" "}
          {list.items.length} {list.items.length === 1 ? "book" : "books"}
        </p>
      </div>

      {/* Books Grid */}
      {list.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-end mb-2">
                <FavoriteHeart
                  listId={listId}
                  bookId={item.book.id}
                  isFavorite={item.is_favorite}
                />
              </div>
              <div
                onClick={() => setSelectedBookForDetail(item.book)}
                className="cursor-pointer"
              >
                {item.book.cover_url && (
                  <img
                    src={item.book.cover_url}
                    alt={item.book.title}
                    className="w-full h-48 object-contain mb-3"
                  />
                )}

                <div className="mb-2">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                    {item.book.title}
                  </h3>
                  <StatusBadge
                    status={item.status}
                    onClick={() => setSelectedItem(item)}
                  />
                </div>

                <p className="text-gray-600 text-sm mb-2">{item.book.author}</p>

                {item.book.published_year && (
                  <p className="text-gray-500 text-xs mb-2">
                    Published: {item.book.published_year}
                  </p>
                )}

                {item.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                    <p className="text-sm text-gray-700 italic">{item.notes}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-3">
                  Added {new Date(item.added_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBook(item.book.id, item.book.title);
                }}
                disabled={removeBookMutation.isPending}
                className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-200 text-sm"
              >
                {removeBookMutation.isPending
                  ? "Removing..."
                  : "Remove from List"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">This list is empty.</p>
          <Link
            href="/search"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search for Books to Add
          </Link>
        </div>
      )}
      {selectedItem && (
        <UpdateStatusModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
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
