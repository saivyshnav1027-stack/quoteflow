import { useEffect, useState, useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Customer, Product, EstimateRow, Quotation, PrintQuoteData, ActivePage } from './types'
import { calculateRow as calcRow, calculateTotals } from './lib/pricing'
import { getWhatsAppShareUrl } from './lib/whatsapp'
import { getNextEstimateNumber, incrementEstimateNumber, getTodayDatePrefix } from './lib/estimateNumber'

import { LoginScreen } from './components/Auth/LoginScreen'
import { Sidebar } from './components/Layout/Sidebar'
import { DashboardView } from './components/Dashboard/DashboardView'
import { EstimatorView } from './components/Estimator/EstimatorView'
import { ProductsCatalog } from './components/Products/ProductsCatalog'
import { AddProductModal, type NewProductData } from './components/Products/AddProductModal'
import { EditProductModal } from './components/Products/EditProductModal'
import { CustomerDirectory } from './components/Customers/CustomerDirectory'
import { AddCustomerModal } from './components/Customers/AddCustomerModal'
import { AdminSettingsView } from './components/Settings/AdminSettingsView'
import { PrintSlipModal } from './components/Slip/PrintSlipModal'

import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from './lib/constants'

const API_BASE = '/api'

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sri_trading_auth') === 'true'
  })

  // Landing page: Default is ALWAYS Dashboard
  const [activePage, setActivePage] = useState<ActivePage>('Dashboard')

  // Stable sequential estimate number (YYMMDDA1 format)
  const [currentEstimateNo, setCurrentEstimateNo] = useState<string>(() => {
    const todayPrefix = getTodayDatePrefix()
    const stored = localStorage.getItem('sri_current_estimate_no')
    if (stored && stored.startsWith(todayPrefix)) {
      return stored
    }
    return `${todayPrefix}A1`
  })

  // Admin Feature Flags
  const [enableListPriceMode, setEnableListPriceMode] = useState<boolean>(() => {
    return localStorage.getItem('quoteflow_flag_list_price') === 'true'
  })
  const [enableFlatRupeeDiscount, setEnableFlatRupeeDiscount] = useState<boolean>(() => {
    const stored = localStorage.getItem('quoteflow_flag_rupee_discount')
    return stored !== null ? stored === 'true' : true
  })
  const [enablePriceAfterMargin, setEnablePriceAfterMargin] = useState<boolean>(() => {
    return localStorage.getItem('quoteflow_flag_price_after_margin') === 'true'
  })

  const toggleListPriceMode = (val: boolean) => {
    setEnableListPriceMode(val)
    localStorage.setItem('quoteflow_flag_list_price', String(val))
  }

  const toggleFlatRupeeDiscount = (val: boolean) => {
    setEnableFlatRupeeDiscount(val)
    localStorage.setItem('quoteflow_flag_rupee_discount', String(val))
  }

  const togglePriceAfterMargin = (val: boolean) => {
    setEnablePriceAfterMargin(val)
    localStorage.setItem('quoteflow_flag_price_after_margin', String(val))
  }

  // Global Data
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; isUsingTurso: boolean; message: string }>({
    isConnected: true,
    isUsingTurso: true,
    message: 'Turso Cloud DB Synchronized',
  })

  // Estimator State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(INITIAL_CUSTOMERS[0])
  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>([])
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null)
  const [editingEstimateNo, setEditingEstimateNo] = useState<string>('')
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [whatsappSharedNotice, setWhatsappSharedNotice] = useState(false)

  // Print Slip Modal State
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printQuoteData, setPrintQuoteData] = useState<PrintQuoteData | null>(null)

  // Modal Visibility States
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  // Loaders
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
        const nextNumStr = getNextEstimateNumber(data.map((q: Quotation) => q.quotation_number))
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

  // Estimator Calculations via pure engine
  const addProductToEstimate = (prod: Product) => {
    const cost = Number(prod.cost_price || 0)
    const margin = Number(prod.margin_percentage ?? 15)
    const newRow: EstimateRow = calcRow(
      {
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
      },
      enableListPriceMode
    )
    setEstimateRows((prev) => [...prev, newRow])
  }

  const updateRow = (id: string, field: keyof EstimateRow, val: any) => {
    setEstimateRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: val }
        return calcRow(updated, enableListPriceMode)
      })
    )
  }

  const removeRow = (id: string) => {
    setEstimateRows((prev) => prev.filter((r) => r.id !== id))
  }

  const summary = useMemo(() => {
    return calculateTotals(estimateRows)
  }, [estimateRows])

  // Save or Update Quotation
  const saveQuotationToBackend = async () => {
    if (estimateRows.length === 0) {
      alert('Please add at least one product to the estimate.')
      return
    }

    setIsSavingQuote(true)
    try {
      const isUpdating = editingQuotationId !== null
      const url = isUpdating ? `${API_BASE}/quotations/${editingQuotationId}` : `${API_BASE}/quotations`
      const method = isUpdating ? 'PUT' : 'POST'

      const payload = {
        quotationNumber: isUpdating ? editingEstimateNo : currentEstimateNo,
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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        const savedQuoteNo = data.quotation?.quotationNumber || (isUpdating ? editingEstimateNo : currentEstimateNo)
        setSaveSuccessMsg(
          isUpdating
            ? `Estimate #${savedQuoteNo} updated successfully!`
            : `Quotation saved! ID: ${savedQuoteNo}`
        )
        setTimeout(() => setSaveSuccessMsg(''), 4000)
        loadQuotations()

        setPrintQuoteData({
          invoiceNo: savedQuoteNo,
          partyName: selectedCustomer.customer_name,
          phone: selectedCustomer.phone,
          dated: `${new Date().toLocaleDateString('en-GB')} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          totalUnits: summary.totalUnits,
          totalAmount: summary.totalAmount,
          items: estimateRows,
        })

        if (isUpdating) {
          setEditingQuotationId(null)
          setEditingEstimateNo('')
          setEstimateRows([])
          const todayPrefix = getTodayDatePrefix()
          const stored = localStorage.getItem('sri_current_estimate_no')
          if (stored && stored.startsWith(todayPrefix)) {
            setCurrentEstimateNo(stored)
          } else {
            setCurrentEstimateNo(`${todayPrefix}A1`)
          }
        } else {
          const assignedNo = data.quotation?.quotationNumber || currentEstimateNo
          const nextNo = incrementEstimateNumber(assignedNo)
          setCurrentEstimateNo(nextNo)
          localStorage.setItem('sri_current_estimate_no', nextNo)
        }
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

  // WhatsApp Share
  const shareViaWhatsApp = () => {
    if (estimateRows.length === 0) {
      alert('Estimate is empty.')
      return
    }

    const url = getWhatsAppShareUrl({
      invoiceNo: currentEstimateNo,
      partyName: selectedCustomer.customer_name || 'Customer',
      phone: selectedCustomer.phone || '',
      dated: new Date().toLocaleDateString('en-GB'),
      totalUnits: summary.totalUnits,
      totalAmount: summary.totalAmount,
      items: estimateRows,
    })
    window.open(url, '_blank')
    setWhatsappSharedNotice(true)
    // Auto-save estimate to database when shared
    saveQuotationToBackend()
  }

  // Clear Estimate
  const clearCurrentEstimate = () => {
    if (editingQuotationId) {
      if (window.confirm('Cancel editing estimate and start a fresh estimate for the next customer?')) {
        cancelEditQuotation()
      }
      return
    }
    if (estimateRows.length === 0) return
    if (window.confirm('Clear all items and start a fresh estimate for the next customer?')) {
      clearCurrentEstimateDirect()
    }
  }

  const clearCurrentEstimateDirect = () => {
    setEditingQuotationId(null)
    setEditingEstimateNo('')
    setEstimateRows([])
    setWhatsappSharedNotice(false)
    const nextNo = incrementEstimateNumber(currentEstimateNo)
    setCurrentEstimateNo(nextNo)
    localStorage.setItem('sri_current_estimate_no', nextNo)
  }

  const cancelEditQuotation = () => {
    setEditingQuotationId(null)
    setEditingEstimateNo('')
    setEstimateRows([])
    setWhatsappSharedNotice(false)
    const todayPrefix = getTodayDatePrefix()
    const stored = localStorage.getItem('sri_current_estimate_no')
    if (stored && stored.startsWith(todayPrefix)) {
      setCurrentEstimateNo(stored)
    } else {
      setCurrentEstimateNo(`${todayPrefix}A1`)
    }
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
      dated: `${new Date().toLocaleDateString('en-GB')} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      totalUnits: summary.totalUnits,
      totalAmount: summary.totalAmount,
      items: estimateRows,
    })
    setShowPrintModal(true)
  }

  // Open Print Modal from Quotation History
  const handleViewQuotationPrintSlip = async (q: Quotation) => {
    try {
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
            checked: false,
            quantity: it.quantity,
            unit: it.unit || 'Pcs.',
            listPrice: it.list_price || 0,
            discountPercentage: it.discount_percentage || 0,
            costPrice: it.cost_price || 0,
            marginPercentage: it.margin_percentage || 15,
            discount: it.discount || 0,
            discountType: it.discount_type || 'PERCENT',
            price: it.price,
            lineTotal: it.line_total,
          })),
        })
        setShowPrintModal(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Open and Edit Quotation from History
  const handleEditQuotation = async (q: Quotation) => {
    try {
      const res = await fetch(`${API_BASE}/quotations/${q.id}`)
      const data = await res.json()
      if (data.success && data.quotation) {
        const quote = data.quotation
        setEditingQuotationId(q.id)
        setEditingEstimateNo(q.quotation_number)
        setCurrentEstimateNo(q.quotation_number)

        const matchedCustomer = customers.find((c) => c.id === q.customer_id)
        if (matchedCustomer) {
          setSelectedCustomer(matchedCustomer)
        } else {
          setSelectedCustomer({
            id: q.customer_id || 0,
            customer_name: q.customer_name || 'Guest Walk-In',
            phone: q.phone || '',
            customer_type_id: quote.customer_type_id || 1,
          })
        }

        const mappedRows: EstimateRow[] = (quote.items || []).map((it: any) => ({
          id: String(it.id || Math.random()),
          productId: it.product_id,
          productCode: '',
          description: it.description || 'Custom Item',
          checked: false,
          quantity: Number(it.quantity || 1),
          unit: it.unit || 'Pcs.',
          listPrice: Number(it.list_price || 0),
          discountPercentage: Number(it.discount_percentage || 0),
          costPrice: Number(it.cost_price || 0),
          marginPercentage: Number(it.margin_percentage ?? 15),
          discount: Number(it.discount || 0),
          discountType:
            String(it.discount_type || 'PERCENT').toUpperCase() === 'RUPEE' ||
            String(it.discount_type || '').toUpperCase() === 'FLAT'
              ? 'RUPEE'
              : 'PERCENT',
          price: Number(it.price || 0),
          lineTotal: Number(it.line_total || 0),
        }))

        setEstimateRows(mappedRows)
        setActivePage('Estimator')
      } else {
        alert('Failed to load quotation for editing: ' + (data.message || 'Quotation not found'))
      }
    } catch (e) {
      console.error('Error loading quotation for edit:', e)
      alert('Network error while loading quotation.')
    }
  }

  // Delete & Purge Quotation Handlers
  const handleDeleteQuotation = async (q: Quotation) => {
    if (confirm(`Delete estimate #${q.quotation_number} (${q.customer_name}) from the database?`)) {
      try {
        const res = await fetch(`${API_BASE}/quotations/${q.id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          loadQuotations()
        } else {
          alert('Failed to delete estimate: ' + (data.message || 'Unknown error'))
        }
      } catch (e) {
        console.error(e)
        alert('Failed to delete estimate')
      }
    }
  }

  const handlePurgeQuotations = async (timeline: 'weekly' | 'monthly' | 'all') => {
    const label =
      timeline === 'weekly'
        ? 'older than 7 days (Weekly)'
        : timeline === 'monthly'
        ? 'older than 30 days (Monthly)'
        : 'ALL estimate records'

    if (confirm(`Are you sure you want to delete estimates ${label}? This cannot be undone.`)) {
      try {
        const res = await fetch(`${API_BASE}/quotations?timeline=${timeline}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          alert(`Successfully deleted ${data.deletedCount ?? 0} estimate(s).`)
          loadQuotations()
        } else {
          alert('Failed to purge estimates: ' + (data.message || 'Unknown error'))
        }
      } catch (e) {
        console.error(e)
        alert('Failed to purge estimates')
      }
    }
  }

  // CRUD Handlers
  const handleCreateCustomer = async (customerName: string, phone: string) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        phone,
        customerTypeId: 1,
      }),
    })
    const data = await res.json()
    if (data.success) {
      loadCustomers()
      setSelectedCustomer(data.customer)
    }
  }

  const handleDeleteCustomer = async (c: Customer) => {
    if (confirm(`Delete customer ${c.customer_name}?`)) {
      await fetch(`${API_BASE}/customers/${c.id}`, { method: 'DELETE' })
      loadCustomers()
    }
  }

  const handleCreateProduct = async (prod: NewProductData) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: prod.productName,
        productCode: prod.productCode,
        unit: prod.unit,
        listPrice: prod.listPrice,
        discountPercentage: prod.discountPercentage,
        costPrice: prod.costPrice,
        marginPercentage: prod.marginPercentage,
        stockQuantity: 100,
      }),
    })
    const data = await res.json()
    if (data.success) {
      loadProducts()
      addProductToEstimate(data.product)
    }
  }

  const handleEditProduct = async (prod: Product) => {
    await fetch(`${API_BASE}/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productCode: prod.product_code,
        productName: prod.product_name,
        unit: prod.unit,
        listPrice: prod.list_price,
        discountPercentage: prod.discount_percentage,
        costPrice: prod.cost_price,
        marginPercentage: prod.margin_percentage,
        stockQuantity: prod.stock_quantity,
      }),
    })
    loadProducts()
  }

  const handleDeleteProduct = async (p: Product) => {
    if (confirm(`Delete ${p.product_name}?`)) {
      await fetch(`${API_BASE}/products/${p.id}`, { method: 'DELETE' })
      loadProducts()
    }
  }

  // Auth Handlers
  const handleLogin = () => {
    setIsAuthenticated(true)
    localStorage.setItem('sri_trading_auth', 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('sri_trading_auth')
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* 1. FIXED LEFT SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        productCount={products.length}
        customerCount={customers.length}
        dbStatus={dbStatus}
        onLogout={handleLogout}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="no-print sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Wholesale Depot & Agro-Trading Hub</span>
            <span className="hidden sm:inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              Station Road, Jammikunta
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>GSTIN: 36ABCDE1234F1Z5</span>
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline">Ph: +91 98480 12345</span>
          </div>
        </header>

        <main className="flex-1 p-8">
          {saveSuccessMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-800 shadow-sm animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {activePage === 'Dashboard' && (
            <DashboardView
              quotations={quotations}
              onCreateEstimateClick={() => setActivePage('Estimator')}
              onViewPrintSlip={handleViewQuotationPrintSlip}
              onEditQuotation={handleEditQuotation}
              onDeleteQuotation={handleDeleteQuotation}
              onPurgeQuotations={handlePurgeQuotations}
            />
          )}

          {activePage === 'Estimator' && (
            <EstimatorView
              currentEstimateNo={currentEstimateNo}
              onNewEstimateClick={clearCurrentEstimate}
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              onNewCustomerClick={() => setShowNewCustomerModal(true)}
              products={products}
              onAddProductToEstimate={addProductToEstimate}
              onAddNewProductClick={() => setShowNewProductModal(true)}
              estimateRows={estimateRows}
              onUpdateRow={updateRow}
              onRemoveRow={removeRow}
              summary={summary}
              enableListPriceMode={enableListPriceMode}
              enableFlatRupeeDiscount={enableFlatRupeeDiscount}
              enablePriceAfterMargin={enablePriceAfterMargin}
              onTogglePriceAfterMargin={togglePriceAfterMargin}
              whatsappSharedNotice={whatsappSharedNotice}
              onDismissWhatsAppNotice={() => setWhatsappSharedNotice(false)}
              onClearEstimateDirect={clearCurrentEstimateDirect}
              onClearEstimate={clearCurrentEstimate}
              onOpenPrintSlip={openPrintSlip}
              onShareWhatsApp={shareViaWhatsApp}
              onSaveEstimate={saveQuotationToBackend}
              isSavingQuote={isSavingQuote}
              isEditing={editingQuotationId !== null}
              editingEstimateNo={editingEstimateNo}
              onCancelEdit={cancelEditQuotation}
            />
          )}

          {activePage === 'Products' && (
            <ProductsCatalog
              products={products}
              enableListPriceMode={enableListPriceMode}
              onAddProductClick={() => setShowNewProductModal(true)}
              onEditProduct={(p) => setEditProduct(p)}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activePage === 'Customers' && (
            <CustomerDirectory
              customers={customers}
              onAddCustomerClick={() => setShowNewCustomerModal(true)}
              onSelectForEstimate={(c) => {
                setSelectedCustomer(c)
                setActivePage('Estimator')
              }}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activePage === 'Settings' && (
            <AdminSettingsView
              enableListPriceMode={enableListPriceMode}
              enableFlatRupeeDiscount={enableFlatRupeeDiscount}
              enablePriceAfterMargin={enablePriceAfterMargin}
              onToggleListPriceMode={toggleListPriceMode}
              onToggleFlatRupeeDiscount={toggleFlatRupeeDiscount}
              onTogglePriceAfterMargin={togglePriceAfterMargin}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <PrintSlipModal
        isOpen={showPrintModal}
        data={printQuoteData}
        onClose={() => setShowPrintModal(false)}
      />

      <AddCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onSubmit={handleCreateCustomer}
      />

      <AddProductModal
        isOpen={showNewProductModal}
        enableListPriceMode={enableListPriceMode}
        onClose={() => setShowNewProductModal(false)}
        onSave={handleCreateProduct}
      />

      <EditProductModal
        product={editProduct}
        enableListPriceMode={enableListPriceMode}
        onClose={() => setEditProduct(null)}
        onSave={handleEditProduct}
      />
    </div>
  )
}

export default App