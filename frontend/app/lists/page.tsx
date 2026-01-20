"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLists } from "@/lib/api";
import ListCard from "@/components/lists/ListCard";
import CreateListModal from "@/components/lists/CreateListModal";
import { ListCardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

export default function ListsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: lists,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                My Lists
              </h1>
              <p className="text-gray-600">
                Organize your books into collections
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
              >
                ← Home
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                + Create List
              </button>
            </div>
          </div>

          {/* Loading State with Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <ListCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
              Error loading lists. Please try again.
            </div>
          )}

          {/* Lists Grid */}
          {lists && lists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {lists && lists.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl text-gray-500 mb-6">
                You haven't created any lists yet.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-lg font-medium"
              >
                Create Your First List
              </button>
            </div>
          )}

          <CreateListModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </div>
    </main>
  );
}
