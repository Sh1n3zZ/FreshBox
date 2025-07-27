import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Pencil, Eye } from "lucide-react";
import { format, addDays } from "date-fns";
import { blindboxService, BlindBox, BlindBoxInputData } from '@/lib/blindbox';
import { Product } from '@/lib/product';
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { CreateBoxUploadBlindboxCover } from "@/components/CreateBoxUploadBlindboxCover";
import { CreateBoxAddProductlList } from "@/components/CreateBoxAddProductlList";

interface CreateBoxProps {
  onBoxCreated?: (newBox: BlindBox) => void;
  box?: BlindBox;
  readOnly?: boolean;
}

const boxFormSchema = z.object({
  name: z.string().min(2, { message: "名称至少需要2个字符。" }),
  description: z.string().optional(),
  discountCoefficient: z.coerce.number()
    .min(0.1, { message: "折扣系数必须大于0.1" })
    .max(1, { message: "折扣系数不能大于1" }),
  category: z.string().min(1, { message: "请选择一个类别。" }),
  imageURL: z.string()
    .refine((val) => {
      if (!val) return true;
      return val.startsWith('http') || val.startsWith('/static/uploads/');
    }, { message: "请输入有效的图片URL或上传图片。" })
    .optional()
    .or(z.literal('')),
  expirationTime: z.date({ required_error: "请选择过期日期。" }),
  donationAmount: z.coerce.number().min(0, { message: "捐赠金额不能为负数。" }).optional(),
});

type BoxFormValues = z.infer<typeof boxFormSchema>;

