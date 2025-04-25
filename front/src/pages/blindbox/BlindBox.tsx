import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blindboxService, BlindBoxDetail, PurchaseResponse, OpenBoxResponse, ProductDTO } from '@/lib/blindbox';
import { BlindBoxDetailDisplay } from './BlindBoxDetail';
import { BlindBoxOpenDisplay } from './BlindBoxOpen';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { AxiosError } from 'axios';

type PurchaseStatus = 'idle' | 'pending' | 'success' | 'error';

export default function BlindBoxPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [boxDetail, setBoxDetail] = useState<BlindBoxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('idle');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [openingResult, setOpeningResult] = useState<ProductDTO | null>(null);

  useEffect(() => {
    const fetchBoxDetail = async () => {
      if (!id) {
        setError('无效的盲盒ID');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setPurchaseStatus('idle');
      setOpeningResult(null);
      setIsPurchasing(false);
      setIsOpening(false);
      try {
        const detail = await blindboxService.getBlindBox(id);
        setBoxDetail(detail);
      } catch (err) {
        console.error('获取盲盒详情失败:', err);
        setError('无法加载盲盒详情，请稍后再试或检查ID是否正确。');
        setBoxDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBoxDetail();
  }, [id]);

  const handlePurchase = async () => {
    if (!id || !boxDetail || boxDetail.status !== 'active') return;

    setIsPurchasing(true);
    setPurchaseStatus('pending');
    try {
      const purchaseData = await blindboxService.purchaseBlindBox(id);
      toast.success(`购买请求已提交！订单号: ${purchaseData.order_id}`, {
        description: `状态: ${purchaseData.status}, 价格: ${purchaseData.price}`,
      });
      setPurchaseStatus('success');
    } catch (err: any) {
      console.error('购买盲盒失败:', err);
      const errorMsg = err.response?.data?.details || err.message || '购买过程中发生错误';
      toast.error('购买盲盒失败', { description: errorMsg });
      setPurchaseStatus('error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleOpen = async () => {
    if (!id || purchaseStatus !== 'success') return;

    setIsOpening(true);
    setOpeningResult(null);
    try {
      const openData = await blindboxService.openBlindBox(id);
      setOpeningResult(openData.product_info);
      toast.success(`成功开启盲盒！获得了: ${openData.product_name}`);
      try {
        const updatedDetail = await blindboxService.getBlindBox(id);
        setBoxDetail(updatedDetail);
      } catch (refreshError) {
        console.error("刷新盲盒状态失败:", refreshError);
      }
    } catch (err: any) {
      console.error('开启盲盒失败:', err);
      const errorMsg = err.response?.data?.details || err.message || '开启过程中发生错误';
      toast.error('开启盲盒失败', { description: errorMsg });
      setOpeningResult(null);
    } finally {
      setIsOpening(false);
    }
  };

  const handleReset = () => {
    setOpeningResult(null);
    setPurchaseStatus('idle');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-6 w-1/4 mt-4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>加载错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!boxDetail) {
    return (
      <div className="container mx-auto py-8">
        <p>未找到盲盒信息。</p>
      </div>
    );
  }

  const canPurchase = boxDetail.status === 'active' && purchaseStatus !== 'success';
  const canOpen = purchaseStatus === 'success' && !openingResult;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <BlindBoxDetailDisplay
        box={boxDetail}
        onPurchase={handlePurchase}
        isPurchasing={isPurchasing}
        canPurchase={canPurchase}
      />
      
      {purchaseStatus === 'success' && (
        <BlindBoxOpenDisplay
          productInfo={openingResult}
          isOpening={isOpening}
          onOpen={handleOpen}
          onReset={handleReset}
        />
      )}
    </div>
  );
}