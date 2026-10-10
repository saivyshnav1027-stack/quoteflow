/**
 * Helper utilities for Date-based sequential estimate numbering: YYMMDDA1, YYMMDDA2...
 * Example: 261010A1, 261010A2 for October 10, 2026.
 */

export function getTodayDatePrefix(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

export function parseEstimateSequence(quotationNumber: string, datePrefix: string): number | null {
  if (!quotationNumber) return null
  const regex = new RegExp(`^(?:EST-)?${datePrefix}A(\\d+)$`, 'i')
  const match = String(quotationNumber).trim().match(regex)
  if (match) {
    const seq = parseInt(match[1], 10)
    return isNaN(seq) ? null : seq
  }
  return null
}

export function getNextEstimateNumber(
  existingNumbers: string[],
  date: Date = new Date()
): string {
  const prefix = getTodayDatePrefix(date)
  let maxSeq = 0

  for (const num of existingNumbers) {
    const seq = parseEstimateSequence(num, prefix)
    if (seq !== null && seq > maxSeq) {
      maxSeq = seq
    }
  }

  return `${prefix}A${maxSeq + 1}`
}

export function incrementEstimateNumber(
  currentEstimateNo: string,
  date: Date = new Date()
): string {
  const prefix = getTodayDatePrefix(date)
  const seq = parseEstimateSequence(currentEstimateNo, prefix)
  if (seq !== null) {
    return `${prefix}A${seq + 1}`
  }
  return `${prefix}A1`
}
