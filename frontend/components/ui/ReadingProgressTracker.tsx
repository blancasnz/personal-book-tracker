"use client";

import { useState, useEffect, useRef } from "react";
import { BookListItem } from "@/types";

interface ReadingProgressTrackerProps {
  item: BookListItem;
  onPageUpdate: (newPage: number) => void;
  onFinished: () => void;
  isUpdating?: boolean;
}

export default function ReadingProgressTracker({
  item,
  onPageUpdate,
  onFinished,
  isUpdating = false,
}: ReadingProgressTrackerProps) {
  const pageCount = item.book.page_count;
  const [localPage, setLocalPage] = useState(item.current_page);
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when item changes
  useEffect(() => {
    setLocalPage(item.current_page);
    setIsDirty(false);
  }, [item.current_page]);

  // Don't render if book has no page count
  if (!pageCount) {
    return null;
  }

  const handlePageChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      setLocalPage(0);
      setIsDirty(true);
      return;
    }
    // Cap at page_count
    const capped = Math.min(Math.max(0, parsed), pageCount);
    setLocalPage(capped);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (isDirty) {
      onPageUpdate(localPage);
      setIsDirty(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  const percentage = Math.round((localPage / pageCount) * 100);

  return (
    <div
      className="mt-2 p-2 bg-primary-50 rounded-lg border border-primary-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Page input row */}
      <div className="flex items-center gap-2 text-xs mb-2">
        <span className="text-pine-600">Page:</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localPage}
          onChange={(e) => handlePageChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`w-16 px-2 py-1 text-center border rounded text-pine-800 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors ${
            showSaved ? "border-green-400 bg-green-50" : "border-primary-200"
          }`}
          disabled={isUpdating}
        />
        <span className="text-pine-500">/ {pageCount}</span>
        {showSaved && <span className="text-green-600">✓</span>}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-primary-200 rounded-full overflow-hidden mb-2">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage and Finished button row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-pine-600">{percentage}%</span>
        <button
          onClick={onFinished}
          disabled={isUpdating}
          className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors font-medium disabled:opacity-50"
        >
          Finished Reading
        </button>
      </div>
    </div>
  );
}
