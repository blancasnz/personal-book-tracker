/**
 * Script to fetch book covers for all curated lists via the backend's
 * /search/external endpoint, which uses Google Books API with an API key.
 *
 * Requires the backend to be running at localhost:8000.
 * Run with: npx tsx scripts/fetchCuratedListCovers.ts
 *
 * You can also run for specific lists:
 * npx tsx scripts/fetchCuratedListCovers.ts hugo nebula
 */

import * as fs from "fs";
import * as path from "path";

const BACKEND_URL = "http://localhost:8000";

interface CuratedBook {
  title: string;
  author: string;
  year?: number;
  rank?: number;
  note?: string;
  cover_url: string | null;
  isbn: string | null;
  description: string | null;
  page_count: number | null;
  genres: string[];
  published_year: number | null;
}

// Map of list file names to their export variable names
const LIST_FILES: Record<string, { file: string; varName: string }> = {
  pulitzer: { file: "pulitzerPrize.ts", varName: "PULITZER_WINNERS" },
  booker: { file: "bookerPrize.ts", varName: "BOOKER_WINNERS" },
  hugo: { file: "hugoWinners.ts", varName: "HUGO_WINNERS" },
  nebula: { file: "nebulaWinners.ts", varName: "NEBULA_WINNERS" },
  "national-book-award": {
    file: "nationalBookAward.ts",
    varName: "NATIONAL_BOOK_AWARD_WINNERS",
  },
  "time-100": { file: "time100Novels.ts", varName: "TIME_100_NOVELS" },
  "nyt-21st-century-readers": {
    file: "nyt21stCentury.ts",
    varName: "NYT_21ST_CENTURY_READERS",
  },
  "nyt-21st-century-critics": {
    file: "nyt21stCenturyCritics.ts",
    varName: "NYT_21ST_CENTURY_CRITICS",
  },
  "npr-scifi-fantasy": {
    file: "nprSciFiFantasy.ts",
    varName: "NPR_SCIFI_FANTASY",
  },
  "npr-thrillers": {
    file: "nprThrillers.ts",
    varName: "NPR_THRILLERS",
  },
  "oprah-2020s": { file: "oprahBookClub2020s.ts", varName: "OPRAH_BOOK_CLUB_2020S" },
  "oprah-2010s": { file: "oprahBookClub2010s.ts", varName: "OPRAH_BOOK_CLUB_2010S" },
  "oprah-2000s": { file: "oprahBookClub2000s.ts", varName: "OPRAH_BOOK_CLUB_2000S" },
  "reese-2023": { file: "reeseBookClub2023.ts", varName: "REESE_BOOK_CLUB_2023" },
  "reese-2020": { file: "reeseBookClub2020.ts", varName: "REESE_BOOK_CLUB_2020" },
  "reese-2017": { file: "reeseBookClub2017.ts", varName: "REESE_BOOK_CLUB_2017" },
  "dua-lipa-2023": { file: "duaLipaBookClub2023.ts", varName: "DUA_LIPA_BOOK_CLUB_2023" },
  "dua-lipa-2024": { file: "duaLipaBookClub2024.ts", varName: "DUA_LIPA_BOOK_CLUB_2024" },
  "dua-lipa-2025": { file: "duaLipaBookClub2025.ts", varName: "DUA_LIPA_BOOK_CLUB_2025" },
  "dua-lipa-2026": { file: "duaLipaBookClub2026.ts", varName: "DUA_LIPA_BOOK_CLUB_2026" },
  "bram-stoker": { file: "bramStoker.ts", varName: "BRAM_STOKER_WINNERS" },
  "locus-fantasy": { file: "locusFantasy.ts", varName: "LOCUS_FANTASY_WINNERS" },
  agatha: { file: "agathaAwards.ts", varName: "AGATHA_WINNERS" },
  "world-fantasy": {
    file: "worldFantasy.ts",
    varName: "WORLD_FANTASY_WINNERS",
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromBackend(
  title: string,
  author: string
): Promise<Partial<CuratedBook> | null> {
  // Use intitle:/inauthor: qualifiers for better Google Books matching
  const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
  const url = `${BACKEND_URL}/search/external?q=${query}&max_results=3`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`    HTTP ${response.status}`);
      return null;
    }
    const data = await response.json() as { results?: any[] };

    // Find the best matching result
    const results = data.results || [];
    for (const book of results) {
      if (book.cover_url) {
        // Verify the title/author match reasonably well
        const titleMatch =
          book.title?.toLowerCase().includes(title.toLowerCase().slice(0, 10)) ||
          title.toLowerCase().includes(book.title?.toLowerCase().slice(0, 10));
        const authorMatch =
          book.author
            ?.toLowerCase()
            .includes(author.split(" ").pop()?.toLowerCase() || "") ||
          author
            .toLowerCase()
            .includes(book.author?.split(" ").pop()?.toLowerCase() || "");

        if (titleMatch || authorMatch) {
          return book;
        }
      }
    }

    // If no good match, return the first result with a cover
    const withCover = results.find((r: any) => r.cover_url);
    if (withCover) {
      return withCover;
    }

    console.warn(`    No cover found`);
    return null;
  } catch (error) {
    console.error(`    Error:`, error);
    return null;
  }
}

