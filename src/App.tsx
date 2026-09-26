import { useEffect, useState, useMemo } from 'react'
import {
  Calculator,
  Package,
  Users,
  LayoutDashboard,
  Tags,
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
  FileCheck,
  Check,
  Percent,
} from 'lucide-react'

const API_BASE = '/api'

// ============================================================
// TYPES
// ============================================================
type CustomerType = {
  id: number
  type_name: string
  markup_percentage: number
}

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
  price: number
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

function App() {
  const [activePage, setActivePage] = useState<'Estimator' | 'Products' | 'Customers' | 'Dashboard' | 'Customer Types'>('Estimator')

  // Global Data
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; isUsingTurso: boolean; message: string }>({
    isConnected: false,
    isUsingTurso: false,
    message: 'Connecting to database...',
  })

  // ============================================================
  // ESTIMATOR STATE
  // ============================================================
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>({
    id: 1,
    customer_name: 'Kondalu',
    phone: '+91 98480 12345',
    customer_type_id: 1,
    type_name: 'Type A (Retail Regular)',
    markup_percentage: 0,
  })

  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>([])
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

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
  const [newCustTypeId, setNewCustTypeId] = useState(1)

  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdCode, setNewProdCode] = useState('')
  const [newProdUnit, setNewProdUnit] = useState('Pcs.')
  const [newProdList, setNewProdList] = useState<number | ''>('')
  const [newProdDis, setNewProdDis] = useState<number | ''>('')
  const [newProdCost, setNewProdCost] = useState<number | ''>('')

  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editTier, setEditTier] = useState<CustomerType | null>(null)
  const [tierMarkupInput, setTierMarkupInput] = useState<number>(0)

  // ============================================================
  // LOADERS
  // ============================================================
  const checkDb = async () => {
    try {
      const res = await fetch(`${API_BASE}/test-db`)
      const data = await res.json()
      setDbStatus({
        isConnected: data.success,
        isUsingTurso: data.isUsingTurso || false,
        message: data.message,
      })
    } catch {
      setDbStatus({
        isConnected: false,
        isUsingTurso: false,
        message: 'Backend server not responding on port 3000',
      })
    }
  }

  const loadCustomerTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-types`)
      const data = await res.json()
      setCustomerTypes(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`)
      const data = await res.json()
      setCustomers(data)
      if (data.length > 0 && !selectedCustomer) {
        setSelectedCustomer(data[0])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`)
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadQuotations = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotations`)
      const data = await res.json()
      setQuotations(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    checkDb()
    loadCustomerTypes()
    loadCustomers()
    loadProducts()
    loadQuotations()
  }, [])

  // ============================================================
  // ESTIMATOR CALCULATIONS
  // ============================================================
  const calculateRow = (row: EstimateRow, markupPct: number): EstimateRow => {
    let basePrice = row.listPrice
    if (row.discountPercentage > 0) {
      basePrice = Number((row.listPrice * (1 - row.discountPercentage / 100)).toFixed(2))
    }
    if (markupPct > 0) {
      basePrice = Number((basePrice * (1 + markupPct / 100)).toFixed(2))
    }
    const lineTotal = Number((basePrice * row.quantity).toFixed(2))
    return {
      ...row,
      price: basePrice,
      lineTotal,
    }
  }

  const addProductToEstimate = (prod: Product) => {
    const markup = selectedCustomer?.markup_percentage || 0
    const newRow: EstimateRow = calculateRow(
      {
        id: Math.random().toString(36).substring(2, 9),
        productId: prod.id,
        productCode: prod.product_code,
        description: prod.product_name,
        checked: true,
        quantity: 1,
        unit: prod.unit || 'Pcs.',
        listPrice: prod.list_price || 0,
        discountPercentage: prod.discount_percentage || 0,
        price: 0,
        lineTotal: 0,
      },
      markup
    )
    setEstimateRows((prev) => [...prev, newRow])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const updateRow = (id: string, field: keyof EstimateRow, val: any) => {
    const markup = selectedCustomer?.markup_percentage || 0
    setEstimateRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: val }
        return calculateRow(updated, markup)
      })
    )
  }

  const removeRow = (id: string) => {
    setEstimateRows((prev) => prev.filter((r) => r.id !== id))
  }

  // Recalculate all rows if customer markup changes
  useEffect(() => {
    const markup = selectedCustomer?.markup_percentage || 0
    setEstimateRows((prev) => prev.map((r) => calculateRow(r, markup)))
  }, [selectedCustomer])

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

  // Load the 26 real items from the user's uploaded slip with 1 click!
  const loadRealReceiptItems = () => {
    if (products.length === 0) return
    const kondaluCust = customers.find((c) => c.customer_name.toLowerCase().includes('kondalu')) || {
      id: 1,
      customer_name: 'Kondalu',
      phone: '+91 98480 12345',
      customer_type_id: 1,
      type_name: 'Type A (Retail Regular)',
      markup_percentage: 0,
    }
    setSelectedCustomer(kondaluCust)

    // Quantities matching the slip
    const receiptQuantities: Record<string, number> = {
      'LD 3*20 (28 de)': 40.0,
      'Yellow Tubing Nandi Flex': 52.28,
      'LD 3*15 (5b de)': 75.0,
      'LD 4*15 (5b u)': 75.0,
      'LD 4*20 (6b de)': 120.0,
      '9" Waste Coupling': 3.0,
      '6" Waste Coupling': 4.0,
      '75mm Necko Clamps': 20.0,
      '110MM NECKOCLAMPS': 20.0,
      'Nandi 63MM Pvc Elbow (H)': 15.0,
      'Nandi 63MM Pvc Tee (H)': 15.0,
      'Ashirwad 3/4" CPVC PIPE SDR 13.5': 50.0,
      'Ashirwad 1" CPVC PIPE SDR 13.5': 25.0,
      'Ashirwad Cpvc 1" Pipe SDR11': 25.0,
      'WC Harpan': 2.0,
      '18*22 Steel Sink': 2.0,
      '12*12 Beed Chamber': 3.0,
      '24*24 FRP Chamber': 1.0,
      'Ashirwad SWR 75mm Plain Bend': 15.0,
      'Ashirwad SWR 75MM Nani Trap': 15.0,
      'Ashirwad 75MM SWR Pipe': 10.0,
      'Ashirwad 110MM SWR Pipe': 10.0,
      'Nandi 75MM Swr Pipe': 10.0,
      'Nandi 110MM Swr Pipe': 10.0,
      '110MM PVC Pipe Nandi': 10.0,
      '90MM PVC Pipe Nandi': 10.0,
    }

    const rows: EstimateRow[] = products.map((p) => {
      const qty = receiptQuantities[p.product_name] || 1
      return calculateRow(
        {
          id: Math.random().toString(36).substring(2, 9),
          productId: p.id,
          productCode: p.product_code,
          description: p.product_name,
          checked: true,
          quantity: qty,
          unit: p.unit || 'Pcs.',
          listPrice: p.list_price,
          discountPercentage: p.discount_percentage,
          price: 0,
          lineTotal: 0,
        },
        0
      )
    })

    setEstimateRows(rows)
  }

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
        customerId: selectedCustomer.id || null,
        customerName: selectedCustomer.customer_name || 'Guest Walk-In',
        customerPhone: selectedCustomer.phone || '',
        customerTypeId: selectedCustomer.customer_type_id || 1,
        markupPercentage: selectedCustomer.markup_percentage || 0,
        items: estimateRows.map((r) => ({
          productId: r.productId,
          description: r.description,
          quantity: r.quantity,
          unit: r.unit,
          listPrice: r.listPrice,
          discountPercentage: r.discountPercentage,
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
      } else {
        alert('Failed to save quotation: ' + data.message)
      }
    } catch (err) {
      console.error(err)
      alert('Network error saving quotation')
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
  }

  // Open Print Modal for Current Active Estimate
  const openPrintSlip = () => {
    if (estimateRows.length === 0) {
      alert('Add products to preview the estimate slip.')
      return
    }
    setPrintQuoteData({
      invoiceNo: '2354',
      partyName: selectedCustomer.customer_name,
      phone: selectedCustomer.phone,
      dated: new Date().toLocaleDateString('en-GB') + ' (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
      totalUnits: summary.totalUnits,
      totalAmount: summary.totalAmount,
      items: estimateRows,
    })
    setShowPrintModal(true)
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
          customerTypeId: Number(newCustTypeId),
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
                onClick={() => setActivePage('Estimator')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  activePage === 'Estimator'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Estimator</span>
              </button>

              <button
                onClick={() => setActivePage('Products')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
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
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  activePage === 'Customers'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Customers ({customers.length})</span>
              </button>

              <button
                onClick={() => setActivePage('Customer Types')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  activePage === 'Customer Types'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Tags className="h-4 w-4" />
                <span>Customer Types</span>
              </button>

              <button
                onClick={() => setActivePage('Dashboard')}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  activePage === 'Dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
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

          <div className="flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              SK
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-white">Shopkeeper</span>
              <span className="truncate text-[10px] text-slate-400">Single User Admin</span>
            </div>
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
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">Kondalu Slip Format</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadRealReceiptItems}
              className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Load 26 Slip Items (#2354)</span>
            </button>
            <div className="text-xs text-slate-500">
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
                  <span className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                    Est No: #{Math.floor(1000 + Math.random() * 9000)}
                  </span>
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
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                {c.type_name || 'Retail'}
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
                          type_name: 'Type A (Retail Regular)',
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
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            {selectedCustomer.type_name || 'Standard Tier'}
                            {Number(selectedCustomer.markup_percentage) > 0
                              ? ` (+${selectedCustomer.markup_percentage}% Markup)`
                              : ' (0% Markup)'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{selectedCustomer.phone || 'Walk-in / Cash Customer'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">Active customer for this quote</div>
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
                                  <span className="font-bold text-slate-900">List: {formatINR(p.list_price)}</span>
                                  {p.discount_percentage > 0 && (
                                    <span className="text-xs text-emerald-600 font-semibold">
                                      Dis: {p.discount_percentage}%
                                    </span>
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

                {/* Estimate Line Items Table (Matches paper receipt) */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 select-none">
                        <th className="py-3 px-3 text-center w-12">S.N.</th>
                        <th className="py-3 px-3">Description of Goods</th>
                        <th className="py-3 px-2 text-center w-12">Chek</th>
                        <th className="py-3 px-3 text-right w-24">Qty.</th>
                        <th className="py-3 px-3 w-20">Unit</th>
                        <th className="py-3 px-3 text-right w-28">List Price</th>
                        <th className="py-3 px-3 text-right w-20">Dis%</th>
                        <th className="py-3 px-3 text-right w-28">Net Price</th>
                        <th className="py-3 px-3 text-right w-32">Amount (₹)</th>
                        <th className="py-3 px-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {estimateRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                            No items added to estimate yet. Use the search bar above or click "Load 26 Slip Items".
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
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={row.listPrice}
                                onChange={(e) => updateRow(row.id, 'listPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-right font-semibold text-slate-800 outline-none focus:border-blue-500"
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
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                              {formatINR(row.price)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatINR(row.lineTotal)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => removeRow(row.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {/* Totals Table Footer (Mirroring Paper Slip) */}
                    {estimateRows.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={3} className="py-3 px-4 text-left font-black tracking-wider uppercase">
                            Totals c/o
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-left font-black text-blue-700">
                            {summary.totalUnits.toFixed(2)} Units
                          </td>
                          <td colSpan={3} className="py-3 px-3 text-right text-slate-500 font-semibold">
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
                        onClick={() => setEstimateRows([])}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Clear estimate"
                      >
                        <RotateCcw className="h-4 w-4" />
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
                        <th className="py-3 px-4 text-right">List Price (₹)</th>
                        <th className="py-3 px-3 text-right">Dis%</th>
                        <th className="py-3 px-4 text-right">Cost Price (₹)</th>
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
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatINR(p.list_price)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            {p.discount_percentage}%
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">{formatINR(p.cost_price)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setEditProduct(p)
                              }}
                              className="rounded p-1 text-slate-400 hover:text-blue-600 mr-2"
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
                              className="rounded p-1 text-slate-400 hover:text-red-600"
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
                    Client list, phone numbers, and pricing tier associations
                  </p>
                </div>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
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
                        <th className="py-3 px-4">Customer Tier</th>
                        <th className="py-3 px-4">Applied Margin</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.customer_name}</td>
                          <td className="py-3 px-4 text-slate-600">{c.phone || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              {c.type_name || 'Standard'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            +{c.markup_percentage || 0}% Markup
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedCustomer(c)
                                setActivePage('Estimator')
                              }}
                              className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              New Quote
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
          {/* VIEW: CUSTOMER TYPES (TIER CONFIGURATION) */}
          {/* ============================================================ */}
          {activePage === 'Customer Types' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Types & Margins</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Configure default profit markup percentages per customer classification tier
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customerTypes.map((tier) => (
                  <div
                    key={tier.id}
                    className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          Tier ID #{tier.id}
                        </span>
                        <Percent className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{tier.type_name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Applied automatically to all estimates created for customers in this tier.
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Profit Margin</span>
                        <div className="text-2xl font-black text-emerald-600">+{tier.markup_percentage}%</div>
                      </div>
                      <button
                        onClick={() => {
                          setEditTier(tier)
                          setTierMarkupInput(tier.markup_percentage)
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Adjust Margin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: DASHBOARD */}
          {/* ============================================================ */}
          {activePage === 'Dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Dashboard</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Performance overview and recent estimate history for Sri Venkateshwara Trading & Co
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Catalog SKUs</span>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                  <span className="text-xs text-emerald-600 font-semibold">Real slip inventory loaded</span>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Customers</span>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
                  <span className="text-xs text-blue-600 font-semibold">Kondalu, Ramesh, Srinivas</span>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Estimates Generated</span>
                    <Calculator className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{quotations.length}</div>
                  <span className="text-xs text-slate-400">Archived in DB</span>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Database Mode</span>
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {dbStatus.isUsingTurso ? 'Turso Cloud' : 'Local SQLite'}
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold">100% Offline Ready</span>
                </div>
              </div>

              {/* Quotations History Table */}
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
                <h3 className="text-base font-bold text-slate-900 mb-4">Recent Estimate History</h3>
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
                                      items: data.quotation.items.map((it: any) => ({
                                        id: String(it.id),
                                        productId: it.product_id,
                                        productCode: '',
                                        description: it.description,
                                        checked: true,
                                        quantity: it.quantity,
                                        unit: it.unit || 'Pcs.',
                                        listPrice: it.list_price,
                                        discountPercentage: it.discount_percentage,
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
                      <td className="py-1 px-1 text-center font-bold">✓</td>
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Pricing Tier</label>
                <select
                  value={newCustTypeId}
                  onChange={(e) => setNewCustTypeId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                >
                  {customerTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type_name} (+{t.markup_percentage}% Markup)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
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
              <button onClick={() => setShowNewProductModal(false)} className="text-slate-400 hover:text-slate-600">
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">List Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="462.00"
                    value={newProdList}
                    onChange={(e) => setNewProdList(parseFloat(e.target.value) || '')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trade Dis%</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="54.00"
                    value={newProdDis}
                    onChange={(e) => setNewProdDis(parseFloat(e.target.value) || '')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto-calculated"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(parseFloat(e.target.value) || '')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  Save & Add to Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {editTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Adjust Tier Margin</h3>
            <p className="text-xs text-slate-500 mt-1">{editTier.type_name}</p>

            <div className="my-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Profit Markup Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                value={tierMarkupInput}
                onChange={(e) => setTierMarkupInput(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-base font-bold text-emerald-600 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditTier(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await fetch(`${API_BASE}/customer-types/${editTier.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ markup: tierMarkupInput }),
                  })
                  loadCustomerTypes()
                  setEditTier(null)
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Save Margin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Edit Product: {editProduct.product_name}</h3>
              <button onClick={() => setEditProduct(null)} className="text-slate-400 hover:text-slate-600">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">List Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.list_price}
                    onChange={(e) => setEditProduct({ ...editProduct, list_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trade Dis%</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editProduct.discount_percentage}
                    onChange={(e) => setEditProduct({ ...editProduct, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-500 font-bold text-emerald-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
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