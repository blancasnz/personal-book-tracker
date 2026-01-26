"use client";

import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { searchExternalBooks, addExternalBookToDb } from "@/lib/api";
import AddToListModal from "./lists/AddToListModal";
import BookDetailModal from "./BookDetailModal";
import { Book, BookCreate } from "@/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Pulitzer Prize for Fiction Winners (2000-2025)
export const PULITZER_WINNERS = [
  { title: "James", author: "Percival Everett", year: 2025 },
  { title: "Night Watch", author: "Jayne Anne Phillips", year: 2024 },
  { title: "Demon Copperhead", author: "Barbara Kingsolver", year: 2023 },
  { title: "The Netanyahus", author: "Joshua Cohen", year: 2022 },
  { title: "The Night Watchman", author: "Louise Erdrich", year: 2021 },
  { title: "The Overstory", author: "Richard Powers", year: 2019 },
  { title: "Less", author: "Andrew Sean Greer", year: 2018 },
  { title: "The Underground Railroad", author: "Colson Whitehead", year: 2017 },
  { title: "The Sympathizer", author: "Viet Thanh Nguyen", year: 2016 },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", year: 2015 },
  { title: "The Goldfinch", author: "Donna Tartt", year: 2014 },
  { title: "The Orphan Master's Son", author: "Adam Johnson", year: 2013 },
  { title: "A Visit from the Goon Squad", author: "Jennifer Egan", year: 2011 },
  { title: "Tinkers", author: "Paul Harding", year: 2010 },
  { title: "Olive Kitteridge", author: "Elizabeth Strout", year: 2009 },
  {
    title: "The Brief Wondrous Life of Oscar Wao",
    author: "Junot Díaz",
    year: 2008,
  },
  { title: "The Road", author: "Cormac McCarthy", year: 2007 },
  { title: "March", author: "Geraldine Brooks", year: 2006 },
  { title: "Gilead", author: "Marilynne Robinson", year: 2005 },
  { title: "The Known World", author: "Edward P. Jones", year: 2004 },
  { title: "Middlesex", author: "Jeffrey Eugenides", year: 2003 },
  { title: "Empire Falls", author: "Richard Russo", year: 2002 },
  {
    title: "The Amazing Adventures of Kavalier & Clay",
    author: "Michael Chabon",
    year: 2001,
  },
  { title: "Interpreter of Maladies", author: "Jhumpa Lahiri", year: 2000 },
];

// Booker Prize Winners (2000-2024)
export const BOOKER_WINNERS = [
  { title: "Orbital", author: "Samantha Harvey", year: 2024 },
  { title: "Prophet Song", author: "Paul Lynch", year: 2023 },
  { title: "Shuggie Bain", author: "Douglas Stuart", year: 2020 },
  { title: "The Testaments", author: "Margaret Atwood", year: 2019 },
  { title: "Girl, Woman, Other", author: "Bernardine Evaristo", year: 2019 },
  { title: "Milkman", author: "Anna Burns", year: 2018 },
  { title: "Lincoln in the Bardo", author: "George Saunders", year: 2017 },
  { title: "The Sellout", author: "Paul Beatty", year: 2016 },
  {
    title: "A Brief History of Seven Killings",
    author: "Marlon James",
    year: 2015,
  },
  {
    title: "The Narrow Road to the Deep North",
    author: "Richard Flanagan",
    year: 2014,
  },
  { title: "The Luminaries", author: "Eleanor Catton", year: 2013 },
  { title: "Bring Up the Bodies", author: "Hilary Mantel", year: 2012 },
  { title: "The Sense of an Ending", author: "Julian Barnes", year: 2011 },
  { title: "Wolf Hall", author: "Hilary Mantel", year: 2009 },
  { title: "The White Tiger", author: "Aravind Adiga", year: 2008 },
  { title: "The Gathering", author: "Anne Enright", year: 2007 },
  { title: "The Inheritance of Loss", author: "Kiran Desai", year: 2006 },
  { title: "The Sea", author: "John Banville", year: 2005 },
  { title: "The Line of Beauty", author: "Alan Hollinghurst", year: 2004 },
  { title: "Vernon God Little", author: "DBC Pierre", year: 2003 },
  { title: "Life of Pi", author: "Yann Martel", year: 2002 },
  {
    title: "True History of the Kelly Gang",
    author: "Peter Carey",
    year: 2001,
  },
  { title: "The Blind Assassin", author: "Margaret Atwood", year: 2000 },
];

interface AwardWinnersRowProps {
  awardType: "pulitzer" | "booker";
  maxBooks?: number;
}

export default function AwardWinnersRow({
  awardType,
  maxBooks = 10,
}: AwardWinnersRowProps) {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] =
    useState<Book | null>(null);
  const queryClient = useQueryClient();

  const winners =
    awardType === "pulitzer"
      ? PULITZER_WINNERS.slice(0, maxBooks)
      : BOOKER_WINNERS.slice(0, maxBooks);

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
      staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24 * 7, // Keep for 7 days
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

  const isLoading = bookQueries.some((q) => q.isLoading);
  const books = bookQueries
    .map((q) => q.data)
    .filter((book): book is Book & { awardYear: number } => book !== null);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-32 h-48 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return <p className="text-gray-500 text-sm">No books found</p>;
  }

  return (
    <>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {books.map((book, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-32 cursor-pointer group"
              onClick={() => setSelectedBookForDetail(book)}
            >
              {/* Book Cover */}
              {book.cover_url ? (
                <div className="relative mb-2">
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                  />
                  {/* Award Year Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    🏆 {book.awardYear}
                  </div>
                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addBookMutation.mutate(book as BookCreate);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50"
                    title="Add to library"
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No cover</span>
                </div>
              )}

              {/* Book Title */}
              <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                {book.title}
              </h4>

              {/* Author */}
              <p className="text-xs text-gray-600 line-clamp-1">
                {book.author}
              </p>
            </div>
          ))}
        </div>

        {/* See All Button */}
        <button
          onClick={() => router.push(`/search/awards/${awardType}`)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          See all{" "}
          {awardType === "pulitzer"
            ? PULITZER_WINNERS.length
            : BOOKER_WINNERS.length}{" "}
          books →
        </button>
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
    </>
  );
}
