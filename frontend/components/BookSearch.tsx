"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchExternalBooks, searchPublicLists, getPublicLists } from "@/lib/api";
import { BookCardSkeleton } from "./ui/Skeleton";
import BookCard from "./BookCard";
import NYTBookRow from "./NYTBookRow";
import CuratedBookRow from "./CuratedBookRow";
import ExploreTabs, { TABS } from "./ui/ExploreTabs";
import { TAB_CONFIG, ListConfig } from "@/data/exploreTabConfig";
import { CURATED_LISTS, CuratedBook } from "@/data/lists";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicListSearchResult, BookList } from "@/types";

type SearchMode = "books" | "lists";

export default function BookSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("awards");
  const [searchMode, setSearchMode] = useState<SearchMode>("books");

  useEffect(() => {
    const q = searchParams.get("q");
    const tab = searchParams.get("tab");
    const mode = searchParams.get("mode") as SearchMode | null;

    if (q) {
      setSearchQuery(q);
      setDebouncedQuery(q);
    } else {
      setSearchQuery("");
      setDebouncedQuery("");
    }

    if (mode === "books" || mode === "lists") {
      setSearchMode(mode);
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
    enabled: searchMode === "books" && debouncedQuery.length > 0,
  });

  const {
    data: listSearchResults,
    isLoading: listSearchLoading,
    error: listSearchError,
  } = useQuery({
    queryKey: ["searchLists", debouncedQuery],
    queryFn: () => searchPublicLists(debouncedQuery),
    enabled: searchMode === "lists" && debouncedQuery.length > 0,
  });

  const {
    data: publicLists,
    isLoading: publicListsLoading,
  } = useQuery({
    queryKey: ["publicLists"],
    queryFn: getPublicLists,
    enabled: searchMode === "lists" && !debouncedQuery,
  });

  const updateUrl = (params: { q?: string; tab?: string; mode?: string }) => {
    const urlParams = new URLSearchParams();
    if (params.q) urlParams.set("q", params.q);
    if (params.tab) urlParams.set("tab", params.tab);
    if (params.mode) urlParams.set("mode", params.mode);
    router.push(`/search?${urlParams.toString()}`, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      setDebouncedQuery(query);
      updateUrl({ q: query, mode: searchMode });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    updateUrl({ tab: activeTab, mode: searchMode });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateUrl({ tab, mode: searchMode });
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    if (debouncedQuery) {
      updateUrl({ q: debouncedQuery, mode });
    } else {
      updateUrl({ tab: activeTab, mode });
    }
  };

  const isCurrentlyLoading = searchMode === "books" ? isLoading : listSearchLoading;
  const currentError = searchMode === "books" ? error : listSearchError;

  // Show curated sections when no search is active AND in lists mode
  const showCurated = !debouncedQuery && searchMode === "lists";

  // Show NYT bestsellers when no search is active AND in books mode
  const showNYT = !debouncedQuery && searchMode === "books";

  // Get current tab's list configurations
  const currentTabLists = TAB_CONFIG[activeTab] || [];

  // Flat lookup: listType -> ListConfig (for curated list search)
  const allListConfigs = useMemo(() => {
    const map: Record<string, ListConfig> = {};
    for (const configs of Object.values(TAB_CONFIG)) {
      for (const config of configs) {
        map[config.listType] = config;
      }
    }
    return map;
  }, []);

  // Search curated lists client-side when in lists mode with a query
  const curatedListMatches = useMemo(() => {
    if (searchMode !== "lists" || !debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    const matches: { config: ListConfig; allBooks: CuratedBook[] }[] = [];

    for (const [listType, books] of Object.entries(CURATED_LISTS)) {
      const hasMatch = books.some(
        (book: CuratedBook) =>
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q)
      );
      if (hasMatch && allListConfigs[listType]) {
        matches.push({ config: allListConfigs[listType], allBooks: books });
      }
    }
    return matches;
  }, [searchMode, debouncedQuery, allListConfigs]);

  return (
    <div className="space-y-6">
      {/* Search Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-warm-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange("books")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              searchMode === "books"
                ? "bg-white text-pine-900 shadow-sm"
                : "text-pine-600 hover:text-pine-800"
            }`}
          >
            Books
          </button>
          <button
            onClick={() => handleModeChange("lists")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              searchMode === "lists"
                ? "bg-white text-pine-900 shadow-sm"
                : "text-pine-600 hover:text-pine-800"
            }`}
          >
            Lists
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            searchMode === "books"
              ? "Search for books..."
              : "Search public lists by book title or author..."
          }
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
          disabled={!searchQuery.trim() || isCurrentlyLoading}
          className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 disabled:bg-warm-300 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
        >
          {isCurrentlyLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Books mode idle - NYT Bestsellers only */}
      {showNYT && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-pine-800 flex items-center gap-2">
            NYT Bestsellers
          </h2>

          <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                Hardcover Fiction
              </h3>
              <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                NYT
              </span>
            </div>
            <NYTBookRow listName="hardcover-fiction" />
          </div>

          <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                Paperback Fiction
              </h3>
              <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                NYT
              </span>
            </div>
            <NYTBookRow listName="trade-fiction-paperback" />
          </div>

          <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                Hardcover Nonfiction
              </h3>
              <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                NYT
              </span>
            </div>
            <NYTBookRow listName="hardcover-nonfiction" />
          </div>

          <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                Paperback Nonfiction
              </h3>
              <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                NYT
              </span>
            </div>
            <NYTBookRow listName="paperback-nonfiction" />
          </div>
        </div>
      )}

      {/* Lists mode idle - Curated tabs + Public Lists */}
      {showCurated && (
        <div className="space-y-6">
          {/* Curated Tab Navigation */}
          <ExploreTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Curated Tab Content */}
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
                      <span>{listConfig.icon || ""}</span> {listConfig.title}
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

          {/* Public Lists Section */}
          <div className="mt-8 pt-6 border-t border-warm-200">
            <h2 className="text-2xl font-bold text-pine-800 mb-6">
              Public Lists
            </h2>

            {publicListsLoading && (
              <div className="text-center py-8 text-pine-500">Loading public lists...</div>
            )}

            {publicLists && publicLists.length > 0 ? (
              <div className="space-y-4">
                {publicLists.map((list: BookList) => (
                  <div
                    key={list.id}
                    className="bg-white rounded-xl border border-primary-100 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-pine-900 text-lg">{list.name}</h3>
                        {list.description && (
                          <p className="text-sm text-pine-600 mt-0.5">{list.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-pine-500 bg-warm-100 px-2 py-1 rounded-full flex-shrink-0">
                        {list.items.length} {list.items.length === 1 ? "book" : "books"}
                      </span>
                    </div>

                    {list.items.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {list.items.map((item) => (
                          <div key={item.id} className="flex-shrink-0">
                            {item.book.cover_url ? (
                              <img
                                src={item.book.cover_url}
                                alt={item.book.title}
                                className="w-32 h-48 object-cover rounded-lg shadow-sm"
                              />
                            ) : (
                              <div className="w-32 h-48 bg-warm-100 rounded-lg flex items-center justify-center">
                                <span className="text-pine-400 text-xs text-center px-2">
                                  {item.book.title}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !publicListsLoading && (
                <div className="text-center py-8 text-pine-500">
                  <p>No public lists yet. Make one of your lists public to share it!</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {currentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {searchMode === "books"
            ? "Error searching for books. Please try again."
            : "Error searching lists. Please try again."}
        </div>
      )}

      {/* Loading Skeletons */}
      {isCurrentlyLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Book Search Results */}
      {searchMode === "books" && searchResults && searchResults.results && !isLoading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-pine-600">
              Found {searchResults.count} results for &quot;{searchResults.query}&quot;
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

      {/* List Search Results */}
      {searchMode === "lists" && debouncedQuery && !listSearchLoading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-pine-600">
              Found {curatedListMatches.length + (listSearchResults?.count || 0)} result{(curatedListMatches.length + (listSearchResults?.count || 0)) !== 1 ? "s" : ""} for &quot;{debouncedQuery}&quot;
            </p>
            <button
              onClick={handleClearSearch}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Clear Search
            </button>
          </div>

          {/* Curated List Matches - same rendering as idle state */}
          {curatedListMatches.length > 0 && (
            <div className="space-y-8">
              {curatedListMatches.map(({ config, allBooks }) => (
                <div
                  key={config.listType}
                  className="bg-white rounded-xl shadow-card p-6 border border-primary-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-pine-800 flex items-center gap-2">
                      <span>{config.icon || ""}</span> {config.title}
                    </h3>
                    {config.badge && (
                      <span className="text-xs text-pine-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                        {config.badge}
                      </span>
                    )}
                  </div>
                  <CuratedBookRow
                    listType={config.listType}
                    title={config.title}
                    badgeLabel={config.badge}
                    showYear={config.showYear}
                    books={allBooks}
                    totalCount={allBooks.length}
                    maxBooks={10}
                  />
                </div>
              ))}
            </div>
          )}

          {/* DB Public List Matches */}
          {listSearchResults && listSearchResults.results.length > 0 && (
            <div className="space-y-3">
              {curatedListMatches.length > 0 && (
                <h3 className="text-lg font-semibold text-pine-800 mt-4">Public User Lists</h3>
              )}
              {listSearchResults.results.map((result: PublicListSearchResult, index: number) => (
                <div
                  key={`${result.list_id}-${result.matching_book.id}-${index}`}
                  className="bg-white rounded-xl border border-primary-100 p-4 hover:shadow-card-hover transition-all"
                >
                  <div className="flex gap-4">
                    {result.matching_book.cover_url && (
                      <img
                        src={result.matching_book.cover_url}
                        alt={result.matching_book.title}
                        className="w-16 h-20 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-pine-900">{result.list_name}</h3>
                          {result.list_description && (
                            <p className="text-sm text-pine-600 mt-0.5 line-clamp-1">
                              {result.list_description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-pine-500 bg-warm-100 px-2 py-1 rounded-full flex-shrink-0">
                          {result.item_count} {result.item_count === 1 ? "book" : "books"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-pine-500">
                        Matching: <span className="font-medium text-pine-700">{result.matching_book.title}</span>
                        {result.matching_book.author && (
                          <span> by {result.matching_book.author}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state - no matches anywhere */}
          {curatedListMatches.length === 0 && (!listSearchResults || listSearchResults.results.length === 0) && (
            <div className="text-center py-12 text-pine-500">
              No lists found matching &quot;{debouncedQuery}&quot;.
            </div>
          )}
        </div>
      )}

      {/* Empty State for Books */}
      {searchMode === "books" && debouncedQuery && searchResults && searchResults.count === 0 && (
        <div className="text-center py-12 text-pine-500">
          No books found for &quot;{debouncedQuery}&quot;. Try a different search term.
        </div>
      )}
    </div>
  );
}
