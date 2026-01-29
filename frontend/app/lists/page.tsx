"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLists, getList, deleteList } from "@/lib/api";
import CreateListModal from "@/components/lists/CreateListModal";
import ListDetail from "@/components/lists/ListDetail";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ListsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (listId: number) => deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("List deleted");
      // Reset selected list if it was deleted
      setSelectedListId(null);
    },
    onError: (error) => {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    },
  });

  const handleDelete = (
    listId: number,
    listName: string,
    isDefault: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (isDefault === 1) {
      toast.error("Cannot delete default lists");
      return;
    }
    if (confirm(`Are you sure you want to delete "${listName}"?`)) {
      deleteMutation.mutate(listId);
    }
  };

  const {
    data: lists,
    isLoading: listsLoading,
    error: listsError,
  } = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
  });

  // Get the Want to Read list by default (or Currently Reading, or first list)
  const wantToReadList = lists?.find(
    (list) => list.name.toLowerCase() === "want to read"
  );
  const currentlyReadingList = lists?.find(
    (list) => list.name.toLowerCase() === "currently reading"
  );
  const defaultListId =
    selectedListId ||
    wantToReadList?.id ||
    currentlyReadingList?.id ||
    lists?.[0]?.id;

  return (
    <main className="min-h-screen gradient-soft">
      {/* Header */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Empty spacer for balance - Left */}
            <div className="w-40"></div>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                Curations
              </h1>
            </div>

            {/* Explore books button - Far Right (green) */}
            <Link
              href="/search"
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 rounded-lg transition-all text-sm font-semibold shadow-sm"
            >
              Explore Books
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100 sticky top-8">
              <h2 className="text-lg font-semibold text-pine-900 mb-4">
                My Lists
              </h2>

              {/* Lists Navigation */}
              {listsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-warm-100 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              )}

              {listsError && (
                <div className="text-sm text-red-600">Error loading lists</div>
              )}

              {lists && lists.length > 0 && (
                <>
                  <nav className="space-y-1 mb-4">
                    {/* Default Lists in Specific Order - Favorites first */}
                    {[
                      "Favorites",
                      "Want to Read",
                      "Finished",
                      "Currently Reading",
                    ]
                      .map((listName) =>
                        lists.find(
                          (list) =>
                            list.is_default === 1 && list.name === listName
                        )
                      )
                      .filter(Boolean)
                      .map((list) => (
                        <div key={list!.id} className="relative group">
                          <button
                            onClick={() => setSelectedListId(list!.id)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm ${
                              (selectedListId || defaultListId) === list!.id
                                ? "bg-primary-100 text-primary-800 font-medium"
                                : "text-pine-700 hover:bg-primary-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{list!.name}</span>
                              <span className="text-xs text-pine-500">
                                {list!.item_count || 0}
                              </span>
                            </div>
                          </button>
                        </div>
                      ))}
                  </nav>

                  {/* Divider and label for user lists */}
                  {lists.some((list) => list.is_default === 0) && (
                    <>
                      <div className="my-4 border-t border-primary-200" />
                      <p className="text-xs font-medium text-pine-500 uppercase tracking-wide mb-3 px-2">
                        My Lists
                      </p>
                      <nav className="space-y-1 mb-4">
                        {/* User Created Lists */}
                        {lists
                          .filter((list) => list.is_default === 0)
                          .map((list) => (
                            <div key={list.id} className="relative group">
                              <div
                                onClick={() => setSelectedListId(list.id)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm ${
                                  (selectedListId || defaultListId) === list.id
                                    ? "bg-primary-100 text-primary-800 font-medium"
                                    : "text-pine-700 hover:bg-primary-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{list.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-pine-500">
                                      {list.item_count || 0}
                                    </span>
                                    <button
                                      onClick={(e) =>
                                        handleDelete(
                                          list.id,
                                          list.name,
                                          list.is_default,
                                          e
                                        )
                                      }
                                      disabled={deleteMutation.isPending}
                                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity text-xs"
                                      title="Delete list"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </nav>
                    </>
                  )}

                  {/* Create List Button - At Bottom with proper spacing */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                  >
                    + Create List
                  </button>
                </>
              )}

              {lists && lists.length === 0 && (
                <>
                  <p className="text-sm text-pine-500 text-center py-4 mb-4">
                    No lists yet
                  </p>
                  {/* Create List Button - For empty state */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                  >
                    + Create List
                  </button>
                </>
              )}
            </div>
          </aside>

          {/* Main Content - Use ListDetail Component */}
          <div className="flex-1">
            {defaultListId ? (
              <ListDetail listId={defaultListId} />
            ) : (
              /* No lists state */
              <div className="bg-white rounded-xl shadow-card p-12 text-center border border-primary-100">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-xl text-pine-500 mb-6">
                  You haven't created any lists yet.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl hover:from-primary-700 hover:to-secondary-600 transition-all shadow-md hover:shadow-lg text-lg font-medium"
                >
                  Create Your First List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
}
