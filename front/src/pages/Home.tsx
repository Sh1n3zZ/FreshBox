import { useEffect, useState } from 'react';
import { BlindBox } from '@/components/BlindBox';
import { blindboxService, BlindBox as BlindBoxType } from '@/lib/blindbox';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [blindBoxes, setBlindBoxes] = useState<BlindBoxType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlindBoxes = async () => {
      try {
        setLoading(true);
        const response = await blindboxService.listBlindBoxes({ 
          page: 1, 
          size: 8, 
          status: 'active',
          sortBy: 'createdAt',
          order: 'desc'
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

  const defaultImageUrl = "https://placehold.co/400x300?text=盲盒";

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">精选盲盒</h1>
        <Link to="/NotFound">
          <Button variant="ghost" className="flex items-center">
            查看更多 <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

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
                imageUrl={box.imageURL || defaultImageUrl}
                alt={`${box.name} 盲盒图片`}
              />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">最新优惠活动</h2>
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold mb-4">首次购买，享受9折优惠！</h3>
          <p className="text-muted-foreground mb-6">
            使用优惠码 <span className="font-semibold">FIRSTBOX</span> 获得10%折扣
          </p>
          <Button size="lg">立即选购</Button>
        </div>
      </div>

      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">关于我们的盲盒</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-bold mb-2">优质食品</h3>
            <p className="text-muted-foreground">
              我们精选各种新鲜、优质的食品，确保您每次开启盲盒都是惊喜体验。
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-bold mb-2">惊喜折扣</h3>
            <p className="text-muted-foreground">
              盲盒内的商品总价值通常高于盲盒价格，让您在享受惊喜的同时，也能获得实惠。
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-bold mb-2">公益捐赠</h3>
            <p className="text-muted-foreground">
              每个盲盒的销售都会贡献一部分金额用于公益事业，让购物也能成为一种善行。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
