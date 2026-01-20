"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moveBookStatus, updateBookInList, getLists } from "@/lib/api";
import { BookListItem, ReadingStatus } from "@/types";
import StarRating from "../ui/StarRating";
import toast from "react-hot-toast";

interface UpdateStatusModalProps {
  item: BookListItem;
  isOpen: boolean;
  onClose: () => void;
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Move the book to new status list
      await moveBookStatus(item.book_list_id, item.book.id, status);

      // If finished and has rating, update rating separately
      if (status === "finished" && rating > 0) {
        // The moveBookStatus already moved it, now we just need to update the rating
        // We need to find which list it's in now (the Finished list)
        const allLists = await getLists();
        const finishedList = allLists.find(
          (list: any) => list.name === "Finished" && list.is_default === 1
        );

        if (finishedList) {
          await updateBookInList(finishedList.id, item.book.id, { rating });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
      onClose();
      toast.success("Status updated!");
    },
    onError: (error) => {
      console.error("Move status error:", error);
      toast.error("Failed to update status");
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
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

        <div className="flex gap-3">
          <button
            onClick={onClose}
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
        </div>
      </div>
    </div>
  );
}
