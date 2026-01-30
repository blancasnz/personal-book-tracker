import BookSearch from "@/components/BookSearch";
import Link from "next/link";

export default function SearchPage() {
  return (
    <main className="min-h-screen gradient-soft">
      {/* Header Banner - matches Lists page */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Empty spacer for balance */}
            <div className="w-40"></div>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-1">
                Explore Books
              </h1>
            </div>

            {/* My Curations button - Right (green) */}
            <Link
              href="/lists"
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 rounded-lg transition-all text-sm font-semibold shadow-sm"
            >
              My Curations
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <BookSearch />
        </div>
      </div>
    </main>
  );
}
