export interface Customer {
  id: number
  customer_name: string
  phone: string
  customer_type_id: number
  type_name?: string
  markup_percentage?: number
}

export interface Product {
  id: number
  product_code: string
  product_name: string
  unit: string
  list_price: number
  discount_percentage: number
  cost_price: number
  margin_percentage: number
  stock_quantity: number
}

export interface EstimateRow {
  id: string
  productId: number | null
  productCode: string
  description: string
  checked: boolean
  quantity: number
  unit: string
  listPrice: number
  discountPercentage: number
  costPrice: number
  marginPercentage: number
  discount: number
  discountType: 'PERCENT' | 'RUPEE'
  price: number // Net Price per unit
  lineTotal: number
}

export interface Quotation {
  id: number
  quotation_number: string
  customer_id: number | null
  customer_name: string
  phone: string
  subtotal: number
  total_units: number
  total: number
  created_at: string
  item_count?: number
}

export interface PrintQuoteData {
  invoiceNo: string
  partyName: string
  phone: string
  dated: string
  totalUnits: number
  totalAmount: number
  items: EstimateRow[]
}

export type ActivePage = 'Dashboard' | 'Estimator' | 'Products' | 'Customers' | 'Settings'
