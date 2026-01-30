"use client";

import { useParams, useRouter } from "next/navigation";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { searchExternalBooks, addExternalBookToDb } from "@/lib/api";
import { Book, BookCreate } from "@/types";
import AddToListModal from "@/components/lists/AddToListModal";
import BookDetailModal from "@/components/BookDetailModal";
import { PULITZER_WINNERS, BOOKER_WINNERS } from "@/components/AwardWinnersRow";
import toast from "react-hot-toast";
import BookCard from "@/components/ui/BookCard";

const AWARD_TITLES: Record<string, string> = {
  pulitzer: "Pulitzer Prize Winners",
  booker: "Booker Prize Winners",
};

export default function AwardsPage() {
  const params = useParams();
  const router = useRouter();
  const awardType = params.awardType as string;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);

  const winners = awardType === "pulitzer" ? PULITZER_WINNERS : BOOKER_WINNERS;
  const title = AWARD_TITLES[awardType] || "Award Winners";

  // Fetch each book from Google Books
  const bookQueries = useQueries({
    queries: winners.map((winner) => ({
      queryKey: ["award-book", winner.title, winner.author],
      queryFn: async () => {
        const response = await searchExternalBooks(
          `${winner.title} ${winner.author}`,
          1
        );
        const book = response.results?.[0];
        if (book) {
          return { ...book, awardYear: winner.year };
        }
        return null;
      },
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24 * 7,
    })),
  });

  const addBookMutation = useMutation({
    mutationFn: (book: BookCreate) => addExternalBookToDb(book),
    onSuccess: (addedBook) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setSelectedBook(addedBook);
      toast.success("Book added! Now add it to a list.");
    },
    onError: (error: any) => {
      if (error.response?.data?.detail?.includes("UNIQUE constraint")) {
        toast.error("Book already in your library");
      } else {
        toast.error("Failed to add book");
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isLoading = bookQueries.some((q) => q.isLoading);
  const books = bookQueries
    .map((q) => q.data)
    .filter((book): book is Book & { awardYear: number } => book !== null);

  // Filter books by search query if provided
  const filteredBooks = searchQuery.trim()
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  return (
    <div className="min-h-screen gradient-soft">
      {/* Header Banner */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Back to Discover - Left */}
            <button
              onClick={() => router.push("/search")}
              className="px-4 py-2 bg-white border border-primary-200 text-pine-700 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
            >
              ← Back to Discover
            </button>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-1">
                {title}
              </h1>
            </div>

            {/* Empty spacer for balance */}
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for books..."
              className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-pine-900"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all font-medium shadow-sm"
            >
              Search
            </button>
          </div>
        </form>
        <div className="mb-6">
          <p className="text-pine-600">
            {winners.length} award-winning books from{" "}
            {winners[winners.length - 1].year} to {winners[0].year}
          </p>
        </div>
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full h-48 bg-warm-100 rounded-book mb-2" />
                <div className="h-4 bg-warm-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-warm-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Books Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((book, index) => (
              <BookCard
                key={index}
                book={book}
                onClickBook={(b) => setSelectedBookForDetail(b)}
                onAddBook={(b) => addBookMutation.mutate(b)}
                isAdding={addBookMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredBooks.length === 0 && searchQuery && (
          <div className="text-center py-12 text-pine-500">
            No books match "{searchQuery}" in this list.
          </div>
        )}
      </div>

      {/* Add to List Modal */}
      {selectedBook && (
        <AddToListModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Book Detail Modal */}
      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          isOpen={!!selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          showAddButton={true}
        />
      )}
    </div>
  );
}
