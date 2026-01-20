import { ReadingStatus } from "@/types";

interface StatusBadgeProps {
  status: ReadingStatus;
  onClick?: (e: React.MouseEvent) => void;
}

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = {
    to_read: {
      label: "Want to Read",
      emoji: "📚",
      className: "bg-blue-100 text-blue-800",
    },
    reading: {
      label: "Reading",
      emoji: "📖",
      className: "bg-green-100 text-green-800",
    },
    finished: {
      label: "Finished",
      emoji: "✅",
      className: "bg-purple-100 text-purple-800",
    },
  };

  const { label, emoji, className } = config[status];

  return (
    <button
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      disabled={!onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${className} ${
        onClick
          ? "cursor-pointer hover:opacity-80 hover:shadow-md transition-all border border-transparent hover:border-current"
          : "cursor-default"
      }`}
      title={onClick ? "Click to change status" : undefined}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {onClick && <span className="text-[10px] ml-1">▼</span>}
    </button>
  );
}
