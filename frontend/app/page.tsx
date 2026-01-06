'use client';

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
      <h1 className="text-4xl font-bold mb-8">Book Tracker</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Status:</h2>
          {healthQuery.isLoading && <p>Checking...</p>}
          {healthQuery.error && <p className="text-red-600">Error: {String(healthQuery.error)}</p>}
          {healthQuery.data && (
            <p className="text-green-600">✓ API: {healthQuery.data.status}</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Database Status:</h2>
          {dbQuery.isLoading && <p>Checking...</p>}
          {dbQuery.error && <p className="text-red-600">Error: {String(dbQuery.error)}</p>}
          {dbQuery.data && (
            <div className="text-green-600">
              <p>✓ Database: {dbQuery.data.database}</p>
              <p>📚 Books: {dbQuery.data.books}</p>
              <p>📋 Lists: {dbQuery.data.lists}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}