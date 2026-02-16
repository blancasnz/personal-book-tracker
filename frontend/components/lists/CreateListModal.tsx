"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createList } from "@/lib/api";
import { BookListCreate } from "@/types";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateListModal({
  isOpen,
  onClose,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: (newList: BookListCreate) => createList(newList),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setName("");
      setDescription("");
      setIsPublic(false);
      onClose();
    },
    onError: (error) => {
      console.error("Error creating list:", error);
      alert("Failed to create list");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic ? 1 : 0,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Create New List</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              List Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Reading"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? "Creating..." : "Create List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
