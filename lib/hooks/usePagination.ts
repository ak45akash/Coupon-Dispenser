'use client'

import { useState, useEffect } from 'react'

interface UsePaginationOptions {
  defaultPageSize?: number
  localStorageKey: string
}

interface UsePaginationReturn<T> {
  currentPage: number
  pageSize: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  totalPages: number
  getPaginatedData: (dataArray: T[]) => T[]
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions
): UsePaginationReturn<T> {
  const { defaultPageSize = 10, localStorageKey } = options

  // Load page size from localStorage or use default
  const [pageSize, setPageSizeState] = useState(() => {
    if (typeof window === 'undefined') return defaultPageSize
    const saved = localStorage.getItem(localStorageKey)
    return saved ? parseInt(saved, 10) : defaultPageSize
  })

  const [currentPage, setCurrentPage] = useState(1)

  // Save page size to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, pageSize.toString())
    }
  }, [pageSize, localStorageKey])

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  // Calculate total pages
  const totalPages = Math.ceil(data.length / pageSize)

  // Clamp current page to valid range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // Update page size
  const setPageSize = (size: number) => {
    setPageSizeState(size)
  }

  // Get paginated data
  const getPaginatedData = (dataArray: T[]) => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return dataArray.slice(startIndex, endIndex)
  }

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    getPaginatedData,
  }
}

