"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLists, addBookToList } from "@/lib/api";
import { Book, ReadingStatus } from "@/types";
import toast from "react-hot-toast";
import StarRating from "../ui/StarRating";

interface AddToListModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToListModal({
  book,
  isOpen,
  onClose,
}: AddToListModalProps) {
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number>(0);

  const queryClient = useQueryClient();

  const { data: lists, isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
    enabled: isOpen,
  });

  // Auto-detect status based on list name
  const getStatusForList = (listName: string): ReadingStatus => {
    const lowerName = listName.toLowerCase();
    if (lowerName.includes("reading") && lowerName.includes("current")) {
      return "reading";
    }
    if (lowerName.includes("finished")) {
      return "finished";
    }
    if (lowerName.includes("want") || lowerName.includes("to read")) {
      return "to_read";
    }
    return "to_read";
  };

  const addToListMutation = useMutation({
    mutationFn: () => {
      if (!selectedListId) throw new Error("No list selected");

      const selectedList = lists?.find((l) => l.id === selectedListId);
      const status = selectedList
        ? getStatusForList(selectedList.name)
        : "to_read";

      return addBookToList(selectedListId, {
        book_id: book.id,
        notes: notes.trim() || undefined,
        status: status,
        rating: rating > 0 ? rating : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
      setSelectedListId(null);
      setNotes("");
      setRating(0);
      onClose();
      toast.success("Book added to list!");
    },
    onError: (error) => {
      console.error("Error adding book to list:", error);
      toast.error("Failed to add book to list");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedListId) {
      addToListMutation.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add to List</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-semibold">{book.title}</p>
          <p className="text-sm text-gray-600">{book.author}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* List Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select List *
            </label>
            {isLoading ? (
              <p className="text-gray-500">Loading lists...</p>
            ) : lists && lists.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {lists.map((list) => (
                  <label
                    key={list.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="list"
                      value={list.id}
                      checked={selectedListId === list.id}
                      onChange={() => setSelectedListId(list.id)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">
                        {list.name}
                        {list.is_default === 1 && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Default)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {list.item_count} books
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No lists yet. Create one first!</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your thoughts about this book..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (optional)
            </label>
            <StarRating rating={rating} onRate={setRating} size="lg" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={addToListMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedListId || addToListMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {addToListMutation.isPending ? "Adding..." : "Add to List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
