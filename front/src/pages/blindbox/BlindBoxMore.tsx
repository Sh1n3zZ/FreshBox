import { useEffect, useState } from 'react';
import { BlindBox } from '@/components/BlindBox';
import { blindboxService, BlindBox as BlindBoxType } from '@/lib/blindbox';
import { Link } from 'react-router-dom';

// This page displays only the blind box list using the BlindBox component.
export default function BlindBoxMore() {
  const [blindBoxes, setBlindBoxes] = useState<BlindBoxType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlindBoxes = async () => {
      try {
        setLoading(true);
        const response = await blindboxService.listBlindBoxes({
          page: 1,
          size: 20, // Show more boxes
          status: 'active',
          sortBy: 'createdAt',
          order: 'desc',
        });
        setBlindBoxes(response.boxes || []);
      } catch (err) {
        console.error('获取盲盒列表失败', err);
        setError('获取盲盒列表失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    fetchBlindBoxes();
  }, []);

  const defaultImageUrl = 'https://placehold.co/400x300?text=盲盒';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">全部盲盒</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-muted-foreground">加载盲盒中...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-destructive">{error}</p>
        </div>
      ) : blindBoxes.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-muted-foreground">暂无盲盒，敬请期待</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blindBoxes.map((box) => (
            <Link to={`/BlindBox/${box.id}`} key={box.id}>
              <BlindBox
                title={box.name}
                imageUrl={box.imageUrl || defaultImageUrl}
                alt={`${box.name} 盲盒图片`}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
