"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExternalBookToDb } from "@/lib/api";
import { Book, BookCreate, BookListItem, ReadingStatus } from "@/types";
import AddToListModal from "./lists/AddToListModal";
import UpdateStatusModal from "./lists/UpdateStatusModal";
import GenreBadges from "./ui/GenreBadges";
import StatusBadge from "./ui/StatusBadge";
import StarRating from "./ui/StarRating";
import toast from "react-hot-toast";

interface BookDetailModalProps {
  book: Book;
  bookListItem?: BookListItem;
  isOpen: boolean;
  onClose: () => void;
  showAddButton?: boolean;
}

export default function BookDetailModal({
  book,
  bookListItem,
  isOpen,
  onClose,
  showAddButton = false,
}: BookDetailModalProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Track status locally so it updates immediately
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | undefined>(
    bookListItem?.status
  );
  const [currentRating, setCurrentRating] = useState<number | undefined>(
    bookListItem?.rating ?? undefined // Convert null to undefined
  );

  // Update local state when bookListItem changes
  useEffect(() => {
    setCurrentStatus(bookListItem?.status);
    setCurrentRating(bookListItem?.rating ?? undefined); // Convert null to undefined
  }, [bookListItem]);

  const queryClient = useQueryClient();

  const addBookMutation = useMutation({
    mutationFn: (bookData: BookCreate) => addExternalBookToDb(bookData),
    onSuccess: (addedBook) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setSelectedBook(addedBook);
    },
    onError: (error: any) => {
      if (error.response?.data?.detail?.includes("UNIQUE constraint")) {
        toast.error("Book already in your library");
      } else {
        toast.error("Failed to add book");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <>
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
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold pr-8">{book.title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              {book.cover_url && (
                <div className="flex-shrink-0">
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-48 h-72 object-contain rounded-lg shadow-lg mx-auto md:mx-0"
                  />
                </div>
              )}

              {/* Book Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {book.author}
                  </h3>
                </div>

                {/* Status Badge - Clickable to update */}
                {bookListItem && currentStatus && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">
                      Status:
                    </span>
                    <StatusBadge
                      status={currentStatus}
                      onClick={() => setShowStatusModal(true)}
                    />
                  </div>
                )}

                {/* Rating - Only show for finished books */}
                {bookListItem && currentStatus === "finished" && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">
                      Your Rating:
                    </span>
                    <StarRating
                      rating={currentRating || 0}
                      onRate={() => {}}
                      size="md"
                    />
                  </div>
                )}

                {/* Genres */}
                {book.genres && book.genres.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">
                      Genres:
                    </span>
                    <GenreBadges genres={book.genres} maxVisible={10} />
                  </div>
                )}

                {book.published_year && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Published:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {book.published_year}
                    </span>
                  </div>
                )}

                {book.page_count && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Pages:
                    </span>
                    <span className="ml-2 text-gray-700">
                      {book.page_count}
                    </span>
                  </div>
                )}

                {book.isbn && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      ISBN:
                    </span>
                    <span className="ml-2 text-gray-700 font-mono text-sm">
                      {book.isbn}
                    </span>
                  </div>
                )}

                {/* Notes - from bookListItem */}
                {bookListItem?.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">
                      Your Notes:
                    </span>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">
                      "{bookListItem.notes}"
                    </p>
                  </div>
                )}

                {book.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Description:
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                )}

                {!book.description && (
                  <div className="text-gray-400 italic">
                    No description available
                  </div>
                )}

                {/* Add to Library Button */}
                {showAddButton && (
                  <button
                    onClick={() => addBookMutation.mutate(book as BookCreate)}
                    disabled={addBookMutation.isPending}
                    className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {addBookMutation.isPending ? "Adding..." : "Add to Library"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to List Modal - opens after adding to library */}
      {selectedBook && (
        <AddToListModal
          book={selectedBook}
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Update Status Modal */}
      {showStatusModal && bookListItem && (
        <UpdateStatusModal
          item={bookListItem}
          isOpen={showStatusModal}
          onClose={(newStatus?: ReadingStatus, newRating?: number) => {
            setShowStatusModal(false);
            // Update local state immediately if new values provided
            if (newStatus) {
              setCurrentStatus(newStatus);
            }
            if (newRating !== undefined) {
              setCurrentRating(newRating ?? undefined); // Convert null to undefined
            }
            // Also invalidate queries so the homepage updates
            queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
            queryClient.invalidateQueries({ queryKey: ["list"] });
            queryClient.invalidateQueries({ queryKey: ["lists"] });
          }}
        />
      )}
    </>
  );
}
