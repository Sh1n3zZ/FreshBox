import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { BoxDetail } from '@/components/box/BoxDetail';
import { BoxDetailSkeleton } from '@/components/box/BoxDetailSkeleton';
import { APIClient } from '@/lib/api/client';

interface BoxPageProps {
  params: {
    id: string;
  };
}

async function getBoxDetail(id: string) {
  try {
    const api = APIClient.getInstance();
    const response = await api.client.get(`/api/boxes/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: BoxPageProps) {
  const box = await getBoxDetail(params.id);
  if (!box) {
    return {
      title: '盲盒不存在 | FreshBox',
    };
  }

  return {
    title: `${box.name} | FreshBox盲盒`,
    description: box.description,
  };
}

export default async function BoxPage({ params }: BoxPageProps) {
  const box = await getBoxDetail(params.id);

  if (!box) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<BoxDetailSkeleton />}>
        <BoxDetail box={box} />
      </Suspense>
    </main>
  );
} 