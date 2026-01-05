'use client';

import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '@/lib/api';

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
  });

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Book Tracker</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">API Connection Status:</h2>
        {isLoading && <p>Checking connection...</p>}
        {error && <p className="text-red-600">Error: {String(error)}</p>}
        {data && (
          <p className="text-green-600">
            ✓ Connected! Status: {data.status}
          </p>
        )}
      </div>
    </main>
  );
}
