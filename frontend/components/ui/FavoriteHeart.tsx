"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBookInList, addBookToList, getLists, getList } from "@/lib/api";
import toast from "react-hot-toast";

interface FavoriteHeartProps {
  listId: number;
  bookId: number;
  isFavorite: number;
}

export default function FavoriteHeart({
  listId,
  bookId,
  isFavorite,
}: FavoriteHeartProps) {
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const newFavoriteStatus = isFavorite === 1 ? 0 : 1;

      // Get all lists to find all instances of this book
      const allLists = await getLists();
      const bookLists = await Promise.all(
        allLists.map((list) => getList(list.id).catch(() => null))
      );

      // Update favorite status in ALL lists that contain this book
      for (const list of bookLists) {
        if (!list) continue;
        const hasBook = list.items?.find(
          (item: any) => item.book.id === bookId
        );
        if (hasBook) {
          await updateBookInList(list.id, bookId, {
            is_favorite: newFavoriteStatus,
          });
        }
      }

      // If favoriting, add to Favorites list
      if (newFavoriteStatus === 1) {
        const favoritesList = allLists.find(
          (list) => list.name === "Favorites" && list.is_default === 1
        );

        if (favoritesList) {
          try {
            const currentListData = await getList(listId);
            const currentItem = currentListData.items?.find(
              (item: any) => item.book.id === bookId
            );
            const status = currentItem?.status || "to_read";
            const rating = currentItem?.rating || undefined;

            await addBookToList(favoritesList.id, {
              book_id: bookId,
              status: status,
              is_favorite: 1,
              rating: rating,
            });
          } catch (error: any) {
            // Ignore if already in favorites
            if (!error.response?.data?.detail?.includes("already")) {
              throw error;
            }
          }
        }
      }

      // If unfavoriting, remove from Favorites list
      if (newFavoriteStatus === 0) {
        const favoritesList = allLists.find(
          (list) => list.name === "Favorites" && list.is_default === 1
        );

        if (favoritesList) {
          try {
            const { removeBookFromList } = await import("@/lib/api");
            const favListData = bookLists.find(
              (l) => l && l.id === favoritesList.id
            );
            const favItem = favListData?.items?.find(
              (item: any) => item.book.id === bookId
            );
            if (favItem) {
              await removeBookFromList(favoritesList.id, favItem.id);
            }
          } catch {
            // Ignore if not in favorites list
          }
        }
      }
    },
    onSuccess: async () => {
      // Invalidate all list queries to refresh everywhere
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });

      toast.success(
        isFavorite === 1 ? "Removed from favorites" : "Added to favorites!"
      );
    },
    onError: () => {
      toast.error("Failed to update favorite");
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavoriteMutation.mutate();
      }}
      disabled={toggleFavoriteMutation.isPending}
      className="text-2xl hover:scale-110 transition-transform disabled:opacity-50"
      title={isFavorite === 1 ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite === 1 ? "❤️" : "🤍"}
    </button>
  );
}
