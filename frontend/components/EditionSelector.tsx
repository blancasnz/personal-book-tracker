"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBookEditions } from "@/lib/api";
import { Book } from "@/types";

interface EditionSelectorProps {
  book: Book;
  onSelectEdition: (edition: Book) => void;
  selectedFormat?: string;
}

export default function EditionSelector({
  book,
  onSelectEdition,
  selectedFormat,
}: EditionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: editionsData, isLoading } = useQuery({
    queryKey: ["editions", book.title, book.author],
    queryFn: () => getBookEditions(book.title, book.author),
    enabled: isOpen, // Only fetch when dropdown is opened
  });

  const editions = editionsData?.editions || [];

  const formatLabels: Record<string, string> = {
    hardcover: "Hardcover",
    paperback: "Paperback",
    ebook: "eBook",
    audiobook: "Audiobook",
    unknown: "Unknown Format",
  };

  const formatEmojis: Record<string, string> = {
    hardcover: "📘",
    paperback: "📖",
    ebook: "📱",
    audiobook: "🎧",
    unknown: "📚",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-primary-50 text-pine-800 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-between border border-primary-200"
      >
        <span>
          {selectedFormat
            ? `${formatEmojis[selectedFormat]} ${formatLabels[selectedFormat]}`
            : "Select Edition"}
        </span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-primary-200 rounded-lg shadow-card max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-pine-600 text-sm">
              Loading editions...
            </div>
          )}

          {!isLoading && editions.length === 0 && (
            <div className="p-4 text-center text-pine-500 text-sm">
              No editions found
            </div>
          )}

          {!isLoading && editions.length === 1 && (
            <div className="p-4 text-center text-pine-500 text-sm">
              Only one edition available
            </div>
          )}

          {!isLoading &&
            editions.length > 0 &&
            editions.map((edition: any, index: number) => (
              <button
                key={index}
                onClick={() => {
                  const mergedBook = {
                    ...book,
                    ...edition,
                    description: book.description || edition.description,
                    genres: book.genres?.length ? book.genres : edition.genres,
                  };
                  console.log("Merged result:", mergedBook);
                  console.log("Has description?", !!mergedBook.description);
                  onSelectEdition(mergedBook);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-primary-100 last:border-b-0 ${
                  selectedFormat === edition.format ? "bg-primary-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {formatEmojis[edition.format] || "📚"}
                      </span>
                      <span className="font-semibold text-pine-900 text-sm">
                        {formatLabels[edition.format] || edition.format}
                      </span>
                    </div>
                    {edition.page_count && (
                      <p className="text-xs text-pine-600">
                        {edition.page_count} pages
                      </p>
                    )}
                    {edition.edition && (
                      <p className="text-xs text-pine-500 mt-1">
                        {edition.edition}
                      </p>
                    )}
                    {edition.published_year && (
                      <p className="text-xs text-pine-400">
                        {edition.published_year}
                      </p>
                    )}
                  </div>
                  {edition.cover_url && (
                    <img
                      src={edition.cover_url}
                      alt={edition.title}
                      className="w-8 h-12 object-cover rounded"
                    />
                  )}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
