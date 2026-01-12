import axios from 'axios';
import { Book, BookCreate, BookList, BookListCreate, BookListSummary, BookListItemCreate } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check function to test connection
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const testDatabase = async () => {
  const response = await apiClient.get('/test-db');
  return response.data;
};

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

export const getList = async (listId: number): Promise<BookList> => {
  const response = await apiClient.get(`/lists/${listId}`);
  return response.data;
};

export const createList = async (list: BookListCreate): Promise<BookList> => {
  const response = await apiClient.post('/lists/', list);
  return response.data;
};

export const addBookToList = async (listId: number, item: BookListItemCreate) => {
  const response = await apiClient.post(`/lists/${listId}/books`, item);
  return response.data;
};

export const removeBookFromList = async (listId: number, bookId: number) => {
  await apiClient.delete(`/lists/${listId}/books/${bookId}`);
};

export const deleteList = async (listId: number) => {
  await apiClient.delete(`/lists/${listId}`);
};