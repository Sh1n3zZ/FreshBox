import { Suspense } from 'react';
import { BoxList } from '@/components/box/BoxList';
import { BoxListSkeleton } from '@/components/box/BoxListSkeleton';

export const metadata = {
  title: '盲盒列表 | FreshBox',
  description: '发现临期食品盲盒，为环保助力',
};

export default function BoxesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">发现盲盒</h1>
      <Suspense fallback={<BoxListSkeleton />}>
        <BoxList />
      </Suspense>
    </main>
  );
} 