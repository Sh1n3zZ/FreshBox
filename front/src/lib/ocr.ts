import { API_URLS } from '@/conf/env'

export interface OCRSummary {
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

export interface OCRResponse {
  code: number
  msg: string
  data: {
    text: string
    summary: OCRSummary
  }
}

export async function processOCR(image: File): Promise<OCRResponse> {
  const formData = new FormData()
  formData.append('image', image)

  const response = await fetch(API_URLS.OCR.PROCESS, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('OCR处理失败')
  }

  const data = await response.json()
  if (data.code !== 200) {
    throw new Error(data.msg || 'OCR处理失败')
  }

  return data
}
