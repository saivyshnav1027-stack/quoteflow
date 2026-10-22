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
  is_hero?: boolean | number
}

export interface HeroProductChild {
  id: number
  hero_product_id: number
  child_product_id: number
  default_quantity: number
  created_at?: string
  child_product_name?: string
  child_product_code?: string
  child_unit?: string
  child_cost_price?: number
  child_list_price?: number
  child_discount_percentage?: number
  child_margin_percentage?: number
}

export interface HeroProductWithChildren extends Product {
  children: HeroProductChild[]
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
  updateListPriceInDb?: boolean
  originalListPrice?: number
  originalDiscountPercentage?: number
  originalCostPrice?: number
  originalMarginPercentage?: number
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

export interface EstimatorSummary {
  itemCount: number
  totalUnits: number
  grossTotal: number
  cashDiscount: number
  totalSavings: number
  totalAmount: number
  totalCost: number
  totalProfit: number
  profitMarginPercentage: number
}

export interface PrintQuoteData {
  invoiceNo: string
  partyName: string
  phone: string
  dated: string
  totalUnits: number
  grossTotal?: number
  discountAmount?: number
  totalAmount: number
  items: EstimateRow[]
}

export type ActivePage = 'Dashboard' | 'Estimator' | 'Products' | 'HeroProducts' | 'Customers' | 'Settings'

export type PricingSuperiorityMode = 'PRICE' | 'PERCENTAGE'

