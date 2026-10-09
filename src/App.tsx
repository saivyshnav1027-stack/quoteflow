import { useEffect, useState, useMemo } from 'react'
import {
  Calculator,
  Package,
  Users,
  LayoutDashboard,
  Plus,
  Trash2,
  Printer,
  Share2,
  CheckCircle2,
  Search,
  X,
  Pencil,
  Store,
  RotateCcw,
  Database,
  Check,
  Receipt,
  LogOut,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react'

const API_BASE = '/api'

// ============================================================
// TYPES
// ============================================================

type Customer = {
  id: number
  customer_name: string
  phone: string
  customer_type_id: number
  type_name?: string
  markup_percentage?: number
}

type Product = {
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

type EstimateRow = {
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

type Quotation = {
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

// Currency Formatter
const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0)
}

// Real 26 Products from Sri Venkateshwara Trading invoice
const INITIAL_PRODUCTS: Product[] = [
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

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, customer_name: 'Kondalu', phone: '+91 98480 12345', customer_type_id: 1, type_name: 'Type A (Retail Regular)', markup_percentage: 0 },
  { id: 2, customer_name: 'Ramesh Patel', phone: '+91 98765 43210', customer_type_id: 2, type_name: 'Type B (Preferred Contractor)', markup_percentage: 5 },
  { id: 3, customer_name: 'Srinivas Rao (Agri Works)', phone: '+91 94401 56789', customer_type_id: 3, type_name: 'Type C (Wholesale Farmer)', markup_percentage: 10 },
]


// ============================================================
// LOGIN SCREEN COMPONENT (SHOPKEEPER PORTAL)
// ============================================================
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('+91 98480 12345')
  const [pin, setPin] = useState('1234')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setError('Please enter Mobile Number or Shopkeeper ID')
      return
    }
    if (!pin.trim()) {
      setError('Please enter Security PIN')
      return
    }
    onLogin()
  }

  const handleDemoLogin = () => {
    setPhone('+91 98480 12345')
    setPin('1234')
    onLogin()
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-4">
              <Store className="h-8 w-8" />
            </div>
            <div className="inline-block rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2">
              Wholesale Depot & Agro-Trading Hub
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Sri Venkateshwara Trading & Co.
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Counter POS Estimator & Inventory Management Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Shopkeeper Mobile / User ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98480 12345 or admin"
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Security PIN / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (default: 1234)"
                  className="w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Quick Demo Access (1-Click)</span>
              </button>
            </div>
          </form>

          {/* Quick info badges */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400 text-center">
            <div className="rounded-lg bg-slate-800/50 p-2">
              <span className="font-semibold text-emerald-400 block">☁️ Turso Cloud Sync</span>
              <span>Centralized Pricing</span>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <span className="font-semibold text-blue-400 block">📄 Physical Slip Ready</span>
              <span>Physical POS Format</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-slate-500">
          Sri Venkateshwara Trading & Co. • Agro & Hardware Operations
        </div>
      </div>
    </div>
  )
}

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sri_trading_auth') === 'true'
  })

  // Landing page: Default is ALWAYS Dashboard
  const [activePage, setActivePage] = useState<'Dashboard' | 'Estimator' | 'Products' | 'Customers' | 'Settings'>('Dashboard')

  // Stable sequential estimate number (retained across renders)
  const [currentEstimateNo, setCurrentEstimateNo] = useState<string>(() => {
    return localStorage.getItem('sri_current_estimate_no') || '2354'
  })

  // Admin Feature Flags
  const [enableListPriceMode, setEnableListPriceMode] = useState<boolean>(() => {
    return localStorage.getItem('quoteflow_flag_list_price') === 'true'
  })
  const [enableFlatRupeeDiscount, setEnableFlatRupeeDiscount] = useState<boolean>(() => {
    const stored = localStorage.getItem('quoteflow_flag_rupee_discount')
    return stored !== null ? stored === 'true' : true
  })

  const toggleListPriceMode = (val: boolean) => {
    setEnableListPriceMode(val)
    localStorage.setItem('quoteflow_flag_list_price', String(val))
  }

  const toggleFlatRupeeDiscount = (val: boolean) => {
    setEnableFlatRupeeDiscount(val)
    localStorage.setItem('quoteflow_flag_rupee_discount', String(val))
  }

  // Global Data (Pre-seeded with real items from paper slip so catalog is ALWAYS loaded)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; isUsingTurso: boolean; message: string }>({
    isConnected: true,
    isUsingTurso: true,
    message: 'Turso Cloud DB Synchronized',
  })

  // ============================================================
  // ESTIMATOR STATE
  // ============================================================
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(INITIAL_CUSTOMERS[0])

  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>([])
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [whatsappSharedNotice, setWhatsappSharedNotice] = useState(false)

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printQuoteData, setPrintQuoteData] = useState<{
    invoiceNo: string
    partyName: string
    phone: string
    dated: string
    totalUnits: number
    totalAmount: number
    items: EstimateRow[]
  } | null>(null)

  // Modals for CRUD
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')

  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdCode, setNewProdCode] = useState('')
  const [newProdUnit, setNewProdUnit] = useState('Pcs.')
  const [newProdList, setNewProdList] = useState<number | ''>('')
  const [newProdDis, setNewProdDis] = useState<number | ''>('')
  const [newProdCost, setNewProdCost] = useState<number | ''>('')
  const [newProdMargin, setNewProdMargin] = useState<number | ''>(15)

  const [editProduct, setEditProduct] = useState<Product | null>(null)

  // ============================================================
  // LOADERS
  // ============================================================
  const checkDb = async () => {
    try {
      const res = await fetch(`${API_BASE}/test-db`)
      if (res.ok) {
        const data = await res.json()
        setDbStatus({
          isConnected: data.success,
          isUsingTurso: data.isUsingTurso ?? true,
          message: data.message,
        })
      }
    } catch {
      // Keep optimistic connected state
    }
  }

  const loadCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data)
          if (!selectedCustomer) {
            setSelectedCustomer(data[0])
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadQuotations = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotations`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setQuotations(data)
        // Sync sequential estimate number to avoid duplicate key collisions
        let maxNum = 2353
        for (const q of data) {
          const match = String(q.quotation_number || '').match(/\d+/)
          if (match) {
            const n = parseInt(match[0], 10)
            if (!isNaN(n) && n > maxNum) {
              maxNum = n
            }
          }
        }
        const nextNumStr = String(maxNum + 1)
        setCurrentEstimateNo(nextNumStr)
        localStorage.setItem('sri_current_estimate_no', nextNumStr)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    checkDb()
    loadCustomers()
    loadProducts()
    loadQuotations()
  }, [])

  // ============================================================
  // ESTIMATOR CALCULATIONS
  // ============================================================
  const calculateRow = (row: EstimateRow): EstimateRow => {
    let cost = Number(row.costPrice || 0)
    const list = Number(row.listPrice || 0)
    const tradeDis = Number(row.discountPercentage || 0)

    // In List Price mode, cost price is derived from List Price * (1 - Trade Dis / 100)
    if (enableListPriceMode && list > 0) {
      cost = Number((list * (1 - tradeDis / 100)).toFixed(2))
    }

    const marginPct = Number(row.marginPercentage ?? 15)
    // Formula: Price After Margin = Cost Price * (1 + Margin / 100)
    const priceAfterMargin = Number((cost * (1 + marginPct / 100)).toFixed(2))

    // Customer Discount (either percent % or flat ₹ rupee)
    const dis = Number(row.discount || 0)
    const disType = row.discountType || 'PERCENT'
    const netPrice = disType === 'PERCENT'
      ? Number((priceAfterMargin * (1 - dis / 100)).toFixed(2))
      : Number(Math.max(0, priceAfterMargin - dis).toFixed(2))

    const qty = Number(row.quantity || 0)
    const lineTotal = Number((netPrice * qty).toFixed(2))

    return {
      ...row,
      costPrice: cost,
      marginPercentage: marginPct,
      price: netPrice,
      lineTotal,
    }
  }

  const addProductToEstimate = (prod: Product) => {
    const cost = Number(prod.cost_price || 0)
    const margin = Number(prod.margin_percentage ?? 15)
    const newRow: EstimateRow = calculateRow({
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      productId: prod.id,
      productCode: prod.product_code,
      description: prod.product_name,
      checked: false,
      quantity: 1,
      unit: prod.unit || 'Pcs.',
      listPrice: prod.list_price || 0,
      discountPercentage: prod.discount_percentage || 0,
      costPrice: cost,
      marginPercentage: margin,
      discount: 0,
      discountType: 'PERCENT',
      price: 0,
      lineTotal: 0,
    })
    setEstimateRows((prev) => [...prev, newRow])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const updateRow = (id: string, field: keyof EstimateRow, val: string | number | boolean) => {
    setEstimateRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: val }
        return calculateRow(updated)
      })
    )
  }

  const removeRow = (id: string) => {
    setEstimateRows((prev) => prev.filter((r) => r.id !== id))
  }

  // Summary Metrics
  const summary = useMemo(() => {
    let totalUnits = 0
    let totalAmount = 0
    let baseListSum = 0

    estimateRows.forEach((r) => {
      totalUnits += Number(r.quantity || 0)
      totalAmount += Number(r.lineTotal || 0)
      baseListSum += Number(r.listPrice || 0) * Number(r.quantity || 0)
    })

    const totalSavings = Math.max(0, baseListSum - totalAmount)

    return {
      itemCount: estimateRows.length,
      totalUnits: Number(totalUnits.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      baseListSum: Number(baseListSum.toFixed(2)),
      totalSavings: Number(totalSavings.toFixed(2)),
    }
  }, [estimateRows])


  // ============================================================
  // SAVE & ACTIONS
  // ============================================================
  const saveQuotationToBackend = async () => {
    if (estimateRows.length === 0) {
      alert('Please add at least one product to the estimate.')
      return
    }

    setIsSavingQuote(true)
    try {
      const payload = {
        quotationNumber: `EST-${currentEstimateNo}`,
        customerId: selectedCustomer.id || null,
        customerName: selectedCustomer.customer_name || 'Guest Walk-In',
        customerPhone: selectedCustomer.phone || '',
        customerTypeId: selectedCustomer.customer_type_id || 1,
        markupPercentage: 0,
        items: estimateRows.map((r) => ({
          productId: r.productId,
          description: r.description,
          quantity: r.quantity,
          unit: r.unit,
          listPrice: r.listPrice,
          discountPercentage: r.discountPercentage,
          costPrice: r.costPrice,
          marginPercentage: r.marginPercentage,
          discount: r.discount,
          discountType: r.discountType,
          price: r.price,
          lineTotal: r.lineTotal,
        })),
      }

      const res = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        setSaveSuccessMsg(`Quotation saved! ID: ${data.quotation.quotationNumber}`)
        setTimeout(() => setSaveSuccessMsg(''), 4000)
        loadQuotations()

        // Prepare print slip
        setPrintQuoteData({
          invoiceNo: data.quotation.quotationNumber,
          partyName: selectedCustomer.customer_name,
          phone: selectedCustomer.phone,
          dated: new Date().toLocaleDateString('en-GB') + ' (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
          totalUnits: summary.totalUnits,
          totalAmount: summary.totalAmount,
          items: estimateRows,
        })

        // Advance to next sequential estimate number
        const match = String(data.quotation?.quotationNumber || '').match(/\d+/)
        const assignedNum = match ? parseInt(match[0], 10) : (parseInt(currentEstimateNo, 10) || 2354)
        const nextNum = assignedNum + 1
        const nextStr = String(nextNum)
        setCurrentEstimateNo(nextStr)
        localStorage.setItem('sri_current_estimate_no', nextStr)
      } else {
        alert('Failed to save quotation: ' + (data.message || data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('Network error while saving quotation.')
    } finally {
      setIsSavingQuote(false)
    }
  }

  // Free WhatsApp Share Link
  const shareViaWhatsApp = () => {
    if (estimateRows.length === 0) {
      alert('Estimate is empty.')
      return
    }

    const phone = selectedCustomer.phone ? selectedCustomer.phone.replace(/[^0-9]/g, '') : ''
    const party = selectedCustomer.customer_name || 'Customer'
    const today = new Date().toLocaleDateString('en-GB')

    let msg = `🌾 *Sri Venkateshwara Trading & Co - ESTIMATION*\n`
    msg += `Party Details: ${party}\n`
    msg += `Date: ${today}\n`
    msg += `---------------------------------\n`

    estimateRows.forEach((r, idx) => {
      msg += `${idx + 1}. ${r.description} (${r.quantity} ${r.unit}) - ₹${r.lineTotal.toFixed(2)}\n`
    })

    msg += `---------------------------------\n`
    msg += `*Totals c/o:* ${summary.totalUnits} Units\n`
    msg += `*Total Estimate:* ₹${summary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
    msg += `---------------------------------\n`
    msg += `Thank you for your business!`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
    setWhatsappSharedNotice(true)
  }

  // Clear Current Estimate & Advance Sequence
  const clearCurrentEstimate = () => {
    if (estimateRows.length === 0) return
    if (window.confirm('Clear all items and start a fresh estimate for the next customer?')) {
      clearCurrentEstimateDirect()
    }
  }

  const clearCurrentEstimateDirect = () => {
    setEstimateRows([])
    setProductSearch('')
    setShowProductDropdown(false)
    setWhatsappSharedNotice(false)
    const nextNum = (parseInt(currentEstimateNo, 10) || 2354) + 1
    const nextStr = String(nextNum)
    setCurrentEstimateNo(nextStr)
    localStorage.setItem('sri_current_estimate_no', nextStr)
  }

  // Open Print Modal for Current Active Estimate
  const openPrintSlip = () => {
    if (estimateRows.length === 0) {
      alert('Add products to preview the estimate slip.')
      return
    }
    setPrintQuoteData({
      invoiceNo: currentEstimateNo,
      partyName: selectedCustomer.customer_name,
      phone: selectedCustomer.phone,
      dated: new Date().toLocaleDateString('en-GB') + ' (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
      totalUnits: summary.totalUnits,
      totalAmount: summary.totalAmount,
      items: estimateRows,
    })
    setShowPrintModal(true)
  }

  // Share whatever estimate is loaded in Print Modal via WhatsApp
  const sharePrintSlipViaWhatsApp = () => {
    if (!printQuoteData) return
    const phone = printQuoteData.phone ? printQuoteData.phone.replace(/[^0-9]/g, '') : ''
    let msg = `🌾 *Sri Venkateshwara Trading & Co - ESTIMATION*\n`
    msg += `Estimate No: ${printQuoteData.invoiceNo}\n`
    msg += `Party Details: ${printQuoteData.partyName}\n`
    msg += `Date: ${printQuoteData.dated}\n`
    msg += `---------------------------------\n`

    printQuoteData.items.forEach((r, idx) => {
      msg += `${idx + 1}. ${r.description} (${r.quantity} ${r.unit}) - ₹${r.lineTotal.toFixed(2)}\n`
    })

    msg += `---------------------------------\n`
    msg += `*Totals c/o:* ${printQuoteData.totalUnits} Units\n`
    msg += `*Total Estimate:* ₹${printQuoteData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
    msg += `---------------------------------\n`
    msg += `Thank you for your business!`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  // Quick Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustName.trim()) return

    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustName.trim(),
          phone: newCustPhone.trim(),
          customerTypeId: 1,
        }),
      })
      const data = await res.json()
      if (data.success) {
        loadCustomers()
        setSelectedCustomer(data.customer)
        setShowNewCustomerModal(false)
        setNewCustName('')
        setNewCustPhone('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Quick Product Creation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProdName.trim()) return

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: newProdName.trim(),
          productCode: newProdCode.trim(),
          unit: newProdUnit,
          listPrice: Number(newProdList || 0),
          discountPercentage: Number(newProdDis || 0),
          costPrice: Number(newProdCost || 0),
          marginPercentage: Number(newProdMargin || 15),
          stockQuantity: 100,
        }),
      })
      const data = await res.json()
      if (data.success) {
        loadProducts()
        addProductToEstimate(data.product)
        setShowNewProductModal(false)
        setNewProdName('')
        setNewProdCode('')
        setNewProdList('')
        setNewProdDis('')
        setNewProdCost('')
        setNewProdMargin(15)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Filtered lists for comboboxes
  const filteredCustomers = customers.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredProducts = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.product_code.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleLogin = () => {
    localStorage.setItem('sri_trading_auth', 'true')
    setIsAuthenticated(true)
    setActivePage('Dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('sri_trading_auth')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      {/* ============================================================ */}
      {/* 1. FIXED LEFT SIDEBAR */}
      {/* ============================================================ */}
      <aside className="no-print flex h-full w-64 flex-col justify-between bg-[#0F172A] text-white shadow-xl">
        <div className="flex flex-col">
          {/* Shop Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-base font-bold tracking-tight text-white">Sri Venkateshwara</span>
              <span className="truncate text-xs font-medium text-slate-400">Trading & Co.</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="px-3 pt-5">
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Operations</span>
            <nav className="mt-2 flex flex-col gap-1.5">
              <button
                onClick={() => setActivePage('Dashboard')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActivePage('Estimator')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Estimator'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Estimator (POS)</span>
              </button>

              <button
                onClick={() => setActivePage('Products')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Products'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Products ({products.length})</span>
              </button>

              <button
                onClick={() => setActivePage('Customers')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Customers'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Customers ({customers.length})</span>
              </button>

              <button
                onClick={() => setActivePage('Settings')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  activePage === 'Settings'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Admin Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Profile & DB Status */}
        <div className="flex flex-col gap-3 border-t border-slate-800 p-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-400">
                {dbStatus.isUsingTurso ? 'Turso Cloud' : 'Local SQLite DB'}
              </span>
            </div>
            <Database className="h-3.5 w-3.5 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                SK
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-white">Shopkeeper</span>
                <span className="truncate text-[10px] text-slate-400">Single User Admin</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Wholesale Depot & Agro-Trading Hub</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">POS Online</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-8">
          {saveSuccessMsg && (
            <div className="no-print mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: ESTIMATOR (PRIMARY COUNTER SCREEN) */}
          {/* ============================================================ */}
          {activePage === 'Estimator' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quote Estimator</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Generate instant estimates for walk-in customers & wholesale agri-parties
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-blue-600" />
                    <span>Est No: #{currentEstimateNo}</span>
                  </span>
                  <button
                    onClick={clearCurrentEstimate}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-colors cursor-pointer shadow-sm"
                    title="Start new blank estimate with next sequential number"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ New Estimate</span>
                  </button>
                </div>
              </div>

              {/* Section A: Customer Selector Bar */}
              <div className="relative rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Customer Search / Picker */}
                  <div className="relative flex-1">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search existing customer by Name or Phone (+91)..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setShowCustomerDropdown(true)
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    {/* Customer Dropdown */}
                    {showCustomerDropdown && (
                      <div className="absolute left-0 right-0 top-12 z-30 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No matching customers found
                          </div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c)
                                setShowCustomerDropdown(false)
                                setCustomerSearch('')
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">{c.customer_name}</span>
                                <span className="text-xs text-slate-400">{c.phone || 'No phone'}</span>
                              </div>
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                #{c.id}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowNewCustomerModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Customer</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer({
                          id: 0,
                          customer_name: 'Guest Walk-In',
                          phone: '',
                          customer_type_id: 1,
                          type_name: '',
                          markup_percentage: 0,
                        })
                        setCustomerSearch('')
                        setShowCustomerDropdown(false)
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Guest Walk-In
                    </button>
                  </div>
                </div>

                {/* Selected Customer Banner */}
                {selectedCustomer && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm">
                        {selectedCustomer.customer_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{selectedCustomer.customer_name}</span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                            {selectedCustomer.id === 0 ? 'Cash Customer' : 'Counter Client'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{selectedCustomer.phone || 'Walk-in / Cash Customer'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">Direct product margin pricing applied</div>
                  </div>
                )}
              </div>

              {/* Section B: Product Search Bar */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type product name, pipe size, clamp or code (e.g. CPVC, Ashirwad, Nandi, FRP)..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    />

                    {/* Product Dropdown */}
                    {showProductDropdown && (
                      <div className="absolute left-0 right-0 top-12 z-30 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        {filteredProducts.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs text-slate-500 mb-2">"{productSearch}" is not in inventory.</p>
                            <button
                              onClick={() => {
                                setNewProdName(productSearch)
                                setShowNewProductModal(true)
                                setShowProductDropdown(false)
                              }}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                            >
                              + Add "{productSearch}" to Inventory
                            </button>
                          </div>
                        ) : (
                          <>
                            {filteredProducts.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => addProductToEstimate(p)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800">{p.product_name}</span>
                                  <span className="text-xs text-slate-400">
                                    Code: {p.product_code} | Unit: {p.unit}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  {enableListPriceMode ? (
                                    <>
                                      <span className="font-bold text-slate-900">List: {formatINR(p.list_price)}</span>
                                      {p.discount_percentage > 0 && (
                                        <span className="text-xs text-emerald-600 font-semibold">
                                          Dis: {p.discount_percentage}%
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-bold text-slate-900">Cost: {formatINR(p.cost_price)}</span>
                                      <span className="text-xs text-blue-600 font-semibold">
                                        Margin: {p.margin_percentage ?? 15}%
                                      </span>
                                    </>
                                  )}
                                </div>
                              </button>
                            ))}
                            <div className="mt-1 border-t border-slate-100 pt-1 text-center">
                              <button
                                onClick={() => {
                                  setNewProdName(productSearch)
                                  setShowNewProductModal(true)
                                  setShowProductDropdown(false)
                                }}
                                className="text-xs font-bold text-blue-600 hover:underline py-1"
                              >
                                + Add Custom / Unlisted Product to Catalog
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowNewProductModal(true)}
                    className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Product</span>
                  </button>
                </div>

                {/* Estimate Line Items Table (Matches paper receipt + exact margin formula) */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 select-none">
                        <th className="py-3 px-3 text-center w-12">S.N.</th>
                        <th className="py-3 px-3">Description of Goods</th>
                        <th className="py-3 px-2 text-center w-12">Chek</th>
                        <th className="py-3 px-3 text-right w-24">Qty.</th>
                        <th className="py-3 px-3 w-20">Unit</th>
                        {enableListPriceMode && (
                          <>
                            <th className="py-3 px-3 text-right w-24">List Price (₹)</th>
                            <th className="py-3 px-3 text-right w-20">Trade Dis%</th>
                          </>
                        )}
                        <th className="py-3 px-3 text-right w-28">Cost Price (₹)</th>
                        <th className="py-3 px-3 text-right w-20">Margin%</th>
                        <th className="py-3 px-3 text-right w-24">Price + Margin</th>
                        <th className="py-3 px-3 text-right w-32">Cust. Dis</th>
                        <th className="py-3 px-3 text-right w-28">Net Price</th>
                        <th className="py-3 px-3 text-right w-32">Amount (₹)</th>
                        <th className="py-3 px-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {estimateRows.length === 0 ? (
                        <tr>
                          <td colSpan={enableListPriceMode ? 14 : 12} className="py-12 text-center text-slate-400 text-sm">
                            No items added to estimate yet. Use the product search bar above to add items.
                          </td>
                        </tr>
                      ) : (
                        estimateRows.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}.</td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={row.description}
                                onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                className="w-full rounded bg-transparent px-1 py-0.5 font-semibold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.checked}
                                onChange={(e) => updateRow(row.id, 'checked', e.target.checked)}
                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-400"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={row.quantity}
                                onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-900 outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={row.unit}
                                onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
                              >
                                <option value="Pcs.">Pcs.</option>
                                <option value="Kgs.">Kgs.</option>
                                <option value="Mtr.">Mtr.</option>
                                <option value="Rolls">Rolls</option>
                                <option value="Sets">Sets</option>
                                <option value="Ft.">Ft.</option>
                              </select>
                            </td>

                            {/* Optional List Price & Trade Dis% columns when Flag 1 is ON */}
                            {enableListPriceMode && (
                              <>
                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={row.listPrice}
                                    onChange={(e) => updateRow(row.id, 'listPrice', parseFloat(e.target.value) || 0)}
                                    className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-semibold text-slate-700 outline-none focus:border-blue-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={row.discountPercentage}
                                    onChange={(e) =>
                                      updateRow(row.id, 'discountPercentage', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-semibold text-emerald-700 outline-none focus:border-blue-500"
                                  />
                                </td>
                              </>
                            )}

                            {/* Cost Price */}
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={row.costPrice}
                                onChange={(e) => updateRow(row.id, 'costPrice', parseFloat(e.target.value) || 0)}
                                className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-bold text-slate-900 outline-none focus:border-blue-500"
                              />
                            </td>

                            {/* Margin % */}
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.5"
                                value={row.marginPercentage}
                                onChange={(e) => updateRow(row.id, 'marginPercentage', parseFloat(e.target.value) || 0)}
                                className="w-16 rounded border border-blue-200 bg-blue-50/50 px-2 py-1 text-right font-bold text-blue-700 outline-none focus:border-blue-500"
                              />
                            </td>

                            {/* Price After Margin */}
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-500">
                              {formatINR(Number((row.costPrice * (1 + (row.marginPercentage || 0) / 100)).toFixed(2)))}
                            </td>

                            {/* Customer Discount (supports % and Flat ₹ when Flag 2 is ON) */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={row.discount || ''}
                                  placeholder="0"
                                  onChange={(e) => updateRow(row.id, 'discount', parseFloat(e.target.value) || 0)}
                                  className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-semibold text-emerald-700 outline-none focus:border-blue-500"
                                />
                                {enableFlatRupeeDiscount ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRow(
                                        row.id,
                                        'discountType',
                                        row.discountType === 'RUPEE' ? 'PERCENT' : 'RUPEE'
                                      )
                                    }
                                    className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border cursor-pointer ${
                                      row.discountType === 'RUPEE'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    }`}
                                    title={
                                      row.discountType === 'RUPEE'
                                        ? 'Flat ₹ Cash Discount (Click to switch to %)'
                                        : '% Percentage Discount (Click to switch to ₹)'
                                    }
                                  >
                                    {row.discountType === 'RUPEE' ? '₹' : '%'}
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">%</span>
                                )}
                              </div>
                            </td>

                            {/* Net Price */}
                            <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                              {formatINR(row.price)}
                            </td>

                            {/* Amount */}
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              {formatINR(row.lineTotal)}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => removeRow(row.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {/* Totals Table Footer */}
                    {estimateRows.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={3} className="py-3 px-4 text-left font-black tracking-wider uppercase">
                            Totals c/o
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-left font-black text-blue-700">
                            {summary.totalUnits.toFixed(2)} Units
                          </td>
                          <td colSpan={enableListPriceMode ? 7 : 5} className="py-3 px-3 text-right text-slate-500 font-semibold">
                            Total Estimate:
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-700 text-sm font-black">
                            {formatINR(summary.totalAmount)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Post-WhatsApp Share Notice Banner */}
                {whatsappSharedNotice && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Estimate Shared via WhatsApp!</p>
                        <p className="text-xs text-emerald-700">Estimate was prepared for <b>{selectedCustomer.customer_name}</b>. Ready to start fresh for the next customer?</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={clearCurrentEstimateDirect}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Clear & Start Next Estimate</span>
                      </button>
                      <button
                        onClick={() => setWhatsappSharedNotice(false)}
                        className="rounded-xl border border-emerald-200 bg-white p-2 text-slate-500 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Dismiss notice"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Section C: Summary & Action Buttons */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-2">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Total Items: <b className="text-slate-900">{summary.itemCount}</b>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      Total Units: <b className="text-blue-700">{summary.totalUnits} Units</b>
                    </span>
                    {summary.totalSavings > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">
                          Discount Savings: {formatINR(summary.totalSavings)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Big Total Box */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Estimated Budget</span>
                      <div className="text-2xl font-black text-emerald-600">{formatINR(summary.totalAmount)}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={clearCurrentEstimate}
                        disabled={estimateRows.length === 0}
                        className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Clear all items and start next estimate"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                        <span>Clear Estimate</span>
                      </button>

                      <button
                        onClick={openPrintSlip}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <Printer className="h-4 w-4 text-slate-600" />
                        <span>Print Slip</span>
                      </button>

                      <button
                        onClick={shareViaWhatsApp}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>WhatsApp (Free)</span>
                      </button>

                      <button
                        onClick={saveQuotationToBackend}
                        disabled={isSavingQuote || estimateRows.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        <span>{isSavingQuote ? 'Saving...' : 'Save Estimate'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: PRODUCTS CATALOG */}
          {/* ============================================================ */}
          {activePage === 'Products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products Catalog</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Manage hardware, pipes, fittings, motors, and wholesale pricing
                  </p>
                </div>
                <button
                  onClick={() => setShowNewProductModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Filter products by code, name, or unit..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-3">Unit</th>
                        {enableListPriceMode && (
                          <>
                            <th className="py-3 px-4 text-right">List Price (₹)</th>
                            <th className="py-3 px-3 text-right">Dis%</th>
                          </>
                        )}
                        <th className="py-3 px-4 text-right">Cost Price (₹)</th>
                        <th className="py-3 px-3 text-right">Margin%</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-600">{p.product_code}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.product_name}</td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
                              {p.unit}
                            </span>
                          </td>
                          {enableListPriceMode && (
                            <>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                {formatINR(p.list_price)}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-600">
                                {p.discount_percentage}%
                              </td>
                            </>
                          )}
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(p.cost_price)}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                              +{p.margin_percentage ?? 15}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setEditProduct(p)
                              }}
                              className="rounded p-1 text-slate-400 hover:text-blue-600 mr-2 cursor-pointer"
                              title="Edit product"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete ${p.product_name}?`)) {
                                  await fetch(`${API_BASE}/products/${p.id}`, { method: 'DELETE' })
                                  loadProducts()
                                }
                              }}
                              className="rounded p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: CUSTOMERS DIRECTORY */}
          {/* ============================================================ */}
          {activePage === 'Customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Client list, counter walk-ins, and phone records
                  </p>
                </div>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Customer</span>
                </button>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.customer_name}</td>
                          <td className="py-3 px-4 text-slate-600">{c.phone || 'N/A'}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedCustomer(c)
                                setActivePage('Estimator')
                              }}
                              className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              New Estimate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: ADMIN SETTINGS & FEATURE FLAGS */}
          {/* ============================================================ */}
          {activePage === 'Settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Settings & Pricing Modes</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Configure feature flags and counter pricing behaviors for Sri Venkateshwara Trading & Co.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Flag 1: List Price Mode */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Feature Flag 1
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          enableListPriceMode ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {enableListPriceMode ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Manufacturer List Price & Trade Discount</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      <b>Enabled:</b> Product catalog and Estimator show manufacturer List Price and Trade Discount % columns to derive Cost Price.
                      <br />
                      <br />
                      <b>Disabled (Default):</b> Direct Cost Price counter mode without list price and manufacturer discount overhead.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Toggle Mode:</span>
                    <button
                      type="button"
                      onClick={() => toggleListPriceMode(!enableListPriceMode)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableListPriceMode ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enableListPriceMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Feature Flag 2: Flat Rupee Cash Discount */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Feature Flag 2
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          enableFlatRupeeDiscount ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {enableFlatRupeeDiscount ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Flat Rupee (₹) Discount Round-off</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      <b>Enabled (Default):</b> Allows switching line item customer discounts between percentage (%) and flat rupee (₹) cash discounts for quick customer bill round-offs.
                      <br />
                      <br />
                      <b>Disabled:</b> Discounts are strictly percentage (%) based.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Toggle Mode:</span>
                    <button
                      type="button"
                      onClick={() => toggleFlatRupeeDiscount(!enableFlatRupeeDiscount)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableFlatRupeeDiscount ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enableFlatRupeeDiscount ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: DASHBOARD */}
          {/* ============================================================ */}
          {activePage === 'Dashboard' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotations & Estimates</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Recent estimate records and counter operations
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActivePage('Estimator')}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Estimate</span>
                  </button>
                </div>
              </div>

              {/* Quotations History Table */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Recent Estimate History</h3>
                  <span className="text-xs text-slate-500 font-semibold">{quotations.length} records</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Est No</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4 text-right">Units</th>
                        <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {quotations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No estimates generated yet. Create one from the Estimator tab.
                          </td>
                        </tr>
                      ) : (
                        quotations.map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-blue-700">{q.quotation_number}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{q.customer_name}</td>
                            <td className="py-3 px-4 text-slate-500">{q.phone || 'N/A'}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-700">
                              {Number(q.total_units || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                              {formatINR(q.total)}
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(q.created_at).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={async () => {
                                  const res = await fetch(`${API_BASE}/quotations/${q.id}`)
                                  const data = await res.json()
                                  if (data.success) {
                                    setPrintQuoteData({
                                      invoiceNo: q.quotation_number,
                                      partyName: q.customer_name,
                                      phone: q.phone,
                                      dated: new Date(q.created_at).toLocaleDateString('en-GB'),
                                      totalUnits: q.total_units,
                                      totalAmount: q.total,
                                      items: data.quotation.items.map((it: { id: number; product_id: number | null; description: string; quantity: number; unit?: string; list_price?: number; discount_percentage?: number; price: number; line_total: number }) => ({
                                        id: String(it.id),
                                        productId: it.product_id,
                                        productCode: '',
                                        description: it.description,
                                        checked: false,
                                        quantity: it.quantity,
                                        unit: it.unit || 'Pcs.',
                                        listPrice: it.list_price || 0,
                                        discountPercentage: it.discount_percentage || 0,
                                        price: it.price,
                                        lineTotal: it.line_total,
                                      })),
                                    })
                                    setShowPrintModal(true)
                                  }
                                }}
                                className="rounded bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200"
                              >
                                View / Print
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* 3. PRINT ESTIMATE SLIP MODAL (REPRODUCING PAPER INVOICE) */}
      {/* ============================================================ */}
      {showPrintModal && printQuoteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <span className="font-bold text-slate-800 text-sm">Official Estimate Slip Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={sharePrintSlipViaWhatsApp}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share WhatsApp</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print to Paper</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* PHYSICAL RECEIPT REPRODUCTION CONTAINER */}
            <div id="printable-estimate-slip" className="border border-slate-400 p-4 font-mono text-[11px] text-black">
              {/* Header Box */}
              <div className="flex justify-between items-start border-b border-slate-400 pb-2">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase">Sri Venkateshwara Trading & Co.</div>
                  <div>
                    Party Details : <b>{printQuoteData.partyName}</b>
                  </div>
                  {printQuoteData.phone && <div>Phone : {printQuoteData.phone}</div>}
                </div>
                <div className="text-center">
                  <div className="text-base font-bold uppercase tracking-wider">ESTIMATION</div>
                  <div className="text-[10px] italic">Original Copy</div>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    Invoice No. : <b>{printQuoteData.invoiceNo}</b>
                  </div>
                  <div>Dated : {printQuoteData.dated}</div>
                </div>
              </div>

              {/* Items Grid */}
              <table className="w-full mt-3 border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-t border-slate-400 font-bold uppercase">
                    <th className="py-1 px-1 text-center w-8">S.N.</th>
                    <th className="py-1 px-2 text-left">Description of Goods</th>
                    <th className="py-1 px-1 text-center w-8">Chek</th>
                    <th className="py-1 px-2 text-right w-16">Qty.</th>
                    <th className="py-1 px-1 text-left w-10">Unit</th>
                    <th className="py-1 px-2 text-right w-16">List</th>
                    <th className="py-1 px-1 text-right w-12">Dis%</th>
                    <th className="py-1 px-2 text-right w-16">Price</th>
                    <th className="py-1 px-2 text-right w-20">Amount(₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printQuoteData.items.map((it, idx) => (
                    <tr key={idx} className="leading-tight">
                      <td className="py-1 px-1 text-center">{idx + 1}.</td>
                      <td className="py-1 px-2 font-medium">{it.description}</td>
                      <td className="py-1 px-1 text-center font-mono text-[11px]">{it.checked ? '✓' : '☐'}</td>
                      <td className="py-1 px-2 text-right font-bold">{Number(it.quantity).toFixed(2)}</td>
                      <td className="py-1 px-1 text-left">{it.unit}</td>
                      <td className="py-1 px-2 text-right">{Number(it.listPrice).toFixed(2)}</td>
                      <td className="py-1 px-1 text-right">{Number(it.discountPercentage).toFixed(2)}</td>
                      <td className="py-1 px-2 text-right font-semibold">{Number(it.price).toFixed(2)}</td>
                      <td className="py-1 px-2 text-right font-bold">{Number(it.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-400 font-bold">
                    <td colSpan={3} className="py-2 px-2 text-left uppercase">
                      Totals c/o
                    </td>
                    <td colSpan={2} className="py-2 px-2 text-left font-black">
                      {printQuoteData.totalUnits.toFixed(2)} Units
                    </td>
                    <td colSpan={3} className="py-2 px-2 text-right uppercase">
                      Total:
                    </td>
                    <td className="py-2 px-2 text-right font-black text-sm">
                      {Number(printQuoteData.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-6 flex justify-between items-end text-[9px] text-slate-500 pt-4 border-t border-slate-300">
                <div>* Estimates are valid for 3 working days from date of issue.</div>
                <div className="text-right">For Sri Venkateshwara Trading & Co.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MODALS: NEW CUSTOMER / PRODUCT / EDIT */}
      {/* ============================================================ */}
      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add New Customer</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel, Kondalu"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add New Product to Catalog</h3>
              <button onClick={() => setShowNewProductModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description of Goods *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashirwad 3/4 CPVC Pipe, Steel Sink, FRP Chamber"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Code / SKU</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Pcs.">Pcs.</option>
                    <option value="Kgs.">Kgs.</option>
                    <option value="Mtr.">Mtr.</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Sets">Sets</option>
                    <option value="Ft.">Ft.</option>
                  </select>
                </div>
              </div>

              {enableListPriceMode ? (
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">List (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="462.00"
                      value={newProdList}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || ''
                        setNewProdList(val)
                        const listNum = typeof val === 'number' ? val : 0
                        const disNum = typeof newProdDis === 'number' ? newProdDis : 0
                        if (listNum > 0) {
                          setNewProdCost(Number((listNum * (1 - disNum / 100)).toFixed(2)))
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Trade Dis%</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="54.00"
                      value={newProdDis}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || ''
                        setNewProdDis(val)
                        const listNum = typeof newProdList === 'number' ? newProdList : 0
                        const disNum = typeof val === 'number' ? val : 0
                        if (listNum > 0) {
                          setNewProdCost(Number((listNum * (1 - disNum / 100)).toFixed(2)))
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Auto"
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(parseFloat(e.target.value) || '')}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 text-slate-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Margin%</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="15"
                      value={newProdMargin}
                      onChange={(e) => setNewProdMargin(parseFloat(e.target.value) || '')}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-blue-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="175.00"
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(parseFloat(e.target.value) || '')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Margin (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="15"
                      value={newProdMargin}
                      onChange={(e) => setNewProdMargin(parseFloat(e.target.value) || '')}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-blue-700"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Save & Add to Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Edit Product: {editProduct.product_name}</h3>
              <button onClick={() => setEditProduct(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await fetch(`${API_BASE}/products/${editProduct.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    productCode: editProduct.product_code,
                    productName: editProduct.product_name,
                    unit: editProduct.unit,
                    listPrice: editProduct.list_price,
                    discountPercentage: editProduct.discount_percentage,
                    costPrice: editProduct.cost_price,
                    marginPercentage: editProduct.margin_percentage,
                    stockQuantity: editProduct.stock_quantity,
                  }),
                })
                loadProducts()
                setEditProduct(null)
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description of Goods</label>
                <input
                  type="text"
                  required
                  value={editProduct.product_name}
                  onChange={(e) => setEditProduct({ ...editProduct, product_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Code</label>
                  <input
                    type="text"
                    value={editProduct.product_code}
                    onChange={(e) => setEditProduct({ ...editProduct, product_code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={editProduct.unit}
                    onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Pcs.">Pcs.</option>
                    <option value="Kgs.">Kgs.</option>
                    <option value="Mtr.">Mtr.</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Sets">Sets</option>
                    <option value="Ft.">Ft.</option>
                  </select>
                </div>
              </div>

              {enableListPriceMode ? (
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">List (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProduct.list_price}
                      onChange={(e) => {
                        const list = parseFloat(e.target.value) || 0
                        const dis = editProduct.discount_percentage || 0
                        const cost = Number((list * (1 - dis / 100)).toFixed(2))
                        setEditProduct({ ...editProduct, list_price: list, cost_price: cost })
                      }}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Trade Dis%</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProduct.discount_percentage}
                      onChange={(e) => {
                        const dis = parseFloat(e.target.value) || 0
                        const list = editProduct.list_price || 0
                        const cost = Number((list * (1 - dis / 100)).toFixed(2))
                        setEditProduct({ ...editProduct, discount_percentage: dis, cost_price: cost })
                      }}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProduct.cost_price}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, cost_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Margin%</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editProduct.margin_percentage ?? 15}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, margin_percentage: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-2.5 py-2 text-xs outline-none focus:border-blue-500 font-bold text-blue-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProduct.cost_price}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, cost_price: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Margin (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editProduct.margin_percentage ?? 15}
                      onChange={(e) =>
                        setEditProduct({ ...editProduct, margin_percentage: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-blue-700"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App