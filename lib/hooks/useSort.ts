import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T> {
  key: keyof T | string
  direction: SortDirection
}

export function useSort<T>(
  data: T[],
  defaultSort?: SortConfig<T>
): {
  sortedData: T[]
  sortConfig: SortConfig<T> | null
  handleSort: (key: keyof T | string) => void
  setSortConfig: (config: SortConfig<T> | null) => void
} {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSort || null
  )

  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key)
      const bValue = getNestedValue(b, sortConfig.key)

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // Convert to string for comparison
      const aStr = String(aValue)
      const bStr = String(bValue)
      const comparison = aStr.localeCompare(bStr)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const handleSort = (key: keyof T | string) => {
    let direction: SortDirection = 'asc'
    
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc'
    }

    setSortConfig({ key, direction })
  }

  return { sortedData, sortConfig, handleSort, setSortConfig }
}

function getNestedValue(obj: any, path: string | keyof typeof obj): any {
  if (typeof path === 'string' && path.includes('.')) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }
  return obj[path as keyof typeof obj]
}

