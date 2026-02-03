"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookEditions, updateBook } from "@/lib/api";
import { Book } from "@/types";
import EditionsModal from "./EditionsModal";
import toast from "react-hot-toast";

interface EditionSelectorProps {
  book: Book;
  onSelectEdition: (edition: Book) => void;
  selectedFormat?: string;
  existingBookId?: number;
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

export default function EditionSelector({
  book,
  onSelectEdition,
  selectedFormat,
  existingBookId,
}: EditionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEditionIndex, setSelectedEditionIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const { data: editionsData, isLoading } = useQuery({
    queryKey: ["editions", book.title, book.author],
    queryFn: () => getBookEditions(book.title, book.author),
    enabled: isOpen,
  });

  const editions = editionsData?.editions || [];

  const handleConfirmEdition = async (edition: any) => {
    const index = editions.indexOf(edition);
    setSelectedEditionIndex(index !== -1 ? index : null);

    const mergedBook = {
      ...book,
      ...edition,
      description: book.description || edition.description,
      genres: book.genres?.length ? book.genres : edition.genres,
    };

    if (existingBookId) {
      // Book is already in a list — persist the edition change to the DB
      setIsUpdating(true);
      try {
        await updateBook(existingBookId, {
          isbn: edition.isbn,
          cover_url: edition.cover_url,
          format: edition.format,
          edition: edition.edition,
          page_count: edition.page_count,
          published_year: edition.published_year,
        });
        // Invalidate queries so the UI reflects the update everywhere
        queryClient.invalidateQueries({ queryKey: ["book-check"] });
        queryClient.invalidateQueries({ queryKey: ["list"] });
        queryClient.invalidateQueries({ queryKey: ["lists"] });
        queryClient.invalidateQueries({ queryKey: ["currently-reading"] });
        toast.success("Edition updated!");
      } catch {
        toast.error("Failed to update edition");
        setIsUpdating(false);
        return;
      }
      setIsUpdating(false);
    }

    onSelectEdition(mergedBook);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-primary-50 text-pine-800 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-between border border-primary-200"
      >
        <span>
          {selectedFormat
            ? `${formatEmojis[selectedFormat] || "\u{1F4DA}"} ${formatLabels[selectedFormat] || selectedFormat}`
            : "See more editions"}
        </span>
        <span className="text-pine-400">{"\u{25B6}"}</span>
      </button>

      <EditionsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editions={editions}
        isLoading={isLoading}
        currentEditionIndex={selectedEditionIndex}
        onSelectEdition={handleConfirmEdition}
        confirmLabel={existingBookId ? "Update Edition" : "Select this edition"}
        isUpdating={isUpdating}
      />
    </>
  );
}
