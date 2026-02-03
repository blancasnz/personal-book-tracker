"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBookEditions } from "@/lib/api";
import { Book } from "@/types";
import EditionsModal from "./EditionsModal";

interface EditionSelectorProps {
  book: Book;
  onSelectEdition: (edition: Book) => void;
  selectedFormat?: string;
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
}: EditionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEditionIndex, setSelectedEditionIndex] = useState<number | null>(null);

  const { data: editionsData, isLoading } = useQuery({
    queryKey: ["editions", book.title, book.author],
    queryFn: () => getBookEditions(book.title, book.author),
    enabled: isOpen,
  });

  const editions = editionsData?.editions || [];

  const handleConfirmEdition = (edition: any) => {
    const index = editions.indexOf(edition);
    setSelectedEditionIndex(index !== -1 ? index : null);

    const mergedBook = {
      ...book,
      ...edition,
      description: book.description || edition.description,
      genres: book.genres?.length ? book.genres : edition.genres,
    };
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
      />
    </>
  );
}
