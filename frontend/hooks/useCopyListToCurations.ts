import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createList,
  addExternalBookToDb,
  checkBookExists,
  addBookToList,
} from "@/lib/api";
import { CuratedBook } from "@/data/lists";
import { BookListItem } from "@/types";
import toast from "react-hot-toast";

const BATCH_SIZE = 5;

interface CopyProgress {
  current: number;
  total: number;
}

interface UseCopyListToCurationsOptions {
  listName: string;
  listDescription?: string;
  curatedBooks?: CuratedBook[];
  communityItems?: BookListItem[];
  showYear?: boolean;
}

export function useCopyListToCurations() {
  const queryClient = useQueryClient();
  const [isCopying, setIsCopying] = useState(false);
  const [progress, setProgress] = useState<CopyProgress | null>(null);

  const copyList = useCallback(
    async ({
      listName,
      listDescription,
      curatedBooks,
      communityItems,
      showYear,
    }: UseCopyListToCurationsOptions) => {
      setIsCopying(true);

      const books = curatedBooks || [];
      const items = communityItems || [];
      const total = books.length + items.length;
      setProgress({ current: 0, total });

      try {
        // 1. Create the new list (always private)
        const description = listDescription
          ? `Copied from: ${listName}. ${listDescription}`
          : `Copied from: ${listName}`;

        const newList = await createList({
          name: listName,
          description,
          is_public: 0,
        });

        let completed = 0;

        // 2. Process curated books sequentially to preserve list order
        if (curatedBooks && curatedBooks.length > 0) {
          for (const book of curatedBooks) {
            try {
              let bookId: number;

              // Check if book already exists in the DB (by ISBN or title/author)
              const existing = await checkBookExists(
                book.isbn || undefined,
                book.title,
                book.author
              );

              if (existing?.exists && existing?.book?.id) {
                bookId = existing.book.id;
              } else {
                // Book doesn't exist yet — add it
                const added = await addExternalBookToDb({
                  title: book.title,
                  author: book.author,
                  isbn: book.isbn || undefined,
                  cover_url: book.cover_url || undefined,
                  description: book.description || undefined,
                  published_year: book.published_year || undefined,
                  page_count: book.page_count || undefined,
                  genres: book.genres,
                });
                bookId = added.id;
              }

              await addBookToList(newList.id, {
                book_id: bookId,
                status: "to_read",
                ...(showYear && book.year ? { award_year: book.year } : {}),
                ...(book.rank ? { rank: book.rank } : {}),
              });

              completed++;
            } catch (err: any) {
              console.error(
                `Failed to copy "${book.title}" by ${book.author}:`,
                JSON.stringify(err?.response?.data ?? err?.message ?? err)
              );
            }

            setProgress({ current: completed, total });
          }
        }

        // 3. Process community items in batches
        if (communityItems && communityItems.length > 0) {
          for (let i = 0; i < communityItems.length; i += BATCH_SIZE) {
            const batch = communityItems.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
              batch.map(async (item) => {
                await addBookToList(newList.id, {
                  book_id: item.book.id,
                  status: "to_read",
                });
              })
            );

            completed += results.filter((r) => r.status === "fulfilled").length;
            setProgress({ current: completed, total });
          }
        }

        // 4. Invalidate caches and show success
        queryClient.invalidateQueries({ queryKey: ["lists"] });
        queryClient.invalidateQueries({ queryKey: ["list"] });
        queryClient.invalidateQueries({ queryKey: ["publicLists"] });

        toast.success(`Copied ${completed} of ${total} books to My Curations`);
      } catch (err) {
        toast.error("Failed to copy list. Please try again.");
      } finally {
        setIsCopying(false);
        setProgress(null);
      }
    },
    [queryClient]
  );

  return { copyList, isCopying, progress };
}
