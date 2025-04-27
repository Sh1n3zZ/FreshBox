import { Copy, Download, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { CreateProduct } from '@/components/CreateProduct'
import { Product, productService, Manufacturer, Ingredient } from '@/lib/product'

interface OCRSummary {
  product_name: string
  product_description: string
  product_price: string
  product_shelf_life: string
  product_production_date: string
  product_manufacturer: string
  product_production_batch_number: string
  product_storage_conditions: string
  product_ingredients: Array<{
    index: number
    ingredients: string
  }>
}

interface RecognitionResultsProps {
  summary: OCRSummary | null
  rawText: string
  isLoading: boolean
}

export default function RecognitionResults({ summary, rawText, isLoading }: RecognitionResultsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [initialProduct, setInitialProduct] = useState<Product | null>(null)

  // 复制文本到剪贴板
  const copyToClipboard = (text: string) => {
    if (!text) return
    
    navigator.clipboard.writeText(text)
      .then(() => toast.success('已复制到剪贴板'))
      .catch(() => toast.error('复制失败，请手动复制'))
  }

  // 下载文本文件
  const downloadText = (text: string, filename: string) => {
    if (!text) return
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 准备导入数据
  const prepareImport = async () => {
    if (!summary) return

    // 尝试解析价格
    let price = 0
    try {
      const priceMatch = summary.product_price.match(/(\d+(\.\d+)?)/)
      if (priceMatch) {
        price = parseFloat(priceMatch[0])
      }
    } catch (error) {
      console.error('解析价格失败:', error)
    }

    // 尝试解析保质期
    let shelfLifeHours = 72 // 默认值
    try {
      const shelfLifeMatch = summary.product_shelf_life.match(/(\d+)\s*(天|日)/)
      if (shelfLifeMatch) {
        shelfLifeHours = parseInt(shelfLifeMatch[1]) * 24
      }
    } catch (error) {
      console.error('解析保质期失败:', error)
    }

    // 尝试解析生产日期
    let productionDate = ''
    try {
      if (summary.product_production_date) {
        const date = new Date(summary.product_production_date)
        if (!isNaN(date.getTime())) {
          productionDate = date.toISOString()
        }
      }
    } catch (error) {
      console.error('解析生产日期失败:', error)
    }

    // 处理生产商
    let manufacturerId = ''
    let manufacturer: Manufacturer | undefined = undefined
    if (summary.product_manufacturer) {
      try {
        // 获取现有生产商列表
        const manufacturers = await productService.listManufacturers()
        // 查找匹配的生产商
        const existingManufacturer = manufacturers.find(
          (m: Manufacturer) => m.name === summary.product_manufacturer
        )

        if (existingManufacturer) {
          manufacturerId = existingManufacturer.id
          manufacturer = existingManufacturer
        } else {
          // 创建新的生产商
          const newManufacturer = await productService.quickCreateManufacturer({
            name: summary.product_manufacturer,
            contact_phone: '',
            address: '',
            certification_number: ''
          })
          manufacturerId = newManufacturer.id
          manufacturer = newManufacturer
        }
      } catch (error) {
        console.error('处理生产商失败:', error)
        toast.error('创建生产商失败，请在对话框中手动选择')
      }
    }

    // 处理配料
    let ingredients: Ingredient[] = []
    let ingredientIds: string[] = []
    if (summary.product_ingredients && summary.product_ingredients.length > 0) {
      try {
        // 获取现有配料列表
        const existingIngredients = await productService.listIngredients()
        
        // 处理每个配料项
        for (const item of summary.product_ingredients) {
          if (!item.ingredients) continue
          
          // 查找匹配的配料
          const existingIngredient = existingIngredients.find(
            (i: Ingredient) => i.name === item.ingredients
          )

          if (existingIngredient) {
            if (!ingredients.some(i => i.id === existingIngredient.id)) {
              ingredients.push(existingIngredient)
              ingredientIds.push(existingIngredient.id)
            }
          } else {
            // 创建新的配料
            const newIngredient = await productService.quickCreateIngredient({
              name: item.ingredients,
              category: '其他', // 默认类别
              is_allergen: false, // 默认非过敏原
              description: ''
            })
            if (!ingredients.some(i => i.id === newIngredient.id)) {
              ingredients.push(newIngredient)
              ingredientIds.push(newIngredient.id)
            }
          }
        }
      } catch (error) {
        console.error('处理配料失败:', error)
        toast.error('创建配料失败，请在对话框中手动选择')
      }
    }

    // 创建初始产品数据
    const product: Product = {
      id: '',
      name: summary.product_name || '',
      description: summary.product_description || '',
      price: price,
      category: '食品',
      status: 'available',
      productionDate: productionDate,
      shelfLifeHours: shelfLifeHours,
      createdAt: new Date().toISOString(),
      manufacturerId: manufacturerId,
      batchNumber: summary.product_production_batch_number || '',
      storageCondition: summary.product_storage_conditions || '常温',
      ingredients: ingredients,
      manufacturer: manufacturer
    }

    setInitialProduct(product)
    setIsDialogOpen(true)
  }

  const handleProductCreated = (newProduct: Product) => {
    toast.success('产品导入成功')
    setIsDialogOpen(false)
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">识别结果</h2>
          <div className="flex gap-2">
            {rawText && (
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(rawText)}
                  className="inline-flex items-center justify-center rounded-md border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title="复制原始文本"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => downloadText(rawText, 'ocr-result.txt')}
                  className="inline-flex items-center justify-center rounded-md border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title="下载原始文本"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {summary && (
              <button
                onClick={prepareImport}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircle className="h-4 w-4" />
                快速导入产品
              </button>
            )}
            {Object.entries(summary).map(([key, value]) => {
              if (!value) return null
              const label = {
                product_name: '产品名称',
                product_description: '产品描述',
                product_price: '产品价格',
                product_shelf_life: '保质期',
                product_production_date: '生产日期',
                product_manufacturer: '生产厂家',
                product_production_batch_number: '生产批号',
                product_storage_conditions: '储存条件',
                product_ingredients: '配料表'
              }[key as keyof OCRSummary]

              if (key === 'product_ingredients') {
                return (
                  <div key={key} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{label}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard((value as OCRSummary['product_ingredients']).map(v => v.ingredients).join('\n'))}
                          className="inline-flex items-center justify-center rounded-md border p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          title="复制"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => downloadText((value as OCRSummary['product_ingredients']).map(v => v.ingredients).join('\n'), `${label}.txt`)}
                          className="inline-flex items-center justify-center rounded-md border p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          title="下载"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(value as OCRSummary['product_ingredients']).map((item, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{item.index}.</span>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.ingredients}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{label}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(value)}
                        className="inline-flex items-center justify-center rounded-md border p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        title="复制"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => downloadText(value, `${label}.txt`)}
                        className="inline-flex items-center justify-center rounded-md border p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        title="下载"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
            识别结果将在这里显示
          </div>
        )}
      </div>

      {initialProduct && (
        <CreateProduct
          product={initialProduct}
          onProductCreated={handleProductCreated}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          hideEditIcon={true}
        />
      )}
    </>
  )
}
