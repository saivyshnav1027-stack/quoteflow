import React from 'react'

export interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden animate-pulse ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <th key={cIdx} className="p-3">
                <div className="h-3.5 bg-slate-200 rounded-md w-3/4 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/30">
              {Array.from({ length: columns }).map((_, cIdx) => (
                <td key={cIdx} className="p-3">
                  <div
                    className="h-3 bg-slate-100 rounded-md mx-auto"
                    style={{
                      width: `${Math.floor(50 + ((rIdx * 17 + cIdx * 29) % 45))}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export interface CardGridSkeletonProps {
  count?: number
  className?: string
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-card rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-6 w-12 bg-slate-100 rounded-full" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="pt-2 border-t border-slate-100 flex justify-between">
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
