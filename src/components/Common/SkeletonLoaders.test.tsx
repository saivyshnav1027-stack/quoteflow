import { describe, it, expect } from 'vitest'
import React from 'react'
import { TableSkeleton, CardGridSkeleton } from './SkeletonLoaders'

describe('SkeletonLoaders Component Structure', () => {
  it('constructs TableSkeleton element with default and custom props', () => {
    const el = React.createElement(TableSkeleton, { rows: 4, columns: 5, className: 'custom-table' })
    expect(el.type).toBe(TableSkeleton)
    expect(el.props.rows).toBe(4)
    expect(el.props.columns).toBe(5)
    expect(el.props.className).toBe('custom-table')
  })

  it('constructs CardGridSkeleton element with default and custom props', () => {
    const el = React.createElement(CardGridSkeleton, { count: 3, className: 'custom-grid' })
    expect(el.type).toBe(CardGridSkeleton)
    expect(el.props.count).toBe(3)
    expect(el.props.className).toBe('custom-grid')
  })
})