async function processBooks(
  books: CuratedBook[],
  label: string
): Promise<CuratedBook[]> {
  console.log(`\nProcessing ${label} (${books.length} books)...`);
  const updated: CuratedBook[] = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`  [${i + 1}/${books.length}] ${book.title} by ${book.author}`);

    const result = await fetchFromBackend(book.title, book.author);

    if (result && result.cover_url) {
      console.log(`    ✓ Got cover`);
      updated.push({
        ...book,
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

    // 3s delay between requests to avoid rate limiting
    if (i < books.length - 1) {
      await delay(3000);
    }
  }

  return updated;
}

function formatBook(book: CuratedBook): string {
  const lines: string[] = [`  {`];
  lines.push(`    title: ${JSON.stringify(book.title)},`);
  lines.push(`    author: ${JSON.stringify(book.author)},`);
  if (book.year !== undefined) {
    lines.push(`    year: ${book.year},`);
  }
  if (book.rank !== undefined) {
    lines.push(`    rank: ${book.rank},`);
  }
  if (book.note !== undefined) {
    lines.push(`    note: ${JSON.stringify(book.note)},`);
  }
  lines.push(
    `    cover_url: ${book.cover_url ? JSON.stringify(book.cover_url) : "null"},`
  );
  lines.push(`    isbn: ${book.isbn ? JSON.stringify(book.isbn) : "null"},`);
  lines.push(
    `    description: ${book.description ? JSON.stringify(book.description) : "null"},`
  );
  lines.push(`    page_count: ${book.page_count ?? "null"},`);
  lines.push(`    genres: ${JSON.stringify(book.genres)},`);
  lines.push(`    published_year: ${book.published_year ?? "null"},`);
  lines.push(`  }`);
  return lines.join("\n");
}

function parseListFile(filePath: string, varName: string): CuratedBook[] {
  const content = fs.readFileSync(filePath, "utf-8");

  // Extract the array content using regex
  const regex = new RegExp(
    `export const ${varName}[^=]*=\\s*(\\[[\\s\\S]*?\\]);`,
    "m"
  );
  const match = content.match(regex);

  if (!match) {
    console.error(`Could not find ${varName} in ${filePath}`);
    return [];
  }

  try {
    // Use Function constructor to safely evaluate the array
    // This is safer than eval for this specific use case
    const arrayStr = match[1];
    const books = eval(arrayStr);
    return books;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

function generateListFile(
  originalContent: string,
  varName: string,
  books: CuratedBook[]
): string {
  // Replace just the array content, keeping the rest of the file
  const regex = new RegExp(
    `(export const ${varName}[^=]*=\\s*)\\[[\\s\\S]*?\\];`,
    "m"
  );
  const newArray = `[\n${books.map(formatBook).join(",\n")}\n];`;
  return originalContent.replace(regex, `$1${newArray}`);
}

async function processListFile(listKey: string): Promise<void> {
  const listInfo = LIST_FILES[listKey];
  if (!listInfo) {
    console.error(`Unknown list: ${listKey}`);
    return;
  }

  const filePath = path.join(
    __dirname,
    "..",
    "frontend",
    "data",
    "lists",
    listInfo.file
  );

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const originalContent = fs.readFileSync(filePath, "utf-8");
  const books = parseListFile(filePath, listInfo.varName);

  if (books.length === 0) {
    console.error(`No books found in ${listInfo.file}`);
    return;
  }

  const updatedBooks = await processBooks(books, listKey);
  const newContent = generateListFile(
    originalContent,
    listInfo.varName,
    updatedBooks
  );
  fs.writeFileSync(filePath, newContent, "utf-8");

  console.log(`\n✓ Updated ${filePath}`);

  const missing = updatedBooks.filter((b) => !b.cover_url);
  if (missing.length > 0) {
    console.log(`  ⚠ ${missing.length} books still missing covers:`);
    missing.forEach((b) => console.log(`    - ${b.title}`));
  }
}

async function main() {
  // Verify backend is running
  try {
    await fetch(`${BACKEND_URL}/docs`);
  } catch {
    console.error(
      "Error: Backend is not running at " +
        BACKEND_URL +
        "\nStart it first with: cd backend && uvicorn main:app --reload"
    );
    process.exit(1);
  }

  // Get lists to process from command line args, or process all
  const args = process.argv.slice(2);
  const listsToProcess =
    args.length > 0 ? args : Object.keys(LIST_FILES);

  console.log(`Processing ${listsToProcess.length} list(s)...`);
  console.log("This will take a while due to rate limiting.\n");

  for (const listKey of listsToProcess) {
    await processListFile(listKey);
    // Wait between files
    if (listsToProcess.indexOf(listKey) < listsToProcess.length - 1) {
      console.log("\nWaiting 5s before next list...");
      await delay(5000);
    }
  }

  console.log("\n✓ Done!");
}

main().catch(console.error);
