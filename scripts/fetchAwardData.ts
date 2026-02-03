/**
 * One-time script to fetch award winner book data from Google Books API
 * and generate a static data file for the frontend.
 *
 * Run with: npx ts-node scripts/fetchAwardData.ts
 * Or: npx tsx scripts/fetchAwardData.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Pulitzer Prize for Fiction Winners (2000-2025)
const PULITZER_WINNERS_BASE = [
  { title: "James", author: "Percival Everett", year: 2025 },
  { title: "Night Watch", author: "Jayne Anne Phillips", year: 2024 },
  { title: "Demon Copperhead", author: "Barbara Kingsolver", year: 2023 },
  { title: "The Netanyahus", author: "Joshua Cohen", year: 2022 },
  { title: "The Night Watchman", author: "Louise Erdrich", year: 2021 },
  { title: "The Nickel Boys", author: "Colson Whitehead", year: 2020 },
  { title: "The Overstory", author: "Richard Powers", year: 2019 },
  { title: "Less", author: "Andrew Sean Greer", year: 2018 },
  { title: "The Underground Railroad", author: "Colson Whitehead", year: 2017 },
  { title: "The Sympathizer", author: "Viet Thanh Nguyen", year: 2016 },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", year: 2015 },
  { title: "The Goldfinch", author: "Donna Tartt", year: 2014 },
  { title: "The Orphan Master's Son", author: "Adam Johnson", year: 2013 },
  { title: "A Visit from the Goon Squad", author: "Jennifer Egan", year: 2011 },
  { title: "Tinkers", author: "Paul Harding", year: 2010 },
  { title: "Olive Kitteridge", author: "Elizabeth Strout", year: 2009 },
  { title: "The Brief Wondrous Life of Oscar Wao", author: "Junot Díaz", year: 2008 },
  { title: "The Road", author: "Cormac McCarthy", year: 2007 },
  { title: "March", author: "Geraldine Brooks", year: 2006 },
  { title: "Gilead", author: "Marilynne Robinson", year: 2005 },
  { title: "The Known World", author: "Edward P. Jones", year: 2004 },
  { title: "Middlesex", author: "Jeffrey Eugenides", year: 2003 },
  { title: "Empire Falls", author: "Richard Russo", year: 2002 },
  { title: "The Amazing Adventures of Kavalier & Clay", author: "Michael Chabon", year: 2001 },
  { title: "Interpreter of Maladies", author: "Jhumpa Lahiri", year: 2000 },
];

// Booker Prize Winners (2000-2025)
const BOOKER_WINNERS_BASE = [
  { title: "Flesh", author: "David Szalay", year: 2025 },
  { title: "Orbital", author: "Samantha Harvey", year: 2024 },
  { title: "Prophet Song", author: "Paul Lynch", year: 2023 },
  { title: "The Seven Moons of Maali Almeida", author: "Shehan Karunatilaka", year: 2022 },
  { title: "The Promise", author: "Damon Galgut", year: 2021 },
  { title: "Shuggie Bain", author: "Douglas Stuart", year: 2020 },
  { title: "The Testaments", author: "Margaret Atwood", year: 2019 },
  { title: "Girl, Woman, Other", author: "Bernardine Evaristo", year: 2019 },
  { title: "Milkman", author: "Anna Burns", year: 2018 },
  { title: "Lincoln in the Bardo", author: "George Saunders", year: 2017 },
  { title: "The Sellout", author: "Paul Beatty", year: 2016 },
  { title: "A Brief History of Seven Killings", author: "Marlon James", year: 2015 },
  { title: "The Narrow Road to the Deep North", author: "Richard Flanagan", year: 2014 },
  { title: "The Luminaries", author: "Eleanor Catton", year: 2013 },
  { title: "Bring Up the Bodies", author: "Hilary Mantel", year: 2012 },
  { title: "The Sense of an Ending", author: "Julian Barnes", year: 2011 },
  { title: "Wolf Hall", author: "Hilary Mantel", year: 2009 },
  { title: "The White Tiger", author: "Aravind Adiga", year: 2008 },
  { title: "The Gathering", author: "Anne Enright", year: 2007 },
  { title: "The Inheritance of Loss", author: "Kiran Desai", year: 2006 },
  { title: "The Sea", author: "John Banville", year: 2005 },
  { title: "The Line of Beauty", author: "Alan Hollinghurst", year: 2004 },
  { title: "Vernon God Little", author: "DBC Pierre", year: 2003 },
  { title: "Life of Pi", author: "Yann Martel", year: 2002 },
  { title: "True History of the Kelly Gang", author: "Peter Carey", year: 2001 },
  { title: "The Blind Assassin", author: "Margaret Atwood", year: 2000 },
];

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      description?: string;
      pageCount?: number;
      categories?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
      publishedDate?: string;
    };
  }>;
}

interface AwardWinnerBook {
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
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  title: string,
  maxRetries: number = 3
): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      if (response.status === 429) {
        // Rate limited - wait longer and retry
        const waitTime = 2000 * attempt; // Exponential backoff: 2s, 4s, 6s
        console.log(`    Rate limited, waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);
        await delay(waitTime);
        continue;
      }
      console.error(`HTTP error for "${title}": ${response.status}`);
      return null;
    } catch (error) {
      console.error(`Network error for "${title}" (attempt ${attempt}):`, error);
      if (attempt < maxRetries) {
        await delay(1000 * attempt);
      }
    }
  }
  return null;
}

async function fetchBookData(title: string, author: string): Promise<Partial<AwardWinnerBook>> {
  const query = encodeURIComponent(`${title} ${author}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;

  try {
    const response = await fetchWithRetry(url, title);
    if (!response) {
      return {};
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn(`No results for "${title}" by ${author}`);
      return {};
    }

    const book = data.items[0].volumeInfo;

    // Get ISBN (prefer ISBN_13)
    const isbn = book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
      || book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier
      || null;

    // Get cover URL (upgrade to higher quality)
    let coverUrl = book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || null;
    if (coverUrl) {
      // Remove zoom parameter and use https
      coverUrl = coverUrl.replace('http://', 'https://').replace('&edge=curl', '');
    }

    // Extract year from published date
    const publishedYear = book.publishedDate
      ? parseInt(book.publishedDate.split('-')[0], 10)
      : null;

    return {
      cover_url: coverUrl,
      isbn,
      description: book.description || null,
      page_count: book.pageCount || null,
      genres: book.categories || [],
      published_year: publishedYear,
    };
  } catch (error) {
    console.error(`Error fetching "${title}":`, error);
    return {};
  }
}

async function fetchAllBooks(
  winners: Array<{ title: string; author: string; year: number }>,
  awardName: string
): Promise<AwardWinnerBook[]> {
  const results: AwardWinnerBook[] = [];

  console.log(`\nFetching ${awardName} winners (${winners.length} books)...`);

  for (let i = 0; i < winners.length; i++) {
    const winner = winners[i];
    console.log(`  [${i + 1}/${winners.length}] ${winner.title} by ${winner.author}`);

    const bookData = await fetchBookData(winner.title, winner.author);

    results.push({
      title: winner.title,
      author: winner.author,
      year: winner.year,
      cover_url: bookData.cover_url || null,
      isbn: bookData.isbn || null,
      description: bookData.description || null,
      page_count: bookData.page_count || null,
      genres: bookData.genres || [],
      published_year: bookData.published_year || null,
    });

    // Rate limit protection: wait 1500ms between requests
    if (i < winners.length - 1) {
      await delay(1500);
    }
  }

  return results;
}

function generateTypeScriptFile(
  pulitzerWinners: AwardWinnerBook[],
  bookerWinners: AwardWinnerBook[]
): string {
  const formatBook = (book: AwardWinnerBook): string => {
    const lines = [
      `  {`,
      `    title: ${JSON.stringify(book.title)},`,
      `    author: ${JSON.stringify(book.author)},`,
      `    year: ${book.year},`,
      `    cover_url: ${book.cover_url ? JSON.stringify(book.cover_url) : 'null'},`,
      `    isbn: ${book.isbn ? JSON.stringify(book.isbn) : 'null'},`,
      `    description: ${book.description ? JSON.stringify(book.description) : 'null'},`,
      `    page_count: ${book.page_count ?? 'null'},`,
      `    genres: ${JSON.stringify(book.genres)},`,
      `    published_year: ${book.published_year ?? 'null'},`,
      `  }`,
    ];
    return lines.join('\n');
  };

  return `/**
 * Static data for award-winning books.
 * Generated by scripts/fetchAwardData.ts
 *
 * This file contains pre-fetched book data to avoid rate limiting issues
 * with the Google Books API. Award winners are static data that only
 * changes once per year, so there's no need for dynamic fetching.
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
${pulitzerWinners.map(formatBook).join(',\n')}
];

// Booker Prize Winners (2000-2025)
export const BOOKER_WINNERS: AwardWinnerBook[] = [
${bookerWinners.map(formatBook).join(',\n')}
];
`;
}

async function main() {
  console.log('Starting award data fetch...');
  console.log('This will take a few minutes due to rate limiting.\n');

  // Fetch Pulitzer winners
  const pulitzerWinners = await fetchAllBooks(PULITZER_WINNERS_BASE, 'Pulitzer Prize');

  // Fetch Booker winners
  const bookerWinners = await fetchAllBooks(BOOKER_WINNERS_BASE, 'Booker Prize');

  // Generate TypeScript file
  const tsContent = generateTypeScriptFile(pulitzerWinners, bookerWinners);

  // Write to frontend/data/awardWinners.ts
  const outputPath = path.join(__dirname, '..', 'frontend', 'data', 'awardWinners.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');

  console.log(`\n✓ Successfully wrote data to ${outputPath}`);
  console.log(`  - ${pulitzerWinners.length} Pulitzer winners`);
  console.log(`  - ${bookerWinners.length} Booker winners`);

  // Summary of books with missing covers
  const missingCovers = [
    ...pulitzerWinners.filter(b => !b.cover_url).map(b => `Pulitzer: ${b.title}`),
    ...bookerWinners.filter(b => !b.cover_url).map(b => `Booker: ${b.title}`),
  ];

  if (missingCovers.length > 0) {
    console.log(`\n⚠ Books with missing covers:`);
    missingCovers.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
