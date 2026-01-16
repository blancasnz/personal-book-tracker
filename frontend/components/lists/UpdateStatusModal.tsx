"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookListItem, ReadingStatus } from "@/types";
import toast from "react-hot-toast";
import { moveBookStatus } from "@/lib/api";

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
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => moveBookStatus(item.book_list_id, item.book.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
      onClose();
      toast.success("Book moved to new list!");
    },
    onError: () => {
      toast.error("Failed to move book");
    },
  });

  const handleSubmit = () => {
    if (status !== item.status) {
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
              onClick={() => setStatus(option.value)}
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

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || status === item.status}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
