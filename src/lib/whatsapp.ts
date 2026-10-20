import type { PrintQuoteData } from '../types'

/**
 * Builds formatted plain text for WhatsApp quotation sharing
 */
export function generateWhatsAppMessage(data: PrintQuoteData): string {
  let msg = `🌾 *Sri Venkateshwara Trading & Co - ESTIMATION*\n`
  msg += `Estimate No: ${data.invoiceNo}\n`
  msg += `Party Details: ${data.partyName}\n`
  msg += `Date: ${data.dated}\n`
  msg += `---------------------------------\n`

  data.items.forEach((r, idx) => {
    msg += `${idx + 1}. ${r.description} (${r.quantity} ${r.unit}) - ₹${r.lineTotal.toFixed(2)}\n`
  })

  msg += `---------------------------------\n`
  msg += `*Totals c/o:* ${data.totalUnits} Units\n`
  if (data.discountAmount && data.discountAmount > 0) {
    const gross = data.grossTotal || (data.totalAmount + data.discountAmount)
    msg += `*Subtotal:* ₹${gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
    msg += `*Discount:* -₹${data.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
  }
  msg += `*Total Estimate:* ₹${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`
  msg += `---------------------------------\n`
  msg += `Thank you for your business!`

  return msg
}

/**
 * Generates direct wa.me link with URL-encoded message payload
 */
export function getWhatsAppShareUrl(data: PrintQuoteData): string {
  const phone = data.phone ? data.phone.replace(/[^0-9]/g, '') : ''
  const msg = generateWhatsAppMessage(data)
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}
