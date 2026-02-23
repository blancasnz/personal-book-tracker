import { Suspense } from "react";
import BookSearch from "@/components/BookSearch";
import Link from "next/link";

function SearchLoading() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-warm-200 rounded-lg animate-pulse"></div>
        <div className="w-24 h-10 bg-warm-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-32 h-8 bg-warm-200 rounded-full animate-pulse flex-shrink-0"></div>
        ))}
      </div>
      <div className="space-y-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <div className="h-6 w-48 bg-warm-200 rounded animate-pulse mb-4"></div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex-shrink-0 w-32">
                  <div className="w-full h-48 bg-warm-200 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-4 bg-warm-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-warm-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
            <Link
              href="/search"
              className="absolute left-1/2 transform -translate-x-1/2 text-center hover:opacity-80 transition-opacity"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-1">
                Explore Books
              </h1>
            </Link>

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
          <Suspense fallback={<SearchLoading />}>
            <BookSearch />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
