"use client";

import Link from "next/link";
import { BookListSummary } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteList } from "@/lib/api";
import toast from "react-hot-toast";

interface ListCardProps {
  list: BookListSummary;
}

export default function ListCard({ list }: ListCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteList(list.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("List deleted");
    },
    onError: (error) => {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${list.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <Link
      href={`/lists/${list.id}`}
      className="block group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
            {list.name}
          </h3>
          {list.is_default === 1 && (
            <span className="inline-block mt-1 text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Default List
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {list.is_default === 0 && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-500 hover:text-red-700 text-sm font-medium disabled:text-gray-400 transition-colors"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      {list.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">{list.description}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-semibold text-gray-900">
            {list.item_count} {list.item_count === 1 ? "book" : "books"}
          </span>
        </div>
        <span className="text-gray-500">
          {new Date(list.created_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
