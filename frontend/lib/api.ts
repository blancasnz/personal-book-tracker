import axios from 'axios';
import { 
  Book, 
  BookCreate, 
  BookList, 
  BookListCreate, 
  BookListUpdate,
  BookListSummary, 
  BookListItemCreate,
  BookListItemUpdate 
} from '@/types';
import { ReadingStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Search
export const searchExternalBooks = async (query: string, maxResults: number = 20) => {
  const response = await apiClient.get('/search/external', {
    params: { q: query, max_results: maxResults }
  });
  return response.data;
};

export const addExternalBookToDb = async (book: BookCreate): Promise<Book> => {
  const response = await apiClient.post('/search/external/add', book);
  return response.data;
};

// Books
export const getBooks = async (): Promise<Book[]> => {
  const response = await apiClient.get('/books/');
  return response.data;
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  const response = await apiClient.get('/books/search', {
    params: { q: query }
  });
  return response.data;
};

// Lists
export const getLists = async (): Promise<BookListSummary[]> => {
  const response = await apiClient.get('/lists/');
  return response.data;
};

export const getList = async (
  listId: number,
  sortOrder?: string
): Promise<BookList> => {
  const params = new URLSearchParams();
  if (sortOrder) params.append('sort_order', sortOrder);
  
  const response = await apiClient.get(
    `/lists/${listId}${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
};

export const createList = async (list: BookListCreate): Promise<BookList> => {
  const response = await apiClient.post('/lists/', list);
  return response.data;
};

export const updateList = async (listId: number, list: BookListUpdate): Promise<BookList> => {
  const response = await apiClient.patch(`/lists/${listId}`, list);
  return response.data;
};

export const addBookToList = async (listId: number, item: BookListItemCreate) => {
  const response = await apiClient.post(`/lists/${listId}/books`, item);
  return response.data;
};

export const updateBookInList = async (
  listId: number, 
  bookId: number, 
  update: BookListItemUpdate
) => {
  const response = await apiClient.patch(`/lists/${listId}/books/${bookId}`, update);
  return response.data;
};

export const removeBookFromList = async (listId: number, bookId: number) => {
  await apiClient.delete(`/lists/${listId}/books/${bookId}`);
};

export const deleteList = async (listId: number) => {
  await apiClient.delete(`/lists/${listId}`);
};

export const getCurrentlyReading = async () => {
  const response = await apiClient.get('/lists/currently-reading');
  return response.data;
};

export const moveBookStatus = async (
  listId: number, 
  bookId: number, 
  newStatus: ReadingStatus
) => {
  const response = await apiClient.post(
    `/lists/${listId}/books/${bookId}/move-status?new_status=${newStatus}`
  );
  return response.data;
};

export const getRandomBook = async (
  listId: number,
  filters?: {
    status?: ReadingStatus;
    max_pages?: number;
    min_pages?: number;
  }
) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.max_pages) params.append('max_pages', filters.max_pages.toString());
  if (filters?.min_pages) params.append('min_pages', filters.min_pages.toString());
  
  const response = await apiClient.get(
    `/lists/${listId}/random${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
};