"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import GenreBadges from "../ui/GenreBadges";
import EditGenresModal from "../books/EditGenresModal";
import ReadingProgressTracker from "../ui/ReadingProgressTracker";

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
  const [editGenresBook, setEditGenresBook] = useState<{
    id: number;
    title: string;
    genres: string[];
  } | null>(null);

  const {
    data: list,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["list", listId, sortOrder],
    queryFn: () => getList(listId, sortOrder),
  });

  const handleRemoveBook = async (bookId: number, bookTitle: string) => {
    if (
      !confirm(
        `Remove "${bookTitle}" from your library? This will remove it from all lists.`
      )
    )
      return;

    try {
      // Get all lists to find all instances of this book
      const allLists = await getLists();
      const bookLists = await Promise.all(
        allLists.map((list) => getList(list.id).catch(() => null))
      );

      // Remove from ALL lists that contain this book
      for (const list of bookLists) {
        if (!list) continue;
        const hasBook = list.items?.find(
          (item: any) => item.book.id === bookId
        );
        if (hasBook) {
          try {
            await removeBookFromList(list.id, bookId);
          } catch {
            // Ignore errors
          }
        }
      }

      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });
      toast.success("Book removed from library");
    } catch (error) {
      console.error("Error removing book:", error);
      toast.error("Failed to remove book");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-pine-600">Loading list...</p>
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
            <h1 className="text-4xl font-bold text-pine-900 mb-2">
              {list.name}
            </h1>

            {/* Description or Add Description prompt */}
            {list.description ? (
              <p className="text-pine-600 mb-3">{list.description}</p>
            ) : (
              list.is_default === 0 && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-sm text-primary-600 hover:text-primary-800 mb-3"
                >
                  + Add description
                </button>
              )
            )}

            <div className="flex items-center gap-2 text-sm text-pine-500">
              <span>
                Created {new Date(list.created_at).toLocaleDateString()} •{" "}
                {list.items.length} {list.items.length === 1 ? "book" : "books"}
              </span>
              {list.is_default === 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    list.is_public === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-warm-100 text-pine-600"
                  }`}
                >
                  {list.is_public === 1 ? "Public" : "Private"}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Random book picker */}
            <button
              onClick={() => setIsRandomPickerOpen(true)}
              className="px-4 py-2 text-sm bg-warm-200 hover:bg-primary-200 text-primary-800  rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              ✨ Pick Random Book
            </button>

            {/* Edit/Manage list */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 text-sm bg-warm-200 hover:bg-primary-200 text-primary-800  rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              ✏️ Manage List
            </button>
          </div>
        </div>
      </div>

      {/* Sort Toggle */}
      {list && list.items.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-4 py-2 bg-warm-200 hover:bg-primary-200 text-pine-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
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
              className="bg-white border border-primary-100 rounded-lg p-3 hover:shadow-card-hover transition-all"
            >
              {/* Top Row: Heart (right aligned) */}
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
                      className="max-h-full max-w-full object-contain rounded-book book-cover-shadow"
                    />
                  </div>
                )}

                <div className="mb-2">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-pine-900">
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

                {/* Reading Progress Tracker */}
                {item.status === "reading" && item.book.page_count && (
                  <ReadingProgressTracker
                    item={item}
                    onPageUpdate={async (newPage) => {
                      try {
                        await updateBookInList(item.book_list_id, item.book.id, {
                          current_page: newPage,
                        });
                        queryClient.invalidateQueries({ queryKey: ["list"] });
                      } catch {
                        toast.error("Failed to update progress");
                      }
                    }}
                    onFinished={() => setSelectedItem(item)}
                  />
                )}

                <p className="text-pine-600 text-xs mb-2">{item.book.author}</p>

                {/* Genres - Clickable to edit */}
                {item.book.genres && item.book.genres.length > 0 ? (
                  <div
                    className="mb-2 cursor-pointer hover:opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditGenresBook({
                        id: item.book.id,
                        title: item.book.title,
                        genres: item.book.genres || [],
                      });
                    }}
                    title="Click to edit genres"
                  >
                    <GenreBadges genres={item.book.genres} maxVisible={3} />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditGenresBook({
                        id: item.book.id,
                        title: item.book.title,
                        genres: [],
                      });
                    }}
                    className="mb-2 text-xs text-primary-600 hover:text-primary-800"
                  >
                    + Add genres
                  </button>
                )}

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
                  <p className="text-pine-400 text-xs mb-2">
                    {item.book.published_year &&
                      `Published: ${item.book.published_year} • `}
                    Added: {new Date(item.added_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-warm-50 rounded-lg border border-primary-100">
          <p className="text-pine-500 mb-4">This list is empty.</p>
          <Link
            href="/search"
            className="inline-block px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all"
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
      {editGenresBook && (
        <EditGenresModal
          bookId={editGenresBook.id}
          currentGenres={editGenresBook.genres}
          bookTitle={editGenresBook.title}
          isOpen={!!editGenresBook}
          onClose={() => setEditGenresBook(null)}
        />
      )}
    </div>
  );
}
