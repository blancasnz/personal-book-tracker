"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBook } from "@/lib/api";
import toast from "react-hot-toast";

interface EditGenresModalProps {
  bookId: number;
  currentGenres: string[];
  bookTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_GENRES = [
  "Action & Adventure",
  "Biography",
  "Business",
  "Children's",
  "Classics",
  "Contemporary",
  "Cookbooks",
  "Crime",
  "Drama",
  "Dystopian",
  "Fantasy",
  "Fiction",
  "Graphic Novel",
  "Historical Fiction",
  "History",
  "Horror",
  "Humor",
  "Memoir",
  "Mystery",
  "Non-Fiction",
  "Paranormal",
  "Philosophy",
  "Poetry",
  "Psychology",
  "Romance",
  "Science",
  "Science Fiction",
  "Self-Help",
  "Thriller",
  "Travel",
  "True Crime",
  "Young Adult",
];

export default function EditGenresModal({
  bookId,
  currentGenres,
  bookTitle,
  isOpen,
  onClose,
}: EditGenresModalProps) {
  const [genres, setGenres] = useState<string[]>(currentGenres || []);
  const [newGenre, setNewGenre] = useState("");
  const queryClient = useQueryClient();

  const updateGenresMutation = useMutation({
    mutationFn: (updatedGenres: string[]) =>
      updateBook(bookId, { genres: updatedGenres }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("Genres updated!");
      onClose();
    },
    onError: (error: any) => {
      // Show backend validation errors
      const message =
        error.response?.data?.detail?.[0]?.msg ||
        error.response?.data?.detail ||
        "Failed to update genres";
      toast.error(message);
    },
  });

  const handleAddGenre = () => {
    const trimmed = newGenre.trim();

    // Validation
    if (!trimmed) {
      toast.error("Genre cannot be empty");
      return;
    }

    if (trimmed.length > 50) {
      toast.error("Genre name too long (max 50 characters)");
      return;
    }

    // Only allow letters, numbers, spaces, hyphens, apostrophes, and ampersands
    if (!/^[a-zA-Z0-9\s\-'&]+$/.test(trimmed)) {
      toast.error(
        "Genre can only contain letters, numbers, spaces, hyphens, apostrophes, and &"
      );
      return;
    }

    if (genres.includes(trimmed)) {
      toast.error("Genre already added");
      return;
    }

    // Limit total number of genres
    if (genres.length >= 10) {
      toast.error("Maximum 10 genres allowed");
      return;
    }

    setGenres([...genres, trimmed]);
    setNewGenre("");
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setGenres(genres.filter((g) => g !== genreToRemove));
  };

  const handleSave = () => {
    updateGenresMutation.mutate(genres);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Edit Genres</h2>
            <p className="text-sm text-gray-600 mt-1">{bookTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Current Genres */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Genres
          </label>
          {genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <div
                  key={genre}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full"
                >
                  <span>{genre}</span>
                  <button
                    onClick={() => handleRemoveGenre(genre)}
                    className="text-gray-600 hover:text-gray-900 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No genres yet</p>
          )}
        </div>

        {/* Add New Genre */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Genre
          </label>

          {/* Common Genre Suggestions */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {COMMON_GENRES.filter((g) => !genres.includes(g)).map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    if (genres.length >= 10) {
                      toast.error("Maximum 10 genres allowed");
                      return;
                    }
                    setGenres([...genres, genre]);
                  }}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-purple-100 hover:text-purple-700 transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Genre Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGenre();
                }
              }}
              placeholder="Or type a custom genre..."
              maxLength={50}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={handleAddGenre}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max 50 characters. Letters, numbers, spaces, hyphens, apostrophes, &
            only. ({genres.length}/10 genres)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateGenresMutation.isPending}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
          >
            {updateGenresMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
