/**
 * Script to fetch book covers via the backend's /search/external endpoint,
 * which uses Google Books API with an API key for better results.
 *
 * Requires the backend to be running at localhost:8000.
 * Run with: npx tsx scripts/fixCovers.ts
 */

import * as fs from "fs";
import * as path from "path";

const BACKEND_URL = "http://localhost:8000";

interface BookEntry {
  title: string;
  author: string;
  year: number;
  cover_url: string | null;
  isbn: string | null;
  description: string | null;
  page_count: number | null;
  genres: string[];
  published_year: number | null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromBackend(
  title: string,
  author: string
): Promise<BookEntry | null> {
  // Use intitle:/inauthor: qualifiers for much better Google Books matching
  const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
  const url = `${BACKEND_URL}/search/external?q=${query}&max_results=3`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`    HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    const book = data.results?.[0];
    if (book && book.cover_url) {
      return book;
    }
    console.warn(`    No cover returned from backend`);
    return null;
  } catch (error) {
    console.error(`    Error:`, error);
    return null;
  }
}

async function processBooks(
  books: BookEntry[],
  label: string
): Promise<BookEntry[]> {
  console.log(`\nProcessing ${label} (${books.length} books)...`);
  const updated: BookEntry[] = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`  [${i + 1}/${books.length}] ${book.title}`);

    const result = await fetchFromBackend(book.title, book.author);

    if (result) {
      console.log(`    ✓ Got cover`);
      updated.push({
        title: book.title,
        author: book.author,
        year: book.year,
        cover_url: result.cover_url,
        isbn: result.isbn ?? book.isbn,
        description: result.description ?? book.description,
        page_count: result.page_count ?? book.page_count,
        genres:
          result.genres && result.genres.length > 0
            ? result.genres
            : book.genres,
        published_year: result.published_year ?? book.published_year,
      });
    } else {
      console.log(`    → Keeping existing data`);
      updated.push(book);
    }

    // 5s delay between requests to avoid rate limiting
    if (i < books.length - 1) {
      await delay(5000);
    }
  }

  return updated;
}

function formatBook(book: BookEntry): string {
  return `  {
    title: ${JSON.stringify(book.title)},
    author: ${JSON.stringify(book.author)},
    year: ${book.year},
    cover_url: ${book.cover_url ? JSON.stringify(book.cover_url) : "null"},
    isbn: ${book.isbn ? JSON.stringify(book.isbn) : "null"},
    description: ${book.description ? JSON.stringify(book.description) : "null"},
    page_count: ${book.page_count ?? "null"},
    genres: ${JSON.stringify(book.genres)},
    published_year: ${book.published_year ?? "null"},
  }`;
}

function generateFile(pulitzer: BookEntry[], booker: BookEntry[]): string {
  return `/**
 * Static data for award-winning books.
 *
 * This file contains pre-populated book data to avoid rate limiting issues
 * with the Google Books API. Award winners are static data that only
 * changes once per year, so there's no need for dynamic fetching.
 *
 * Cover images fetched from Google Books API via the backend.
 * To regenerate, start the backend and run: npx tsx scripts/fixCovers.ts
 */

export interface AwardWinnerBook {
  title: string;
  author: string;
  year: number;
  cover_url: string | null;
  isbn: string | null;
  description: string | null;
  page_count: number | null;
  genres: string[];
  published_year: number | null;
}

// Pulitzer Prize for Fiction Winners (2000-2025)
export const PULITZER_WINNERS: AwardWinnerBook[] = [
${pulitzer.map(formatBook).join(",\n")}
];

// Booker Prize Winners (2000-2025)
export const BOOKER_WINNERS: AwardWinnerBook[] = [
${booker.map(formatBook).join(",\n")}
];
`;
}

async function main() {
  // Verify backend is running
  try {
    await fetch(`${BACKEND_URL}/docs`);
  } catch {
    console.error(
      "Error: Backend is not running at " +
        BACKEND_URL +
        "\nStart it first, then re-run this script."
    );
    process.exit(1);
  }

  const dataPath = path.join(
    __dirname,
    "..",
    "frontend",
    "data",
    "awardWinners.ts"
  );
  const currentContent = fs.readFileSync(dataPath, "utf-8");

  const pulitzerMatch = currentContent.match(
    /export const PULITZER_WINNERS: AwardWinnerBook\[\] = (\[[\s\S]*?\n\]);/
  );
  const bookerMatch = currentContent.match(
    /export const BOOKER_WINNERS: AwardWinnerBook\[\] = (\[[\s\S]*?\n\]);/
  );

  if (!pulitzerMatch || !bookerMatch) {
    console.error("Could not parse existing data file");
    process.exit(1);
  }

  const pulitzer: BookEntry[] = eval(pulitzerMatch[1]);
  const booker: BookEntry[] = eval(bookerMatch[1]);

  console.log(
    `Loaded ${pulitzer.length} Pulitzer and ${booker.length} Booker winners`
  );
  console.log("Fetching covers from backend (Google Books API)...\n");

  const updatedPulitzer = await processBooks(pulitzer, "Pulitzer Prize");
  const updatedBooker = await processBooks(booker, "Booker Prize");

  const output = generateFile(updatedPulitzer, updatedBooker);
  fs.writeFileSync(dataPath, output, "utf-8");

  console.log(`\nWrote updated data to ${dataPath}`);

  const missing = [
    ...updatedPulitzer
      .filter((b) => !b.cover_url)
      .map((b) => `Pulitzer: ${b.title}`),
    ...updatedBooker
      .filter((b) => !b.cover_url)
      .map((b) => `Booker: ${b.title}`),
  ];

  if (missing.length > 0) {
    console.log("\nBooks still missing covers:");
    missing.forEach((b) => console.log(`  - ${b}`));
  } else {
    console.log("All books have covers!");
  }
}

main().catch(console.error);
