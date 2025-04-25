import { BlindBoxList } from '@/components/BlindBoxList';
import { ProductList } from '@/components/ProductList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBlindBoxView = (id: string) => {
    navigate(`/admin/blind-boxes/${id}`);
  };

  const handleBlindBoxEdit = (id: string) => {
    navigate(`/admin/blind-boxes/${id}/edit`);
  };

  const handleBlindBoxCreate = () => {
    navigate('/admin/blind-boxes/new');
  };

  const handleProductView = (id: string) => {
    navigate(`/admin/products/${id}`);
  };

  const handleProductEdit = (id: string) => {
    navigate(`/admin/products/${id}/edit`);
  };

  const handleProductCreate = () => {
    navigate('/admin/products/new');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {t('dashboard.quickActions.system.title')}
        </h1>
      </div>

      <Tabs defaultValue="blind-boxes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blind-boxes">
            {t('dashboard.quickActions.system.blindBoxes')}
          </TabsTrigger>
          <TabsTrigger value="products">
            {t('dashboard.quickActions.system.products')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blind-boxes">
          <BlindBoxList
            onView={handleBlindBoxView}
            onEdit={handleBlindBoxEdit}
            onCreate={handleBlindBoxCreate}
          />
        </TabsContent>

        <TabsContent value="products">
          <ProductList
            onView={handleProductView}
            onEdit={handleProductEdit}
            onCreate={handleProductCreate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
