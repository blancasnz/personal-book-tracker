"use client";

import { Book } from "@/types";

interface BookDetailModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookDetailModal({
  book,
  isOpen,
  onClose,
}: BookDetailModalProps) {
  if (!isOpen) return null;

  return (
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
          {/* Header with Close Button */}
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
              {/* Author */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {book.author}
                </h3>
              </div>

              {/* Publication Year */}
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

              {/* Page Count */}
              {book.page_count && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Pages:
                  </span>
                  <span className="ml-2 text-gray-700">{book.page_count}</span>
                </div>
              )}

              {/* ISBN */}
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

              {/* Description */}
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

              {/* Empty State if No Description */}
              {!book.description && (
                <div className="text-gray-400 italic">
                  No description available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
