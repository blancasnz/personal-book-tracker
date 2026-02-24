/**
 * Central export for all curated book lists.
 *
 * This file defines the CuratedBook interface and exports all list data
 * for use across the application.
 */

export interface CuratedBook {
  title: string;
  author: string;
  year?: number; // Award year (optional for "best of" lists)
  cover_url: string | null;
  isbn: string | null;
  description: string | null;
  page_count: number | null;
  genres: string[];
  published_year: number | null;
  rank?: number; // For ranked lists like TIME 100
  note?: string; // For series info or other notes
}

// Import award winners
import { PULITZER_WINNERS } from "./pulitzerPrize";
import { BOOKER_WINNERS } from "./bookerPrize";

// Import new award lists
import { HUGO_WINNERS } from "./hugoWinners";
import { NEBULA_WINNERS } from "./nebulaWinners";
import { NATIONAL_BOOK_AWARD_WINNERS } from "./nationalBookAward";
// Import "best of" lists
import { NYT_21ST_CENTURY_READERS } from "./nyt21stCentury";
import { NYT_21ST_CENTURY_CRITICS } from "./nyt21stCenturyCritics";
import { NPR_SCIFI_FANTASY } from "./nprSciFiFantasy";
import { NPR_THRILLERS } from "./nprThrillers";

// Import book club lists
import { OPRAH_BOOK_CLUB_2020S } from "./oprahBookClub2020s";
import { OPRAH_BOOK_CLUB_2010S } from "./oprahBookClub2010s";
import { OPRAH_BOOK_CLUB_2000S } from "./oprahBookClub2000s";
import { REESE_BOOK_CLUB_2023 } from "./reeseBookClub2023";
import { REESE_BOOK_CLUB_2020 } from "./reeseBookClub2020";
import { REESE_BOOK_CLUB_2017 } from "./reeseBookClub2017";
import { DUA_LIPA_BOOK_CLUB_2023 } from "./duaLipaBookClub2023";
import { DUA_LIPA_BOOK_CLUB_2024 } from "./duaLipaBookClub2024";
import { DUA_LIPA_BOOK_CLUB_2025 } from "./duaLipaBookClub2025";
import { DUA_LIPA_BOOK_CLUB_2026 } from "./duaLipaBookClub2026";

// Import genre award lists
import { BRAM_STOKER_WINNERS } from "./bramStoker";
import { LOCUS_FANTASY_WINNERS } from "./locusFantasy";
import { AGATHA_WINNERS } from "./agathaAwards";
import { WORLD_FANTASY_WINNERS } from "./worldFantasy";

export const CURATED_LISTS: Record<string, CuratedBook[]> = {
  // Major Literary Awards
  pulitzer: PULITZER_WINNERS,
  booker: BOOKER_WINNERS,
  hugo: HUGO_WINNERS,
  nebula: NEBULA_WINNERS,
  "national-book-award": NATIONAL_BOOK_AWARD_WINNERS,

  // Best Of All Time
  "nyt-21st-century-readers": NYT_21ST_CENTURY_READERS,
  "nyt-21st-century-critics": NYT_21ST_CENTURY_CRITICS,
  "npr-scifi-fantasy": NPR_SCIFI_FANTASY,
  "npr-thrillers": NPR_THRILLERS,

  // Book Clubs & Picks
  oprah: [...OPRAH_BOOK_CLUB_2020S, ...OPRAH_BOOK_CLUB_2010S, ...OPRAH_BOOK_CLUB_2000S],
  "oprah-2020s": OPRAH_BOOK_CLUB_2020S,
  "oprah-2010s": OPRAH_BOOK_CLUB_2010S,
  "oprah-2000s": OPRAH_BOOK_CLUB_2000S,
  reese: [...REESE_BOOK_CLUB_2023, ...REESE_BOOK_CLUB_2020, ...REESE_BOOK_CLUB_2017],
  "reese-2023": REESE_BOOK_CLUB_2023,
  "reese-2020": REESE_BOOK_CLUB_2020,
  "reese-2017": REESE_BOOK_CLUB_2017,
  "dua-lipa": [...DUA_LIPA_BOOK_CLUB_2026, ...DUA_LIPA_BOOK_CLUB_2025, ...DUA_LIPA_BOOK_CLUB_2024, ...DUA_LIPA_BOOK_CLUB_2023],
  "dua-lipa-2026": DUA_LIPA_BOOK_CLUB_2026,
  "dua-lipa-2025": DUA_LIPA_BOOK_CLUB_2025,
  "dua-lipa-2024": DUA_LIPA_BOOK_CLUB_2024,
  "dua-lipa-2023": DUA_LIPA_BOOK_CLUB_2023,

  // Genre Awards
  "bram-stoker": BRAM_STOKER_WINNERS,
  "locus-fantasy": LOCUS_FANTASY_WINNERS,
  agatha: AGATHA_WINNERS,
  "world-fantasy": WORLD_FANTASY_WINNERS,
};

// Re-export individual lists for direct imports
export {
  PULITZER_WINNERS,
  BOOKER_WINNERS,
  HUGO_WINNERS,
  NEBULA_WINNERS,
  NATIONAL_BOOK_AWARD_WINNERS,
  NYT_21ST_CENTURY_READERS,
  NYT_21ST_CENTURY_CRITICS,
  NPR_SCIFI_FANTASY,
  NPR_THRILLERS,
  OPRAH_BOOK_CLUB_2020S,
  OPRAH_BOOK_CLUB_2010S,
  OPRAH_BOOK_CLUB_2000S,
  REESE_BOOK_CLUB_2023,
  REESE_BOOK_CLUB_2020,
  REESE_BOOK_CLUB_2017,
  DUA_LIPA_BOOK_CLUB_2023,
  DUA_LIPA_BOOK_CLUB_2024,
  DUA_LIPA_BOOK_CLUB_2025,
  DUA_LIPA_BOOK_CLUB_2026,
  BRAM_STOKER_WINNERS,
  LOCUS_FANTASY_WINNERS,
  AGATHA_WINNERS,
  WORLD_FANTASY_WINNERS,
};
