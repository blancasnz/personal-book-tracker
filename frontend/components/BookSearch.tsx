"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchExternalBooks } from "@/lib/api";
import { BookCardSkeleton } from "./ui/Skeleton";
import BookCard from "./BookCard";
import NYTBookRow from "./NYTBookRow";
import CuratedBookRow from "./CuratedBookRow";
import ExploreTabs, { TABS } from "./ui/ExploreTabs";
import { TAB_CONFIG } from "@/data/exploreTabConfig";
import { CURATED_LISTS } from "@/data/lists";
import { useSearchParams, useRouter } from "next/navigation";

export default function BookSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("awards");

  useEffect(() => {
    const q = searchParams.get("q");
    const tab = searchParams.get("tab");

    if (q) {
      setSearchQuery(q);
      setDebouncedQuery(q);
    } else {
      setSearchQuery("");
      setDebouncedQuery("");
    }

    // Restore tab from URL if valid
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchExternalBooks(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      setDebouncedQuery(query);
      // Update URL so back navigation works
      router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    // Preserve tab when clearing search
    router.push(`/search?tab=${activeTab}`, { scroll: false });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL with tab parameter
    router.push(`/search?tab=${tab}`, { scroll: false });
  };

  // Show curated sections when no search is active
  const showCurated = !debouncedQuery;

  // Get current tab's list configurations
  const currentTabLists = TAB_CONFIG[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books..."
          className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-pine-900"
        />
        {debouncedQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 bg-warm-200 text-pine-800 hover:bg-warm-300 rounded-lg transition-colors font-medium"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          disabled={!searchQuery.trim() || isLoading}
          className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 disabled:bg-warm-300 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Curated Sections - Show when no search */}
      {showCurated && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <ExploreTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content */}
          <div className="space-y-8">
            {currentTabLists.map((listConfig) => {
              const books = CURATED_LISTS[listConfig.listType] || [];

              return (
                <div
                  key={listConfig.listType}
                  className="bg-white rounded-xl shadow-card p-6 border border-primary-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                      <span>{listConfig.icon || "📚"}</span> {listConfig.title}
                    </h3>
                    {listConfig.badge && (
                      <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                        {listConfig.badge}
                      </span>
                    )}
                  </div>
                  <CuratedBookRow
                    listType={listConfig.listType}
                    title={listConfig.title}
                    badgeLabel={listConfig.badge}
                    showYear={listConfig.showYear}
                    books={books}
                    totalCount={books.length}
                    maxBooks={10}
                  />
                </div>
              );
            })}
          </div>

          {/* NYT Bestsellers Section - Always show at bottom */}
          <div className="mt-8 pt-6 border-t border-warm-200">
            <h2 className="text-2xl font-bold text-pine-800 mb-6 flex items-center gap-2">
              <span>📰</span> NYT Bestsellers
            </h2>
            <div className="space-y-8">
              {/* Hardcover Fiction */}
              <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                    <span>📕</span> Hardcover Fiction
                  </h3>
                  <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                    NYT
                  </span>
                </div>
                <NYTBookRow listName="hardcover-fiction" />
              </div>

              {/* Paperback Fiction */}
              <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                    <span>📖</span> Paperback Fiction
                  </h3>
                  <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                    NYT
                  </span>
                </div>
                <NYTBookRow listName="trade-fiction-paperback" />
              </div>

              {/* Hardcover Nonfiction */}
              <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                    <span>📗</span> Hardcover Nonfiction
                  </h3>
                  <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                    NYT
                  </span>
                </div>
                <NYTBookRow listName="hardcover-nonfiction" />
              </div>

              {/* Paperback Nonfiction */}
              <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                    <span>📘</span> Paperback Nonfiction
                  </h3>
                  <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                    NYT
                  </span>
                </div>
                <NYTBookRow listName="paperback-nonfiction" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          Error searching for books. Please try again.
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {searchResults && searchResults.results && !isLoading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-pine-600">
              Found {searchResults.count} results for "{searchResults.query}"
            </p>
            <button
              onClick={handleClearSearch}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              ← Back to Discover
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.results.map((book: any, index: number) => (
              <BookCard
                key={index}
                book={book}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {debouncedQuery && searchResults && searchResults.count === 0 && (
        <div className="text-center py-12 text-pine-500">
          No books found for "{debouncedQuery}". Try a different search term.
        </div>
      )}

    </div>
  );
}
