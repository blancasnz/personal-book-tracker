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
  pulitzer: "🏆 Pulitzer Prize Winners",
  booker: "🏆 Booker Prize Winners",
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for books..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">
            {winners.length} award-winning books from{" "}
            {winners[winners.length - 1].year} to {winners[0].year}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
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
          <div className="text-center py-12 text-gray-500">
            No books match "{searchQuery}" in this list.
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push("/search")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to Discover
          </button>
        </div>
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
