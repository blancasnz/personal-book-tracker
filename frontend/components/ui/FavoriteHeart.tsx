"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBookInList } from "@/lib/api";
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
    mutationFn: () =>
      updateBookInList(listId, bookId, {
        is_favorite: isFavorite === 1 ? 0 : 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list", listId] });
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
        e.stopPropagation(); // Prevent triggering parent click handlers
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
