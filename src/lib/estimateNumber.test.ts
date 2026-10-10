import { describe, it, expect } from 'vitest'
import {
  getTodayDatePrefix,
  parseEstimateSequence,
  getNextEstimateNumber,
  incrementEstimateNumber,
} from './estimateNumber'

describe('estimateNumber utilities', () => {
  const mockDate = new Date(2026, 9, 10) // Month index 9 = October; 2026-10-10

  it('generates correct YYMMDD date prefix', () => {
    expect(getTodayDatePrefix(mockDate)).toBe('261010')
  })

  it('parses sequence numbers correctly', () => {
    expect(parseEstimateSequence('261010A1', '261010')).toBe(1)
    expect(parseEstimateSequence('261010A42', '261010')).toBe(42)
    expect(parseEstimateSequence('EST-261010A5', '261010')).toBe(5)
    expect(parseEstimateSequence('261009A1', '261010')).toBeNull() // different day
    expect(parseEstimateSequence('EST-2354', '261010')).toBeNull() // old legacy format
  })

  it('generates next sequential number for today', () => {
    expect(getNextEstimateNumber([], mockDate)).toBe('261010A1')
    expect(getNextEstimateNumber(['261010A1'], mockDate)).toBe('261010A2')
    expect(getNextEstimateNumber(['261010A1', '261010A2', 'EST-261010A3'], mockDate)).toBe('261010A4')
    // Legacy numbers from previous days should not conflict
    expect(getNextEstimateNumber(['EST-2354', '261009A9'], mockDate)).toBe('261010A1')
  })

  it('increments current estimate number correctly', () => {
    expect(incrementEstimateNumber('261010A1', mockDate)).toBe('261010A2')
    expect(incrementEstimateNumber('261010A9', mockDate)).toBe('261010A10')
    // Old format resets to A1 for today
    expect(incrementEstimateNumber('2354', mockDate)).toBe('261010A1')
  })
})
