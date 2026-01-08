export interface HealthCheck {
  status: string;
}

// Book types
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string | null;
  cover_url?: string | null;
  description?: string | null;
  published_year?: number | null;
  page_count?: number | null;
}

export interface BookCreate {
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  description?: string;
  published_year?: number;
  page_count?: number;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  description?: string;
  published_year?: number;
  page_count?: number;
}

// List types
export interface BookListItem {
  id: number;
  book_list_id: number;
  book_id: number;
  added_at: string;
  notes?: string | null;
  book: Book;
}

export interface BookList {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  items: BookListItem[];
}

export interface BookListSummary {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  item_count: number;
}

export interface BookListCreate {
  name: string;
  description?: string;
}

export interface BookListUpdate {
  name?: string;
  description?: string;
}

export interface BookListItemCreate {
  book_id: number;
  notes?: string;
}
