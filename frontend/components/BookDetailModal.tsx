"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { checkBookExists } from "@/lib/api";
import { Book, BookListItem, ReadingStatus } from "@/types";
import AddToListModal from "./lists/AddToListModal";
import UpdateStatusModal from "./lists/UpdateStatusModal";
import GenreBadges from "./ui/GenreBadges";
import StatusBadge from "./ui/StatusBadge";
import StarRating from "./ui/StarRating";
import toast from "react-hot-toast";
import EditionSelector from "./EditionSelector";
import Link from "next/link";
import { getBookPageUrl } from "@/lib/bookUtils";

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
  const [showListModal, setShowListModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book>(book);
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState<any>(null);

  // Track status locally so it updates immediately
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | undefined>(
    bookListItem?.status
  );
  const [currentRating, setCurrentRating] = useState<number | undefined>(
    bookListItem?.rating ?? undefined
  );

  useEffect(() => {
    setCurrentBook(book);
  }, [book]);

  useEffect(() => {
    setCurrentStatus(bookListItem?.status);
    setCurrentRating(bookListItem?.rating ?? undefined);
  }, [bookListItem]);

  // Lock body scroll when modal is open
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

  const queryClient = useQueryClient();

  // Check if book already exists in library
  const { data: bookCheck, refetch: refetchBookCheck } = useQuery({
    queryKey: [
      "book-check",
      currentBook.isbn,
      currentBook.title,
      currentBook.author,
    ],
    queryFn: () =>
      checkBookExists(
        currentBook.isbn ?? undefined,
        currentBook.title,
        currentBook.author
      ),
    enabled: isOpen && showAddButton,
  });

  const bookExists = bookCheck?.exists || false;
  const existingLists = bookCheck?.lists || [];

  const statusLabels: Record<ReadingStatus, string> = {
    to_read: "Want to Read",
    reading: "Currently Reading",
    finished: "Finished",
  };

  const statusColors: Record<ReadingStatus, string> = {
    to_read: "bg-blue-100 text-blue-800",
    reading: "bg-green-100 text-green-800",
    finished: "bg-purple-100 text-purple-800",
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-100 shadow-card"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold text-pine-900 pr-8">
                {currentBook.title}
              </h2>
              <button
                onClick={onClose}
                className="text-pine-400 hover:text-pine-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              {/* Cover Image */}
              {currentBook.cover_url && (
                <div className="flex-shrink-0">
                  <img
                    src={currentBook.cover_url}
                    alt={currentBook.title}
                    className="w-48 h-72 object-contain rounded-book book-cover-shadow mx-auto md:mx-0"
                  />

                  {/* View Full Page Button - Only show if book has ID (in library) */}
                  {book.id && (
                    <Link
                      href={getBookPageUrl(book)}
                      className="block mt-4 px-4 py-2 bg-primary-50 text-primary-800 hover:bg-primary-100 rounded-lg transition-colors text-sm font-medium border border-primary-200 text-center"
                    >
                      View Full Page →
                    </Link>
                  )}
                </div>
              )}

              {/* Book Details */}
              <div className="flex-1 space-y-4">
                {/* Author */}
                <div>
                  <h3 className="text-xl font-semibold text-pine-900">
                    {currentBook.author}
                  </h3>
                </div>

                {/* Status Badge - Clickable to update */}
                {bookListItem && currentStatus && (
                  <div>
                    <span className="text-sm font-medium text-pine-600 block mb-2">
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
                    <span className="text-sm font-medium text-pine-600 block mb-2">
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
                {currentBook.genres && currentBook.genres.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-pine-600 block mb-2">
                      Genres:
                    </span>
                    <GenreBadges genres={currentBook.genres} maxVisible={10} />
                  </div>
                )}

                {/* Page Count */}
                {currentBook.page_count && (
                  <div>
                    <span className="text-sm font-medium text-pine-600">
                      Pages:
                    </span>
                    <span className="ml-2 text-pine-800">
                      {currentBook.page_count}
                    </span>
                  </div>
                )}

                {/* Notes - from bookListItem */}
                {bookListItem?.notes && (
                  <div>
                    <span className="text-sm font-medium text-pine-600 block mb-2">
                      Your Notes:
                    </span>
                    <p className="text-pine-700 bg-primary-50 p-3 rounded-lg italic border border-primary-100">
                      "{bookListItem.notes}"
                    </p>
                  </div>
                )}

                {/* Description */}
                {currentBook.description && (
                  <div>
                    <h4 className="text-sm font-medium text-pine-600 mb-2">
                      Description:
                    </h4>
                    <p className="text-pine-700 leading-relaxed">
                      {currentBook.description}
                    </p>
                  </div>
                )}

                {!currentBook.description && (
                  <div className="text-pine-400 italic">
                    No description available
                  </div>
                )}

                {/* Add to List Section OR Show Existing Lists */}
                {showAddButton && (
                  <div>
                    {/* Edition Selector */}
                    <div>
                      <span className="text-sm font-medium text-pine-600 block mb-2">
                        Edition:
                      </span>
                      <EditionSelector
                        book={book}
                        onSelectEdition={(edition) => {
                          const mergedBook = {
                            ...book,
                            ...edition,
                            description:
                              book.description || edition.description,
                            genres:
                              book.genres && book.genres.length > 0
                                ? book.genres
                                : edition.genres,
                          };
                          setCurrentBook(mergedBook);
                        }}
                        selectedFormat={currentBook.format ?? undefined}
                      />
                    </div>

                    {/* Add to List / In List Button */}
                    {bookExists && existingLists.length > 0 ? (
                      <button
                        onClick={() => setShowListModal(true)}
                        className="w-full mt-4 px-4 py-3 bg-primary-50 text-pine-800 rounded-lg hover:bg-primary-100 transition-colors font-medium border border-primary-200"
                      >
                        In {existingLists.length} list{existingLists.length !== 1 ? "s" : ""}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowListModal(true)}
                        className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg hover:from-primary-700 hover:to-secondary-600 transition-all font-medium shadow-sm"
                      >
                        Add to List
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to List / Manage Lists Modal */}
      <AddToListModal
        book={bookExists ? bookCheck.book : currentBook}
        isOpen={showListModal}
        onClose={() => {
          setShowListModal(false);
          refetchBookCheck();
        }}
        existingLists={existingLists}
      />

      {/* Update Status Modal */}
      {showStatusModal && (bookListItem || selectedItemForUpdate) && (
        <UpdateStatusModal
          item={selectedItemForUpdate || bookListItem!}
          isOpen={showStatusModal}
          onClose={(newStatus?: ReadingStatus, newRating?: number) => {
            setShowStatusModal(false);
            setSelectedItemForUpdate(null);
            if (newStatus && bookListItem) {
              setCurrentStatus(newStatus);
            }
            if (newRating !== undefined && bookListItem) {
              setCurrentRating(newRating ?? undefined);
            }
            queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
            queryClient.invalidateQueries({ queryKey: ["list"] });
            queryClient.invalidateQueries({ queryKey: ["lists"] });
            refetchBookCheck(); // Refresh status display
          }}
        />
      )}
    </>
  );
}
