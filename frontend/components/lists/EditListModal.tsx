"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateList, removeBookFromList, getLists, getList } from "@/lib/api";
import { BookList } from "@/types";
import toast from "react-hot-toast";

interface EditListModalProps {
  list: BookList;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditListModal({
  list,
  isOpen,
  onClose,
}: EditListModalProps) {
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [isPublic, setIsPublic] = useState(list.is_public === 1);
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());

  const canEditDetails = list.is_default === 0;
  const [activeTab, setActiveTab] = useState<"edit" | "delete">(
    canEditDetails ? "edit" : "delete"
  );
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      updateList(list.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic ? 1 : 0,
      }),
      
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list", list.id] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("List updated!");
      onClose();
    },
    onError: () => {
      toast.error("Failed to update list");
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: async () => {
      // Get all lists to delete from all instances
      const allLists = await getLists();
      const bookLists = await Promise.all(
        allLists.map((list) => getList(list.id).catch(() => null))
      );

      // Delete each selected book from all lists
      for (const bookId of selectedBooks) {
        for (const list of bookLists) {
          if (!list) continue;
          const hasBook = list.items?.find(
            (item: any) => item.book.id === bookId
          );
          if (hasBook) {
            try {
              await removeBookFromList(list.id, hasBook.id);
            } catch {
              // Ignore errors
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list"] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["book-check"] });
      toast.success(`${selectedBooks.size} book(s) removed from library`);
      setSelectedBooks(new Set());
      onClose();
    },
    onError: () => {
      toast.error("Failed to remove books");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("List name is required");
      return;
    }
    updateMutation.mutate();
  };

  const handleBulkDelete = () => {
    if (selectedBooks.size === 0) {
      toast.error("No books selected");
      return;
    }

    if (
      !confirm(
        `Remove ${selectedBooks.size} book(s) from your library? This will remove them from all lists.`
      )
    ) {
      return;
    }

    deleteBulkMutation.mutate();
  };

  const toggleBookSelection = (bookId: number) => {
    const newSelection = new Set(selectedBooks);
    if (newSelection.has(bookId)) {
      newSelection.delete(bookId);
    } else {
      newSelection.add(bookId);
    }
    setSelectedBooks(newSelection);
  };

  const selectAll = () => {
    const allBookIds = new Set(list.items.map((item) => item.book.id));
    setSelectedBooks(allBookIds);
  };

  const deselectAll = () => {
    setSelectedBooks(new Set());
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
            <h2 className="text-2xl font-bold">
              {canEditDetails ? "Edit List" : "Manage Books"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {canEditDetails && (
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "edit"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Edit Details
              </button>
            )}
            <button
              onClick={() => setActiveTab("delete")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "delete"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Delete Books ({selectedBooks.size})
            </button>
          </div>

          {/* Edit Details Tab */}
          {activeTab === "edit" && canEditDetails && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a description for this list..."
                />
              </div>

              {/* Visibility Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      !isPublic
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isPublic
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Public
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* Delete Books Tab */}
          {activeTab === "delete" && (
            <div>
              {/* Selection Controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Deselect All
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {selectedBooks.size} of {list.items.length} selected
                </span>
              </div>

              {/* Book List */}
              {list.items.length > 0 ? (
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                  {list.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleBookSelection(item.book.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedBooks.has(item.book.id)
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedBooks.has(item.book.id)}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 rounded"
                      />

                      {/* Cover */}
                      {item.book.cover_url && (
                        <img
                          src={item.book.cover_url}
                          alt={item.book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {item.book.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {item.book.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No books in this list
                </div>
              )}

              {/* Delete Button */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={
                    selectedBooks.size === 0 || deleteBulkMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleteBulkMutation.isPending
                    ? "Removing..."
                    : `Remove ${selectedBooks.size || ""} Book${
                        selectedBooks.size === 1 ? "" : "s"
                      }`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
