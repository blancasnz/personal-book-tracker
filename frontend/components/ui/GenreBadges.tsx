"use client";

import { useState } from "react";

interface GenreBadgesProps {
  genres: string[];
  maxVisible?: number;
}

export default function GenreBadges({
  genres,
  maxVisible = 3,
}: GenreBadgesProps) {
  const [showAll, setShowAll] = useState(false);

  if (!genres || !Array.isArray(genres) || genres.length === 0) return null;

  const visibleGenres = showAll ? genres : genres.slice(0, maxVisible);
  const hasMore = genres.length > maxVisible;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleGenres.map((genre, index) => (
        <span
          key={index}
          className="inline-block px-2 py-0.5 bg-gray-200 text-gray-800 text-xs rounded-full whitespace-nowrap"
        >
          {genre}
        </span>
      ))}

      {hasMore && !showAll && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(true);
          }}
          className="text-xs text-gray-800 hover:text-gray-900 font-medium"
        >
          +{genres.length - maxVisible} more
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(false);
          }}
          className="text-xs text-gray-800 hover:text-gray-900 font-medium"
        >
          show less
        </button>
      )}
    </div>
  );
}
