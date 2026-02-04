"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import BookPage from "@/components/BookPage";

export default function BookPreviewPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();

  // Get book data from URL params (passed from search)
  const bookData = {
    title: searchParams.get("title") || "",
    author: searchParams.get("author") || "",
    isbn: searchParams.get("isbn") || undefined,
    cover_url: searchParams.get("cover_url") || undefined,
    description: searchParams.get("description") || undefined,
    published_year: searchParams.get("published_year")
      ? parseInt(searchParams.get("published_year")!)
      : undefined,
    page_count: searchParams.get("page_count")
      ? parseInt(searchParams.get("page_count")!)
      : undefined,
    genres: searchParams.get("genres")?.split(",") || [],
    format: searchParams.get("format") || undefined,
  };

  const searchQuery = searchParams.get("q") || undefined;

  return <BookPage book={bookData as any} showAddButton={true} searchQuery={searchQuery} />;
}
