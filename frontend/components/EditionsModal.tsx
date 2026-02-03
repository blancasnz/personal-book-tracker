"use client";

import { useEffect, useState } from "react";

interface Edition {
  title?: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  description?: string;
  published_year?: number;
  page_count?: number;
  genres?: string[];
  format?: string;
  edition?: string;
  publisher?: string;
}

interface EditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editions: Edition[];
  isLoading: boolean;
  currentEditionIndex?: number | null;
  onSelectEdition: (edition: Edition) => void;
}

const formatLabels: Record<string, string> = {
  hardcover: "Hardcover",
  paperback: "Paperback",
  ebook: "eBook",
  audiobook: "Audiobook",
  unknown: "Unknown Format",
};

const formatEmojis: Record<string, string> = {
  hardcover: "\u{1F4D8}",
  paperback: "\u{1F4D6}",
  ebook: "\u{1F4F1}",
  audiobook: "\u{1F3A7}",
  unknown: "\u{1F4DA}",
};

export default function EditionsModal({
  isOpen,
  onClose,
  editions,
  isLoading,
  currentEditionIndex,
  onSelectEdition,
}: EditionsModalProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Reset highlight to the currently-applied edition whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(currentEditionIndex ?? null);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentEditionIndex]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (highlightedIndex !== null && editions[highlightedIndex]) {
      onSelectEdition(editions[highlightedIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-primary-100 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <h2 className="text-lg font-bold text-pine-900">
            Select Edition
            {!isLoading && editions.length > 0 && (
              <span className="text-sm font-normal text-pine-500 ml-2">
                ({editions.length} found)
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-pine-400 hover:text-pine-700 text-2xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-primary-100 p-3"
                >
                  <div className="bg-primary-100 rounded w-full h-32 mb-3" />
                  <div className="bg-primary-100 rounded h-4 w-3/4 mb-2" />
                  <div className="bg-primary-100 rounded h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && editions.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">{"\u{1F4DA}"}</span>
              <p className="text-pine-500 text-sm">
                No other editions found
              </p>
            </div>
          )}

          {!isLoading && editions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {editions.map((edition, index) => {
                const isHighlighted = highlightedIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setHighlightedIndex(index)}
                    className={`relative text-left rounded-lg border p-3 transition-all hover:shadow-md ${
                      isHighlighted
                        ? "ring-2 ring-primary-500 border-primary-300 bg-primary-50"
                        : "border-primary-100 hover:border-primary-200"
                    }`}
                  >
                    {/* Selected checkmark */}
                    {isHighlighted && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Cover */}
                    <div className="flex justify-center mb-3">
                      {edition.cover_url ? (
                        <img
                          src={edition.cover_url}
                          alt={edition.title || "Edition cover"}
                          className="w-20 h-28 object-cover rounded shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-28 bg-warm-100 rounded flex items-center justify-center text-pine-300 text-xs text-center px-1">
                          No cover
                        </div>
                      )}
                    </div>

                    {/* Format */}
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">
                        {formatEmojis[edition.format || "unknown"] || "\u{1F4DA}"}
                      </span>
                      <span className="text-xs font-semibold text-pine-900 truncate">
                        {formatLabels[edition.format || "unknown"] || edition.format}
                      </span>
                    </div>

                    {/* Publisher */}
                    {edition.publisher && (
                      <p className="text-xs text-pine-600 truncate">
                        {edition.publisher}
                      </p>
                    )}

                    {/* Year */}
                    {edition.published_year && (
                      <p className="text-xs text-pine-400">
                        {edition.published_year}
                      </p>
                    )}

                    {/* Page count */}
                    {edition.page_count && (
                      <p className="text-xs text-pine-400">
                        {edition.page_count} pg
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with confirm button */}
        {!isLoading && editions.length > 0 && (
          <div className="px-6 py-4 border-t border-primary-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-pine-600 hover:text-pine-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={highlightedIndex === null}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600"
            >
              Select this edition
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
