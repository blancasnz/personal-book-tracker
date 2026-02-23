export interface ListConfig {
  listType: string;
  title: string;
  badge?: string;
  showYear?: boolean;
  icon?: string;
}

export const TAB_CONFIG: Record<string, ListConfig[]> = {
  awards: [
    { listType: "pulitzer", title: "Pulitzer Prize Winners", showYear: true, icon: "🏆" },
    { listType: "booker", title: "Booker Prize Winners", showYear: true, icon: "🏆" },
    { listType: "hugo", title: "Hugo Award Winners", badge: "Sci-Fi", showYear: true, icon: "🚀" },
    { listType: "nebula", title: "Nebula Award Winners", badge: "Sci-Fi", showYear: true, icon: "✨" },
    { listType: "national-book-award", title: "National Book Award Winners", showYear: true, icon: "📚" },
  ],
  "best-of": [
    { listType: "time-100", title: "TIME's All-Time 100 Novels", badge: "1923-2005", icon: "⏰" },
    { listType: "nyt-21st-century-readers", title: "NYT 100 Best of 21st Century (Readers)", badge: "2000+", icon: "📰" },
    { listType: "nyt-21st-century-critics", title: "NYT 100 Best of 21st Century (Critics)", badge: "2000+", icon: "📰" },
    { listType: "npr-scifi-fantasy", title: "NPR Top 100 Sci-Fi/Fantasy", badge: "Sci-Fi", icon: "🌟" },
    { listType: "npr-thrillers", title: "NPR 100 Killer Thrillers", badge: "Thriller", icon: "🔪" },
  ],
  "book-clubs": [
    { listType: "oprah", title: "Oprah's Book Club", badge: "89 picks", showYear: true, icon: "📖" },
    { listType: "reese", title: "Reese's Book Club", badge: "120 picks", showYear: true, icon: "💛" },
    { listType: "dua-lipa", title: "Dua Lipa's Book Club", badge: "31 picks", showYear: true, icon: "💜" },
  ],
  genre: [
    { listType: "bram-stoker", title: "Bram Stoker Awards", badge: "Horror", showYear: true, icon: "🦇" },
    { listType: "locus-fantasy", title: "Locus Best Fantasy Novel", badge: "Fantasy", showYear: true, icon: "🌌" },
    { listType: "agatha", title: "Agatha Awards", badge: "Mystery", showYear: true, icon: "🔍" },
    { listType: "world-fantasy", title: "World Fantasy Awards", badge: "Fantasy", showYear: true, icon: "🐉" },
  ],
};

