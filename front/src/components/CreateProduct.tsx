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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { productService, Product, ProductInputData, Manufacturer, Ingredient } from '@/lib/product';
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickCreateManufacturer } from './QuickCreateManufacturer';
import { QuickCreateIngredient } from './QuickCreateIngredient';
import { PlusCircle, MinusCircle, Pencil, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CreateProductProps {
  onProductCreated?: (newProduct: Product) => void;
  product?: Product;
  readOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideEditIcon?: boolean;
}

const productFormSchema = z.object({
  name: z.string().min(2, { message: "名称至少需要2个字符。" }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: "价格必须是正数。" }),
  category: z.string().min(1, { message: "请选择一个类别。" }),
  imageURL: z.string().url({ message: "请输入有效的图片URL。" }).optional().or(z.literal('')),
  productionDate: z.date({ required_error: "请选择生产日期。" }),
  shelfLifeHours: z.coerce.number().int().positive({ message: "保质期必须是正整数。" }),
  manufacturerId: z.string().min(1, { message: "请选择生产商。" }),
  batchNumber: z.string().optional(),
  storageCondition: z.enum(['常温', '冷藏', '冷冻'], { required_error: "请选择存储条件。" }),
  ingredientIds: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function CreateProduct({ onProductCreated, product, readOnly = false, open, onOpenChange, hideEditIcon }: CreateProductProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [manuRes, ingreRes] = await Promise.all([
            productService.listManufacturers(),
            productService.listIngredients(),
          ]);
          setManufacturers(manuRes);
          setIngredients(ingreRes);
        } catch (error) {
          toast.error("加载基础数据失败");
          console.error('加载数据失败:', error);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || 0,
      category: product?.category || "",
      imageURL: product?.imageURL || "",
      productionDate: product?.productionDate ? new Date(product.productionDate) : undefined,
      shelfLifeHours: product?.shelfLifeHours || undefined,
      manufacturerId: product?.manufacturerId || "",
      batchNumber: product?.batchNumber || "",
      storageCondition: (product?.storageCondition as '常温' | '冷藏' | '冷冻') || "常温",
      ingredientIds: product?.ingredients?.map(ing => ing.id) || [],
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (readOnly) return;
    
    setIsSubmitting(true);
    try {
      const productData: ProductInputData = {
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        imageURL: values.imageURL,
        productionDate: format(values.productionDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        shelfLifeHours: values.shelfLifeHours,
        manufacturerId: values.manufacturerId,
        batchNumber: values.batchNumber,
        storageCondition: values.storageCondition,
        ingredientIds: values.ingredientIds,
      };

      let newProduct;
      if (product && !hideEditIcon) {
        newProduct = await productService.updateProduct(product.id, productData);
        toast.success("产品更新成功。", { id: 'update-product-success' });
      } else {
        newProduct = await productService.createProduct(productData);
        toast.success("产品创建成功。", { id: 'create-product-success' });
      }
      
      setIsOpen(false);
      form.reset();
      onProductCreated?.(newProduct);
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.message;
      toast.error(`${product && !hideEditIcon ? '更新' : '创建'}产品失败: ${errorMsg}`, { id: 'product-error' });
      console.error(`${product && !hideEditIcon ? '更新' : '创建'}产品失败:`, error.response || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIngredientIds = form.watch('ingredientIds') || [];

  const availableIngredients = ingredients.filter(
    (ing) => !selectedIngredientIds.includes(ing.id)
  );

  const selectedIngredientsDetails = ingredients.filter(
    (ing) => selectedIngredientIds.includes(ing.id)
  );

  const handleSelectIngredient = (ingredientId: string) => {
    if (readOnly) return;
    const currentIds = form.getValues('ingredientIds') || [];
    form.setValue('ingredientIds', [...currentIds, ingredientId], { shouldValidate: true });
  };

  const handleDeselectIngredient = (ingredientId: string) => {
    if (readOnly) return;
    const currentIds = form.getValues('ingredientIds') || [];
    form.setValue('ingredientIds', currentIds.filter(id => id !== ingredientId), { shouldValidate: true });
  };

  const getManufacturerName = (id: string) => {
    const manu = manufacturers.find(m => m.id === id);
    return manu ? manu.name : "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {product ? (
          readOnly ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">查看</span>
              <Eye className="h-4 w-4" />
            </Button>
          ) : !hideEditIcon ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">编辑</span>
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null
        ) : (
          <Button>创建产品</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? '查看产品详情' : (product ? '编辑产品' : '创建新产品')}
          </DialogTitle>
          <DialogDescription>
            {readOnly ? '产品详细信息' : (product ? '修改产品信息。' : '填写以下信息以创建新产品。确保生产商和配料信息已预先录入系统。')}
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
                      <Input placeholder="产品名称" {...field} disabled={readOnly} />
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
                    <Textarea placeholder="产品描述" {...field} disabled={readOnly} />
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
                  <FormLabel>图片URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} disabled={readOnly} />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2">
                      <img 
                        src={field.value} 
                        alt="产品图片" 
                        className="max-h-40 max-w-full object-contain rounded-md border"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/200x150?text=图片加载失败";
                        }}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>价格 *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="价格" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shelfLifeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>保质期 (小时) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="例如：72" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="productionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>生产日期 *</FormLabel>
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
                            date > new Date() || date < new Date("2020-01-01")
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

            <FormField
              control={form.control}
              name="manufacturerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>生产商 *</FormLabel>
                  {readOnly ? (
                    <Input value={getManufacturerName(field.value)} disabled />
                  ) : (
                    <div className="flex gap-2 items-end">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择生产商" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {manufacturers.map((manu) => (
                              <SelectItem key={manu.id} value={manu.id}>
                                {manu.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <QuickCreateManufacturer
                        onCreated={(newManufacturer) => {
                          setManufacturers(prev => [...prev, newManufacturer]);
                          form.setValue('manufacturerId', newManufacturer.id);
                        }}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>批次号</FormLabel>
                  <FormControl>
                    <Input placeholder="生产批次号" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storageCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>存储条件 *</FormLabel>
                  {readOnly ? (
                    <Input value={field.value} disabled />
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择存储条件" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="常温">常温</SelectItem>
                        <SelectItem value="冷藏">冷藏</SelectItem>
                        <SelectItem value="冷冻">冷冻</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ingredientIds"
              render={() => (
                <FormItem>
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>配料</FormLabel>
                    {!readOnly && (
                      <QuickCreateIngredient
                        onCreated={(newIngredient) => {
                          setIngredients(prev => [...prev, newIngredient]);
                        }}
                      />
                    )}
                  </div>
                  {readOnly ? (
                    <div className="rounded-md border p-2 min-h-10">
                      {selectedIngredientsDetails.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedIngredientsDetails.map((ingredient) => (
                            <span 
                              key={ingredient.id} 
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                            >
                              {ingredient.name} {ingredient.is_allergen ? "(过敏原)" : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-1">无配料信息</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">可用配料</Label>
                        <ScrollArea className="h-48 w-full rounded-md border p-2">
                          {availableIngredients.length > 0 ? (
                            availableIngredients.map((ingredient) => (
                              <div key={ingredient.id} className="flex items-center justify-between p-1 hover:bg-accent rounded">
                                <span className="text-sm">
                                  {ingredient.name} {ingredient.is_allergen ? "(过敏原)" : ""}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectIngredient(ingredient.id)}
                                  aria-label={`选择 ${ingredient.name}`}
                                >
                                  <PlusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground p-1">暂无更多可用配料</p>
                          )}
                        </ScrollArea>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">已选配料</Label>
                        <ScrollArea className="h-48 w-full rounded-md border p-2">
                          {selectedIngredientsDetails.length > 0 ? (
                            selectedIngredientsDetails.map((ingredient) => (
                              <div key={ingredient.id} className="flex items-center justify-between p-1 hover:bg-accent rounded">
                                <span className="text-sm">
                                  {ingredient.name} {ingredient.is_allergen ? "(过敏原)" : ""}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeselectIngredient(ingredient.id)}
                                  aria-label={`移除 ${ingredient.name}`}
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground p-1">尚未选择配料</p>
                          )}
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                {readOnly ? "关闭" : "取消"}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSubmitting || manufacturers.length === 0}>
                  {isSubmitting ? (product ? "更新中..." : "创建中...") : (product ? "更新产品" : "创建产品")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
