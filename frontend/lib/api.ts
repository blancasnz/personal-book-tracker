import axios from 'axios';

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