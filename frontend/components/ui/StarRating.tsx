"use client";

interface StarRatingProps {
  rating: number | null | undefined;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export default function StarRating({
  rating,
  onRate,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  };

  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star: number) => {
    if (!readonly && onRate) {
      // If clicking the same star, remove rating
      onRate(rating === star ? 0 : star);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const isFilled = rating && star <= rating;

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={readonly}
            className={`${sizeClasses[size]} ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-transform ${
              isFilled ? "text-yellow-400" : "text-gray-300"
            }`}
            title={
              readonly ? undefined : `Rate ${star} star${star !== 1 ? "s" : ""}`
            }
          >
            {isFilled ? "★" : "☆"}
          </button>
        );
      })}
      {rating && rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      )}
    </div>
  );
}
