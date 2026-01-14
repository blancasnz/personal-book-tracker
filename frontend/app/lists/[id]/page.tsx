'use client';

import { use } from 'react';
import Link from 'next/link';
import ListDetail from '@/components/lists/ListDetail';

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const listId = parseInt(id);

  if (isNaN(listId)) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            Invalid list ID
          </div>
          <Link href="/lists" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Lists
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/lists"
            className="text-blue-600 hover:underline"
          >
            ← Back to All Lists
          </Link>
        </div>

        <ListDetail listId={listId} />
      </div>
    </main>
  );
}