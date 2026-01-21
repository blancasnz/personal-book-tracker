"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, removeBookFromList, getLists } from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import StatusBadge from "../ui/StatusBadge";
import FavoriteHeart from "../ui/FavoriteHeart";
import { useState } from "react";
import UpdateStatusModal from "./UpdateStatusModal";
import { Book, BookListItem } from "@/types";
import BookDetailModal from "../BookDetailModal";
import StarRating from "../ui/StarRating";
import { updateBookInList } from "@/lib/api";
import EditListModal from "./EditListModal";
import RandomBookPicker from "./RandomBookPicker";
import SearchInListModal from "./SearchInListModal";

interface ListDetailProps {
  listId: number;
}

export default function ListDetail({ listId }: ListDetailProps) {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<BookListItem | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const {
    data: list,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["list", listId, sortOrder],
    queryFn: () => getList(listId, sortOrder),
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
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{list.name}</h1>

            {/* Description or Add Description prompt */}
            {list.description ? (
              <p className="text-gray-600 mb-3">{list.description}</p>
            ) : (
              list.is_default === 0 && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 mb-3"
                >
                  + Add description
                </button>
              )
            )}

            <p className="text-sm text-gray-500">
              Created {new Date(list.created_at).toLocaleDateString()} •{" "}
              {list.items.length} {list.items.length === 1 ? "book" : "books"}
            </p>
          </div>

          {/* Edit Button - Only for non-default lists */}
          <div className="flex gap-2">
            {/* Search button for ALL lists */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors flex items-center gap-2"
            >
              🔍 Add Books
            </button>

            {/* Random button for ALL lists */}
            <button
              onClick={() => setIsRandomPickerOpen(true)}
              className="px-4 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-2"
            >
              🎲 Random Book
            </button>

            {/* Edit button only for non-default lists */}
            {list.is_default === 0 && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                ✏️ Edit List
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sort Toggle - ADD THIS */}
      {list && list.items.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            {sortOrder === "desc" ? "↓ Newest First" : "↑ Oldest First"}
          </button>
        </div>
      )}
      {/* Books Grid */}
      {list.items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
            >
              {/* Favorite Heart */}
              <div className="flex justify-end mb-2">
                <FavoriteHeart
                  listId={listId}
                  bookId={item.book.id}
                  isFavorite={item.is_favorite}
                />
              </div>

              {/* Clickable area */}
              <div
                onClick={() => setSelectedBookForDetail(item.book)}
                className="cursor-pointer"
              >
                {item.book.cover_url && (
                  <div
                    className="mb-2 rounded-lg flex items-center justify-center"
                    style={{ height: "200px" }}
                  >
                    <img
                      src={item.book.cover_url}
                      alt={item.book.title}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>
                )}

                <div className="mb-2">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {item.book.title}
                  </h3>
                  <StatusBadge
                    status={item.status}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                  />
                </div>

                <p className="text-gray-600 text-xs mb-2">{item.book.author}</p>

                {/* Rating - Only show for finished books */}
                {item.status === "finished" && (
                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                    <StarRating
                      rating={item.rating || 0}
                      onRate={async (newRating) => {
                        try {
                          // Update rating in current list
                          await updateBookInList(
                            item.book_list_id,
                            item.book.id,
                            {
                              rating: newRating > 0 ? newRating : undefined,
                            }
                          );

                          // Get all lists this book is in and update rating everywhere
                          const allLists = await getLists();
                          const bookLists = await Promise.all(
                            allLists.map((list) =>
                              getList(list.id).catch(() => null)
                            )
                          );

                          // Update rating in all lists that contain this book
                          for (const list of bookLists) {
                            if (!list) continue;
                            const hasBook = list.items?.find(
                              (i: any) => i.book.id === item.book.id
                            );
                            if (hasBook && list.id !== item.book_list_id) {
                              await updateBookInList(list.id, item.book.id, {
                                rating: newRating > 0 ? newRating : undefined,
                              });
                            }
                          }

                          // Invalidate all queries to refresh
                          queryClient.invalidateQueries({ queryKey: ["list"] });
                          queryClient.invalidateQueries({
                            queryKey: ["lists"],
                          });
                          toast.success(
                            newRating > 0 ? "Rating updated!" : "Rating removed"
                          );
                        } catch {
                          toast.error("Failed to update rating");
                        }
                      }}
                      size="sm"
                    />
                  </div>
                )}

                {item.book.published_year && (
                  <p className="text-gray-400 text-xs mb-2">
                    {item.book.published_year &&
                      `Published: ${item.book.published_year} • `}
                    Added: {new Date(item.added_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBook(item.book.id, item.book.title);
                }}
                disabled={removeBookMutation.isPending}
                className="w-full px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:bg-gray-200 text-xs"
              >
                {removeBookMutation.isPending ? "Removing..." : "Remove"}
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
      {isEditModalOpen && (
        <EditListModal
          list={list}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {isRandomPickerOpen && (
        <RandomBookPicker
          listId={listId}
          isOpen={isRandomPickerOpen}
          onClose={() => setIsRandomPickerOpen(false)}
        />
      )}
      {isSearchModalOpen && (
        <SearchInListModal
          listId={listId}
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}
    </div>
  );
}
