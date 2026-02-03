"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLists,
  addBookToList,
  addExternalBookToDb,
  removeBookFromList,
  createList,
} from "@/lib/api";
import { Book, BookCreate, ReadingStatus } from "@/types";
import toast from "react-hot-toast";

interface ExistingListEntry {
  id: number;
  name: string;
  item_id: number;
}

interface AddToListModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  existingLists?: ExistingListEntry[];
}

export default function AddToListModal({
  book,
  isOpen,
  onClose,
  existingLists = [],
}: AddToListModalProps) {
  const [selectedListIds, setSelectedListIds] = useState<Set<number>>(
    new Set()
  );
  const [notes, setNotes] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");

  const queryClient = useQueryClient();

  const isManageMode = existingLists.length > 0;
  const initialListIds = new Set(existingLists.map((l) => l.id));

  // Pre-select existing lists when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedListIds(new Set(existingLists.map((l) => l.id)));
    }
  }, [isOpen, existingLists]);

  const { data: lists, isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
    enabled: isOpen,
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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

  const toggleList = (listId: number) => {
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  };

  const createListMutation = useMutation({
    mutationFn: () =>
      createList({
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
      }),
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      // Auto-select the newly created list
      setSelectedListIds((prev) => new Set(prev).add(newList.id));
      setNewListName("");
      setNewListDescription("");
      setShowCreateForm(false);
      toast.success(`List "${newList.name}" created!`);
    },
    onError: () => {
      toast.error("Failed to create list");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Add book to database if it doesn't have an ID
      let bookId = book.id;
      if (!bookId) {
        const addedBook = await addExternalBookToDb(book as BookCreate);
        bookId = addedBook.id;
      }

      const promises: Promise<any>[] = [];

      // Step 2: Add book to newly selected lists
      const listsToAdd = Array.from(selectedListIds).filter(
        (id) => !initialListIds.has(id)
      );
      for (const listId of listsToAdd) {
        const list = lists?.find((l) => l.id === listId);
        const status = list ? getStatusForList(list.name) : "to_read";
        promises.push(
          addBookToList(listId, {
            book_id: bookId,
            notes: notes.trim() || undefined,
            status,
          })
        );
      }

      // Step 3: Remove book from deselected lists
      const listsToRemove = existingLists.filter(
        (l) => !selectedListIds.has(l.id)
      );
      for (const entry of listsToRemove) {
        promises.push(removeBookFromList(entry.id, entry.item_id));
      }

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });

      const added = Array.from(selectedListIds).filter(
        (id) => !initialListIds.has(id)
      ).length;
      const removed = existingLists.filter(
        (l) => !selectedListIds.has(l.id)
      ).length;

      setSelectedListIds(new Set());
      setNotes("");
      onClose();

      if (added > 0 && removed > 0) {
        toast.success("Lists updated!");
      } else if (added > 0) {
        toast.success(
          added === 1 ? "Book added to list!" : `Book added to ${added} lists!`
        );
      } else if (removed > 0) {
        toast.success(
          removed === 1
            ? "Book removed from list"
            : `Book removed from ${removed} lists`
        );
      } else {
        onClose();
      }
    },
    onError: (error) => {
      console.error("Error updating lists:", error);
      toast.error("Failed to update lists");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In manage mode, allow saving even with 0 selected (removing from all)
    // In add mode, require at least one selection
    if (!isManageMode && selectedListIds.size === 0) return;
    saveMutation.mutate();
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createListMutation.mutate();
    }
  };

  // Check if anything actually changed from the initial state
  const hasChanges = (() => {
    if (selectedListIds.size !== initialListIds.size) return true;
    for (const id of selectedListIds) {
      if (!initialListIds.has(id)) return true;
    }
    return false;
  })();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-primary-100 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-pine-900 mb-4">
          {isManageMode ? "Manage Lists" : "Add to List"}
        </h2>

        <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
          <p className="font-semibold text-pine-900">{book.title}</p>
          <p className="text-sm text-pine-600">{book.author}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* List Selection */}
          <div>
            <label className="block text-sm font-medium text-pine-700 mb-2">
              {isManageMode ? "Lists" : "Select Lists"}
            </label>
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center gap-3 p-2"
                  >
                    <div className="w-5 h-5 bg-primary-100 rounded" />
                    <div className="flex-1">
                      <div className="bg-primary-100 rounded h-4 w-2/3 mb-1" />
                      <div className="bg-primary-100 rounded h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lists && lists.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto border border-primary-200 rounded-lg p-2">
                {lists.map((list) => {
                  const isSelected = selectedListIds.has(list.id);
                  return (
                    <label
                      key={list.id}
                      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-primary-50" : "hover:bg-primary-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleList(list.id)}
                        className="mr-3 w-4 h-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-pine-900 text-sm">
                          {list.name}
                          {list.is_default === 1 && (
                            <span className="ml-2 text-xs text-pine-400">
                              (Default)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-pine-500">
                          {list.item_count} book
                          {list.item_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-pine-500 text-sm border border-primary-200 rounded-lg">
                <p>No lists yet. Create one below!</p>
              </div>
            )}
          </div>

          {/* Create New List */}
          <div>
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="w-full px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-dashed border-primary-300 flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                Create New List
              </button>
            ) : (
              <div className="border border-primary-200 rounded-lg p-3 space-y-3 bg-primary-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-pine-700">
                    New List
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewListName("");
                      setNewListDescription("");
                    }}
                    className="text-pine-400 hover:text-pine-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name"
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                  maxLength={100}
                />
                <input
                  type="text"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={handleCreateList}
                  disabled={
                    !newListName.trim() || createListMutation.isPending
                  }
                  className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition-all bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createListMutation.isPending ? "Creating..." : "Create List"}
                </button>
              </div>
            )}
          </div>

          {/* Notes - only show for new additions */}
          {!isManageMode && (
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-pine-700 mb-1"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your thoughts about this book..."
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-primary-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-pine-600 hover:text-pine-800 transition-colors"
              disabled={saveMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                (!isManageMode && selectedListIds.size === 0) ||
                (isManageMode && !hasChanges) ||
                saveMutation.isPending
              }
              className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600"
            >
              {saveMutation.isPending
                ? "Saving..."
                : isManageMode
                ? "Save Changes"
                : selectedListIds.size > 1
                ? `Add to ${selectedListIds.size} Lists`
                : "Add to List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
