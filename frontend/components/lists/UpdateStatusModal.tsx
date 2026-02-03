"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  moveBookStatus,
  updateBookInList,
  getLists,
  getList,
  removeBookFromList,
} from "@/lib/api";
import { BookListItem, ReadingStatus } from "@/types";
import StarRating from "../ui/StarRating";
import toast from "react-hot-toast";

interface UpdateStatusModalProps {
  item: BookListItem;
  isOpen: boolean;
  onClose: (newStatus?: ReadingStatus, newRating?: number) => void;
}

export default function UpdateStatusModal({
  item,
  isOpen,
  onClose,
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState<ReadingStatus>(item.status);
  const [rating, setRating] = useState<number>(0);
  const [showRating, setShowRating] = useState(item.status === "finished");
  const queryClient = useQueryClient();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
  const updateMutation = useMutation({
    mutationFn: async () => {
      // First move the book to new status list
      await moveBookStatus(item.book_list_id, item.book.id, status);

      // If finished and has rating, update rating in ALL lists
      if (status === "finished" && rating > 0) {
        // Get all lists this book is in
        const allLists = await getLists();
        const bookLists = await Promise.all(
          allLists.map((list) => getList(list.id).catch(() => null))
        );

        // Update rating in all lists that contain this book
        for (const list of bookLists) {
          if (!list) continue;
          const hasBook = list.items?.find(
            (i: any) => i.book.id === item.book.id
          );
          if (hasBook) {
            await updateBookInList(list.id, item.book.id, { rating });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
      onClose(status, rating); // Pass the new status and rating back
      toast.success("Status updated!");
    },
    onError: (error) => {
      console.error("Move status error:", error);
      toast.error("Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Get all lists and remove book from everywhere
      const allLists = await getLists();
      const bookLists = await Promise.all(
        allLists.map((list) => getList(list.id).catch(() => null))
      );

      for (const list of bookLists) {
        if (!list) continue;
        const hasBook = list.items?.find(
          (i: any) => i.book.id === item.book.id
        );
        if (hasBook) {
          try {
            await removeBookFromList(list.id, hasBook.id);
          } catch {
            // Ignore errors
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });
      onClose();
      toast.success("Book removed from library");
    },
    onError: () => {
      toast.error("Failed to remove book");
    },
  });

  const handleStatusClick = (newStatus: ReadingStatus) => {
    setStatus(newStatus);
    // Show rating input if selecting "finished"
    if (newStatus === "finished") {
      setShowRating(true);
    } else {
      setShowRating(false);
      setRating(0);
    }
  };

  const handleSubmit = () => {
    if (
      status !== item.status ||
      (status === "finished" && rating !== (item.rating || 0))
    ) {
      updateMutation.mutate();
    }
  };

  if (!isOpen) return null;

  const statusOptions: {
    value: ReadingStatus;
    label: string;
    emoji: string;
    color: string;
  }[] = [
    { value: "to_read", label: "Want to Read", emoji: "📚", color: "blue" },
    {
      value: "reading",
      label: "Currently Reading",
      emoji: "📖",
      color: "green",
    },
    { value: "finished", label: "Finished", emoji: "✅", color: "purple" },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={() => onClose()}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Update Reading Status</h2>

        <div className="mb-4">
          <p className="font-semibold">{item.book.title}</p>
          <p className="text-sm text-gray-600">{item.book.author}</p>
        </div>

        <div className="space-y-3 mb-6">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusClick(option.value)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                status === option.value
                  ? `border-${option.color}-500 bg-${option.color}-50`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg mr-2">{option.emoji}</span>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Rating Section - Only show when "finished" is selected */}
        {showRating && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {rating > 0
                ? "Update your rating:"
                : "How would you rate this book?"}
            </p>
            <div className="flex justify-center">
              <StarRating rating={rating} onRate={setRating} size="lg" />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {rating === 0 && "You can skip this and rate it later"}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => onClose()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              updateMutation.isPending ||
              (status === item.status && rating === (item.rating || 0))
            }
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  `Remove "${item.book.title}" from your library? This will remove it from all lists.`
                )
              ) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:bg-gray-200 border border-red-200"
          >
            {deleteMutation.isPending ? "Removing..." : "🗑️ Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
