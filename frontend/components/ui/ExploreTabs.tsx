"use client";

interface ExploreTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TABS = [
  { id: "awards", label: "Major Literary Awards" },
  { id: "best-of", label: "Best Of All Time" },
  { id: "book-clubs", label: "Book Clubs & Picks" },
  { id: "genre", label: "Genre Awards" },
  { id: "community", label: "Community Curations" },
] as const;

export default function ExploreTabs({
  activeTab,
  onTabChange,
}: ExploreTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                : "bg-warm-100 text-warm-700 hover:bg-warm-200"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
