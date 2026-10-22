import * as XLSX from 'xlsx'
import type { Product } from '../types'
import { calculateNetPriceFromCostAndMargin } from './pricing'

/**
 * Downloads a ready-to-use Excel template with example rows formatted for Sri Venkateshwara Trading & Co.
 */
export function downloadCatalogTemplate(): void {
  const headers = [
    'Product Code',
    'Product Name',
    'Unit',
    'List Price',
    'Trade Discount %',
    'Cost Price',
    'Margin %',
    'Net Price',
  ]

  const sampleRows = [
    [
      'CPVC-TEE-075',
      'Ashirwad 3/4" CPVC Tee SDR 11',
      'Pcs.',
      120.0,
      45.0,
      66.0,
      15.0,
      75.9,
    ],
    [
      'CPVC-PIPE-100',
      'Supreme 1" CPVC Pipe SDR 11 (3m)',
      'Mtr.',
      480.0,
      48.0,
      249.6,
      18.0,
      294.53,
    ],
    [
      'SOLV-250ML',
      'Finolex Heavy Duty Solvent Cement 250ml',
      'Pcs.',
      210.0,
      30.0,
      147.0,
      20.0,
      176.4,
    ],
  ]

  const worksheetData = [headers, ...sampleRows]
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Configure column widths for readability
  ws['!cols'] = [
    { wch: 18 }, // Product Code
    { wch: 42 }, // Product Name
    { wch: 10 }, // Unit
    { wch: 12 }, // List Price
    { wch: 16 }, // Trade Discount %
    { wch: 12 }, // Cost Price
    { wch: 12 }, // Margin %
    { wch: 12 }, // Net Price
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Catalog_Template')

  XLSX.writeFile(wb, 'Sri_Venkateshwara_Catalog_Template.xlsx')
}

/**
 * Exports current live catalog products to an Excel workbook.
 */
export function exportCatalogToExcel(products: Product[]): void {
  const headers = [
    'Product Code',
    'Product Name',
    'Unit',
    'List Price',
    'Trade Discount %',
    'Cost Price',
    'Margin %',
    'Net Price',
  ]

  const rows = products.map((p) => {
    const listPrice = p.list_price || 0
    const tradeDis = p.discount_percentage || 0
    const costPrice = p.cost_price || 0
    const margin = p.margin_percentage ?? 15
    const netPrice = calculateNetPriceFromCostAndMargin(costPrice, margin)

    return [
      p.product_code || '',
      p.product_name,
      p.unit || 'Pcs.',
      listPrice,
      tradeDis,
      costPrice,
      margin,
      netPrice,
    ]
  })

  const worksheetData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  ws['!cols'] = [
    { wch: 18 },
    { wch: 42 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  const dateStr = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `QuoteFlow_Products_Export_${dateStr}.xlsx`)
}
