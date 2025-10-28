import {
  formatDate,
  formatDateTime,
  formatPercentage,
  formatNumber,
} from '@/lib/utils/format'

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('should format a date string', () => {
      const date = '2024-01-15T10:30:00Z'
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should format a Date object', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('formatDateTime', () => {
    it('should format a datetime string', () => {
      const datetime = '2024-01-15T10:30:00Z'
      const formatted = formatDateTime(datetime)
      expect(formatted).toContain('Jan 15, 2024')
      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('formatPercentage', () => {
    it('should format a percentage with one decimal', () => {
      expect(formatPercentage(25.5)).toBe('25.5%')
      expect(formatPercentage(100)).toBe('100.0%')
      expect(formatPercentage(0.1234)).toBe('0.1%')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(100)).toBe('100')
    })
  })
})

