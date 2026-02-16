// Book types (unchanged)
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string | null;
  cover_url?: string | null;
  description?: string | null;
  published_year?: number | null;
  page_count?: number | null;
  genres?: string[];
  format?: string | null;
  edition?: string | null;
}

export interface BookCreate {
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  description?: string;
  published_year?: number;
  page_count?: number;
  genres?: string[];
  format?: string | null;
  edition?: string | null;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  description?: string;
  published_year?: number;
  page_count?: number;
  genres?: string[];
  format?: string;
  edition?: string;
}

// Reading status
export type ReadingStatus = 'to_read' | 'reading' | 'finished';

// List types
export interface BookListItem {
  id: number;
  book_list_id: number;
  book_id: number;
  added_at: string;
  notes?: string | null;
  status: ReadingStatus;
  rating?: number | null;
  is_favorite: number;
  current_page: number;
  book: Book;
}

export interface BookList {
  id: number;
  name: string;
  description?: string | null;
  is_default: number;
  is_public: number;
  created_at: string;
  updated_at?: string | null;
  items: BookListItem[];
}

export interface BookListSummary {
  id: number;
  name: string;
  description?: string | null;
  is_default: number;
  is_public: number;
  created_at: string;
  updated_at?: string | null;
  item_count: number;
}

export interface BookListCreate {
  name: string;
  description?: string;
  is_public?: number;
}

export interface BookListUpdate {
  name?: string;
  description?: string;
  is_public?: number;
}

export interface PublicListSearchResult {
  list_id: number;
  list_name: string;
  list_description?: string | null;
  item_count: number;
  matching_book: Book;
}

export interface BookListItemCreate {
  book_id: number;
  notes?: string;
  status?: ReadingStatus;
  rating?: number;
  is_favorite?: number;
}

export interface BookListItemUpdate {
  notes?: string;
  status?: ReadingStatus;
  rating?: number;
  is_favorite?: number;
  current_page?: number;
}