'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { checkHealth, testDatabase } from '@/lib/api';

export default function Home() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
  });

  const dbQuery = useQuery({
    queryKey: ['database'],
    queryFn: testDatabase,
  });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Book Tracker</h1>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/search"
            className="p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">🔍 Search Books</h2>
            <p className="text-gray-600">Find books and add them to your library</p>
          </Link>

          <Link
            href="/lists"
            className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">📋 My Lists</h2>
            <p className="text-gray-600">Manage your reading lists</p>
          </Link>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">API Status:</h2>
            {healthQuery.isLoading && <p>Checking...</p>}
            {healthQuery.error && (
              <p className="text-red-600">Error: {String(healthQuery.error)}</p>
            )}
            {healthQuery.data && (
              <p className="text-green-600">✓ API: {healthQuery.data.status}</p>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Database Status:</h2>
            {dbQuery.isLoading && <p>Checking...</p>}
            {dbQuery.error && (
              <p className="text-red-600">Error: {String(dbQuery.error)}</p>
            )}
            {dbQuery.data && (
              <div className="text-green-600">
                <p>✓ Database: {dbQuery.data.database}</p>
                <p>📚 Books: {dbQuery.data.books}</p>
                <p>📋 Lists: {dbQuery.data.lists}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}