export function CreateBox({ onBoxCreated, box, readOnly = false }: CreateBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [boxProducts, setBoxProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // 如果是编辑模式，获取盲盒中已有的产品
          if (box) {
            const boxDetail = await blindboxService.getBlindBox(box.id);
            setBoxProducts(boxDetail.products || []);
            setSelectedProducts(boxDetail.products || []);
          }
        } catch (error) {
          toast.error("加载数据失败");
          console.error('加载数据失败:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, box]);

  const form = useForm<BoxFormValues>({
    resolver: zodResolver(boxFormSchema),
    defaultValues: {
      name: box?.name || "",
      description: box?.description || "",
      discountCoefficient: box?.discountCoefficient || 0.8,
      category: box?.category || "",
      imageURL: box?.imageUrl || "",
      expirationTime: box?.expirationTime ? new Date(box.expirationTime) : addDays(new Date(), 3),
      donationAmount: box?.donationAmount || 0,
    },
  });

  const onSubmit = async (values: BoxFormValues) => {
    if (readOnly) return;
    
    setIsSubmitting(true);
    try {
      const boxData: BlindBoxInputData = {
        name: values.name,
        description: values.description,
        discountCoefficient: values.discountCoefficient,
        category: values.category,
        imageURL: values.imageURL,
        expirationTime: format(values.expirationTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        donationAmount: values.donationAmount,
      };

      let newBox;
      if (box) {
        // 更新盲盒
        newBox = await blindboxService.updateBlindBox(box.id, boxData);
        toast.success("盲盒更新成功。", { id: 'update-box-success' });
        
        // 更新盲盒中的产品
        // 首先获取当前盲盒中已有的产品ID
        const currentProductIds = boxProducts.map(p => p.id);
        // 获取用户选择的产品ID
        const selectedProductIds = selectedProducts.map(p => p.id);
        
        // 需要添加的产品：在选择的但不在当前盲盒中的
        const productsToAdd = selectedProductIds.filter(id => !currentProductIds.includes(id));
        // 需要移除的产品：在当前盲盒中但不在选择的中的
        const productsToRemove = currentProductIds.filter(id => !selectedProductIds.includes(id));
        
        // 批量添加产品到盲盒
        if (productsToAdd.length > 0) {
          await blindboxService.batchAddProductsToBlindBox(productsToAdd, box.id);
        }
        
        // 逐个移除产品
        for (const productId of productsToRemove) {
          await blindboxService.removeProductFromBlindBox(productId);
        }
      } else {
        // 创建盲盒
        newBox = await blindboxService.createBlindBox(boxData);
        toast.success("盲盒创建成功。", { id: 'create-box-success' });
        
        // 如果选择了产品，批量添加到盲盒
        if (selectedProducts.length > 0) {
          const productIds = selectedProducts.map(p => p.id);
          await blindboxService.batchAddProductsToBlindBox(productIds, newBox.id);
        }
      }
      
      setIsOpen(false);
      form.reset();
      onBoxCreated?.(newBox);
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message;
      toast.error(`${box ? '更新' : '创建'}盲盒失败: ${errorMsg}`, { id: 'box-error' });
      console.error(`${box ? '更新' : '创建'}盲盒失败:`, error.response || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    if (readOnly) return;
    setSelectedProducts(prev => [...prev, product]);
  };

  const handleDeselectProduct = (product: Product) => {
    if (readOnly) return;
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
  };

  const calculateBoxTotal = () => {
    const regularTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
    const discountCoefficient = form.watch('discountCoefficient') || 0.8;
    const discountedTotal = regularTotal * discountCoefficient;
    return { regularTotal, discountedTotal };
  };

  const { regularTotal, discountedTotal } = calculateBoxTotal();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {box ? (
          readOnly ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">查看</span>
              <Eye className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">编辑</span>
              <Pencil className="h-4 w-4" />
            </Button>
          )
        ) : (
          <Button>创建盲盒</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? '查看盲盒详情' : (box ? '编辑盲盒' : '创建新盲盒')}
          </DialogTitle>
          <DialogDescription>
            {readOnly ? '盲盒详细信息' : (box ? '修改盲盒信息并管理其中的产品。' : '填写以下信息以创建新盲盒，并可选择添加产品到盲盒中。')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="盲盒名称" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>类别 *</FormLabel>
                    {readOnly ? (
                      <Input value={field.value} disabled />
                    ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择类别" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="烘焙">烘焙</SelectItem>
                          <SelectItem value="乳制品">乳制品</SelectItem>
                          <SelectItem value="零食">零食</SelectItem>
                          <SelectItem value="饮品">饮品</SelectItem>
                          <SelectItem value="果蔬">果蔬</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="盲盒描述" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>封面图片</FormLabel>
                  <CreateBoxUploadBlindboxCover value={field.value} onChange={field.onChange} disabled={readOnly} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountCoefficient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>折扣系数 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.1" 
                        max="1" 
                        placeholder="输入0.1-1之间的值" 
                        {...field} 
                        disabled={readOnly} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="donationAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>捐赠金额</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="每售出一个盲盒的捐赠金额" 
                        {...field} 
                        disabled={readOnly} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expirationTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>过期时间 *</FormLabel>
                  {readOnly ? (
                    <Input 
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""} 
                      disabled 
                    />
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "yyyy-MM-dd")
                            ) : (
                              <span>选择日期</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date < new Date() // 禁止选择过去的日期
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-2">盲盒产品</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {readOnly 
                  ? "这个盲盒包含的产品" 
                  : "添加产品到盲盒中。盲盒价格将根据所选产品和折扣系数自动计算。"}
              </p>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <p>加载产品中...</p>
                </div>
              ) : (
                <>
                  {!readOnly && (
                    <div className="mb-4">
                      <CreateBoxAddProductlList
                        availableProducts={[]}
                        selectedProducts={selectedProducts}
                        onSelectProduct={handleSelectProduct}
                        onDeselectProduct={handleDeselectProduct}
                        readOnly={readOnly}
                        isLoading={isLoading}
                      />
                    </div>
                  )}

                  {readOnly && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">盲盒内产品</h4>
                      <ScrollArea className="max-h-64 w-full rounded-md border p-2">
                        {boxProducts.length > 0 ? (
                          boxProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-2 border-b last:border-0">
                              <div className="flex-1">
                                <h5 className="font-medium">{product.name}</h5>
                                <div className="text-sm text-muted-foreground">
                                  <p>{formatCurrency(product.price)}</p>
                                  <p>类别: {product.category}</p>
                                </div>
                              </div>
                              <Badge variant="outline">{product.status}</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground p-1">盲盒中没有产品</p>
                        )}
                      </ScrollArea>
                    </div>
                  )}

                  {!readOnly && (
                    <div className="rounded-md bg-muted p-4 space-y-2">
                      <div className="flex justify-between">
                        <span>产品原价总和:</span>
                        <span>{formatCurrency(regularTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>折扣系数:</span>
                        <span>{form.watch('discountCoefficient') || 0.8}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>盲盒最终价格:</span>
                        <span>{formatCurrency(discountedTotal)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                {readOnly ? "关闭" : "取消"}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (box ? "更新中..." : "创建中...") : (box ? "更新盲盒" : "创建盲盒")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
