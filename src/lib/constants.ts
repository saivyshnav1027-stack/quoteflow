import type { Product, Customer } from '../types'

export const INITIAL_PRODUCTS: Product[] = [
  { id: 1, product_code: 'LD-320', product_name: 'LD 3*20 (28 de)', unit: 'Kgs.', list_price: 64.0, discount_percentage: 0.0, cost_price: 58.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 2, product_code: 'NANDI-YEL', product_name: 'Yellow Tubing Nandi Flex', unit: 'Kgs.', list_price: 130.0, discount_percentage: 0.0, cost_price: 115.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 3, product_code: 'LD-315', product_name: 'LD 3*15 (5b de)', unit: 'Kgs.', list_price: 64.0, discount_percentage: 0.0, cost_price: 58.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 4, product_code: 'LD-415', product_name: 'LD 4*15 (5b u)', unit: 'Kgs.', list_price: 64.0, discount_percentage: 0.0, cost_price: 58.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 5, product_code: 'LD-420', product_name: 'LD 4*20 (6b de)', unit: 'Kgs.', list_price: 64.0, discount_percentage: 0.0, cost_price: 58.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 6, product_code: 'WC-09', product_name: '9" Waste Coupling', unit: 'Pcs.', list_price: 120.0, discount_percentage: 0.0, cost_price: 95.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 7, product_code: 'WC-06', product_name: '6" Waste Coupling', unit: 'Pcs.', list_price: 95.0, discount_percentage: 0.0, cost_price: 75.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 8, product_code: 'NC-75', product_name: '75mm Necko Clamps', unit: 'Pcs.', list_price: 29.0, discount_percentage: 0.0, cost_price: 22.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 9, product_code: 'NC-110', product_name: '110MM NECKOCLAMPS', unit: 'Pcs.', list_price: 31.0, discount_percentage: 0.0, cost_price: 24.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 10, product_code: 'NPVC-ELB-63', product_name: 'Nandi 63MM Pvc Elbow (H)', unit: 'Pcs.', list_price: 41.6, discount_percentage: 28.0, cost_price: 25.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 11, product_code: 'NPVC-TEE-63', product_name: 'Nandi 63MM Pvc Tee (H)', unit: 'Pcs.', list_price: 51.23, discount_percentage: 28.0, cost_price: 30.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 12, product_code: 'ASH-CPVC-075', product_name: 'Ashirwad 3/4" CPVC PIPE SDR 13.5', unit: 'Pcs.', list_price: 462.0, discount_percentage: 54.0, cost_price: 175.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 13, product_code: 'ASH-CPVC-100', product_name: 'Ashirwad 1" CPVC PIPE SDR 13.5', unit: 'Pcs.', list_price: 663.0, discount_percentage: 54.0, cost_price: 250.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 14, product_code: 'ASH-CPVC-1S11', product_name: 'Ashirwad Cpvc 1" Pipe SDR11', unit: 'Pcs.', list_price: 771.0, discount_percentage: 54.0, cost_price: 290.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 15, product_code: 'WC-HARP', product_name: 'WC Harpan', unit: 'Pcs.', list_price: 340.0, discount_percentage: 0.0, cost_price: 280.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 16, product_code: 'SINK-1822', product_name: '18*22 Steel Sink', unit: 'Pcs.', list_price: 950.0, discount_percentage: 0.0, cost_price: 780.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 17, product_code: 'CHAM-1212', product_name: '12*12 Beed Chamber', unit: 'Pcs.', list_price: 280.0, discount_percentage: 0.0, cost_price: 220.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 18, product_code: 'FRP-2424', product_name: '24*24 FRP Chamber', unit: 'Pcs.', list_price: 1250.0, discount_percentage: 0.0, cost_price: 980.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 19, product_code: 'ASH-SWR-B75', product_name: 'Ashirwad SWR 75mm Plain Bend', unit: 'Pcs.', list_price: 101.0, discount_percentage: 48.0, cost_price: 42.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 20, product_code: 'ASH-SWR-T75', product_name: 'Ashirwad SWR 75MM Nani Trap', unit: 'Pcs.', list_price: 144.0, discount_percentage: 48.0, cost_price: 60.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 21, product_code: 'ASH-SWR-P75', product_name: 'Ashirwad 75MM SWR Pipe', unit: 'Pcs.', list_price: 542.0, discount_percentage: 48.0, cost_price: 225.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 22, product_code: 'ASH-SWR-P110', product_name: 'Ashirwad 110MM SWR Pipe', unit: 'Pcs.', list_price: 942.0, discount_percentage: 48.0, cost_price: 390.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 23, product_code: 'NANDI-SWR-75', product_name: 'Nandi 75MM Swr Pipe', unit: 'Pcs.', list_price: 195.0, discount_percentage: 0.0, cost_price: 155.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 24, product_code: 'NANDI-SWR-110', product_name: 'Nandi 110MM Swr Pipe', unit: 'Pcs.', list_price: 340.0, discount_percentage: 0.0, cost_price: 275.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 25, product_code: 'NPVC-110', product_name: '110MM PVC Pipe Nandi', unit: 'Pcs.', list_price: 900.0, discount_percentage: 0.0, cost_price: 720.0, margin_percentage: 15.0, stock_quantity: 100 },
  { id: 26, product_code: 'NPVC-90', product_name: '90MM PVC Pipe Nandi', unit: 'Pcs.', list_price: 630.0, discount_percentage: 0.0, cost_price: 505.0, margin_percentage: 15.0, stock_quantity: 100 },
]

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, customer_name: 'Kondalu', phone: '+91 98480 12345', customer_type_id: 1, type_name: 'Type A (Retail Regular)', markup_percentage: 0 },
  { id: 2, customer_name: 'Ramesh Patel', phone: '+91 98765 43210', customer_type_id: 2, type_name: 'Type B (Preferred Contractor)', markup_percentage: 5 },
  { id: 3, customer_name: 'Srinivas Rao (Agri Works)', phone: '+91 94401 56789', customer_type_id: 3, type_name: 'Type C (Wholesale Farmer)', markup_percentage: 10 },
]
