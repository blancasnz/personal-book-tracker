'use client';

import Link from 'next/link';
import { BookListSummary } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteList } from '@/lib/api';

interface ListCardProps {
  list: BookListSummary;
}

export default function ListCard({ list }: ListCardProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteList(list.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
    onError: (error) => {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to list detail
    if (confirm(`Are you sure you want to delete "${list.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <Link
      href={`/lists/${list.id}`}
      className="block border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold">{list.name}</h3>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-red-600 hover:text-red-800 text-sm disabled:text-gray-400"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {list.description && (
        <p className="text-gray-600 mb-3">{list.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>📚 {list.item_count} {list.item_count === 1 ? 'book' : 'books'}</span>
        <span>{new Date(list.created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}