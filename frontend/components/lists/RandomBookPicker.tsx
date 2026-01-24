"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRandomBook, getList } from "@/lib/api";
import { BookListItem } from "@/types";
import StatusBadge from "../ui/StatusBadge";
import toast from "react-hot-toast";
import AddToListModal from "./AddToListModal";
import GenreBadges from "../ui/GenreBadges";

interface RandomBookPickerProps {
  listId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function RandomBookPicker({
  listId,
  isOpen,
  onClose,
}: RandomBookPickerProps) {
  const [maxPages, setMaxPages] = useState<number>(0);
  const [minPages, setMinPages] = useState<number>(0);
  const [pickedBook, setPickedBook] = useState<BookListItem | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  const { data: list } = useQuery({
    queryKey: ["list", listId],
    queryFn: () => getList(listId),
    enabled: isOpen, // Only fetch when modal is open
  });

  useEffect(() => {
    if (list?.items) {
      // Extract all unique genres from all books in the list
      const allGenres = list.items
        .flatMap((item) => item.book.genres || [])
        .filter(Boolean);
      const uniqueGenres = Array.from(new Set(allGenres)).sort();
      setAvailableGenres(uniqueGenres);
    }
  }, [list]);

  const pickBookMutation = useMutation({
    mutationFn: () => {
      const filters: any = {};
      if (maxPages > 0) filters.max_pages = maxPages;
      if (minPages > 0) filters.min_pages = minPages;
      if (selectedGenre) filters.genre = selectedGenre;

      return getRandomBook(listId, filters);
    },
    onSuccess: (data) => {
      setIsRevealing(true);
      setTimeout(() => {
        setPickedBook(data);
        setIsRevealing(false);
      }, 800);
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        toast.error("No books match your filters!");
      } else {
        toast.error("Failed to pick a book");
      }
    },
  });

  const handlePickAnother = () => {
    setPickedBook(null);
    pickBookMutation.mutate();
  };

  const handleReset = () => {
    setPickedBook(null);
    setMaxPages(0);
    setMinPages(0);
    setSelectedGenre("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold">🎲 Pick a Book for Me</h2>
              <p className="text-gray-600">Let fate decide your next read!</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              ×
            </button>
          </div>

          {!pickedBook ? (
            <>
              {/* Filters */}
              <div className="space-y-4 mb-6">
                {/* Genre Filter */}
                {availableGenres.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Genre (optional)
                    </label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any Genre</option>
                      {availableGenres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/*Page Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Pages (optional)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={minPages || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setMinPages(parseInt(value) || 0);
                      }}
                      placeholder="e.g., 100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Pages (optional)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={maxPages || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setMaxPages(parseInt(value) || 0);
                      }}
                      placeholder="e.g., 400"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pick Button */}
              <button
                onClick={() => pickBookMutation.mutate()}
                disabled={pickBookMutation.isPending || isRevealing}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {pickBookMutation.isPending || isRevealing
                  ? "🎲 Picking..."
                  : "🎲 Pick My Book!"}
              </button>
            </>
          ) : (
            <>
              {/* Picked Book Display */}
              <div className="text-center mb-6">
                <p className="text-xl text-gray-600 mb-4">
                  Your next read is...
                </p>

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                  {pickedBook.book.cover_url && (
                    <img
                      src={pickedBook.book.cover_url}
                      alt={pickedBook.book.title}
                      className="w-48 h-72 object-contain mx-auto mb-4 shadow-lg rounded"
                    />
                  )}

                  <h3 className="text-2xl font-bold mb-2">
                    {pickedBook.book.title}
                  </h3>
                  <p className="text-lg text-gray-700 mb-3">
                    {pickedBook.book.author}
                  </p>

                  {pickedBook.book.genres &&
                    pickedBook.book.genres.length > 0 && (
                      <div className="mb-3">
                        <GenreBadges
                          genres={pickedBook.book.genres}
                          maxVisible={5}
                        />
                      </div>
                    )}

                  <div className="flex justify-center gap-3 mb-3">
                    <StatusBadge status={pickedBook.status} />
                    {pickedBook.book.page_count && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        📖 {pickedBook.book.page_count} pages
                      </span>
                    )}
                  </div>

                  {pickedBook.book.description && (
                    <p className="text-sm text-gray-600 mt-4 line-clamp-4">
                      {pickedBook.book.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Change Filters
                </button>
                <button
                  onClick={handlePickAnother}
                  disabled={pickBookMutation.isPending}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  🎲 Pick Another
                </button>
              </div>
              <button
                onClick={() => setShowAddToList(true)}
                className="w-full mt-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ➕ Add to List
              </button>
            </>
          )}
        </div>
      </div>
      {pickedBook && showAddToList && (
        <AddToListModal
          book={pickedBook.book}
          isOpen={showAddToList}
          onClose={() => setShowAddToList(false)}
        />
      )}
    </div>
  );
}
