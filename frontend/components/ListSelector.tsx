"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLists, addBookToList, removeBookFromList } from "@/lib/api";
import { Book, ReadingStatus } from "@/types";
import toast from "react-hot-toast";

interface ListSelectorProps {
  book: Book;
  existingLists: Array<{ id: number; name: string; item_id: number }>;
  onUpdate?: () => void;
}

export default function ListSelector({
  book,
  existingLists,
  onUpdate,
}: ListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: allLists, isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
    enabled: isOpen,
  });

  const addToListMutation = useMutation({
    mutationFn: ({
      listId,
      status,
    }: {
      listId: number;
      status: ReadingStatus;
    }) =>
      addBookToList(listId, {
        book_id: book.id,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });
      toast.success("Added to list!");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to add to list");
    },
  });

  const removeFromListMutation = useMutation({
    mutationFn: ({ listId, itemId }: { listId: number; itemId: number }) =>
      removeBookFromList(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });
      toast.success("Removed from list!");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to remove from list");
    },
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

  const handleToggleList = (list: any) => {
    // Check if book is in this list
    const existingItem = existingLists.find((l) => l.id === list.id);

    if (existingItem) {
      // Remove from list
      removeFromListMutation.mutate({
        listId: list.id,
        itemId: existingItem.item_id,
      });
    } else {
      // Add to list
      const status = getStatusForList(list.name);
      addToListMutation.mutate({
        listId: list.id,
        status,
      });
    }
  };

  const existingListIds = existingLists.map((l) => l.id);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-primary-50 text-pine-800 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-between border border-primary-200"
      >
        <span>
          📚 In {existingLists.length} list
          {existingLists.length !== 1 ? "s" : ""}
        </span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-primary-200 rounded-lg shadow-card max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-pine-600 text-sm">
              Loading lists...
            </div>
          )}

          {!isLoading && allLists && allLists.length === 0 && (
            <div className="p-4 text-center text-pine-500 text-sm">
              No lists yet. Create one first!
            </div>
          )}

          {!isLoading &&
            allLists &&
            allLists.map((list: any) => {
              const isInList = existingListIds.includes(list.id);
              const isPending =
                addToListMutation.isPending || removeFromListMutation.isPending;

              return (
                <button
                  key={list.id}
                  onClick={() => handleToggleList(list)}
                  disabled={isPending}
                  className={`w-full text-left px-4 py-3 transition-all border-b border-primary-100 last:border-b-0 ${
                    isInList
                      ? "bg-primary-100 hover:bg-primary-150"
                      : "hover:bg-primary-50"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg ${
                            isInList ? "opacity-100" : "opacity-30"
                          }`}
                        >
                          {isInList ? "✓" : "○"}
                        </span>
                        <span className="font-medium text-pine-900 text-sm">
                          {list.name}
                        </span>
                      </div>
                      <p className="text-xs text-pine-500 ml-7">
                        {list.item_count} books
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
