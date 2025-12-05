import { renderHook, act } from '@testing-library/react'
import { useSort } from '@/lib/hooks/useSort'

interface TestItem {
  id: string
  name: string
  value: number
  date: string
}

const mockData: TestItem[] = [
  { id: '1', name: 'Charlie', value: 30, date: '2024-01-01' },
  { id: '2', name: 'Alice', value: 10, date: '2024-03-01' },
  { id: '3', name: 'Bob', value: 20, date: '2024-02-01' },
]

describe('useSort Hook', () => {
  it('should return unsorted data by default', () => {
    const { result } = renderHook(() => useSort(mockData))
    expect(result.current.sortedData).toEqual(mockData)
  })

  it('should sort by default key and direction', () => {
    const { result } = renderHook(() =>
      useSort(mockData, { key: 'name', direction: 'asc' })
    )
    expect(result.current.sortedData[0].name).toBe('Alice')
    expect(result.current.sortedData[1].name).toBe('Bob')
    expect(result.current.sortedData[2].name).toBe('Charlie')
  })

  it('should sort ascending when handleSort is called', () => {
    const { result } = renderHook(() => useSort(mockData))
    
    act(() => {
      result.current.handleSort('name')
    })

    expect(result.current.sortedData[0].name).toBe('Alice')
    expect(result.current.sortConfig?.key).toBe('name')
    expect(result.current.sortConfig?.direction).toBe('asc')
  })

  it('should sort descending on second click', () => {
    const { result } = renderHook(() => useSort(mockData))
    
    act(() => {
      result.current.handleSort('name')
    })
    
    act(() => {
      result.current.handleSort('name')
    })

    expect(result.current.sortedData[0].name).toBe('Charlie')
    expect(result.current.sortConfig?.direction).toBe('desc')
  })

  it('should reset to ascending when sorting different key', () => {
    const { result } = renderHook(() => useSort(mockData))
    
    act(() => {
      result.current.handleSort('name')
    })
    
    act(() => {
      result.current.handleSort('value')
    })

    expect(result.current.sortedData[0].value).toBe(10)
    expect(result.current.sortConfig?.key).toBe('value')
    expect(result.current.sortConfig?.direction).toBe('asc')
  })

  it('should handle numeric sorting', () => {
    const { result } = renderHook(() => useSort(mockData))
    
    act(() => {
      result.current.handleSort('value')
    })

    expect(result.current.sortedData[0].value).toBe(10)
    expect(result.current.sortedData[1].value).toBe(20)
    expect(result.current.sortedData[2].value).toBe(30)
  })

  it('should handle date sorting', () => {
    const { result } = renderHook(() => useSort(mockData))
    
    act(() => {
      result.current.handleSort('date')
    })

    expect(result.current.sortedData[0].date).toBe('2024-01-01')
    expect(result.current.sortedData[1].date).toBe('2024-02-01')
    expect(result.current.sortedData[2].date).toBe('2024-03-01')
  })

  it('should handle empty array', () => {
    const { result } = renderHook(() => useSort([]))
    expect(result.current.sortedData).toEqual([])
  })

  it('should maintain sort when data updates', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useSort(data, { key: 'name', direction: 'asc' }),
      { initialProps: { data: mockData } }
    )

    const newData = [...mockData, { id: '4', name: 'David', value: 40, date: '2024-04-01' }]
    rerender({ data: newData })

    expect(result.current.sortedData.length).toBe(4)
    expect(result.current.sortedData[0].name).toBe('Alice')
  })
})

