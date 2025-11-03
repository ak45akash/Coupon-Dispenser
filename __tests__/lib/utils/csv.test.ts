import { parseCSV, CSVCoupon } from '@/lib/utils/csv'

describe('CSV Parser', () => {
  // Helper function to create a File object from CSV content
  const createCSVFile = (content: string, filename = 'test.csv'): File => {
    const blob = new Blob([content], { type: 'text/csv' })
    return new File([blob], filename, { type: 'text/csv' })
  }

  describe('parseCSV', () => {
    it('should parse valid CSV with lowercase column names', async () => {
      const csvContent = `code,description,discount_value,expiry_date
SAVE20,Get 20% off your purchase,20% off,2024-12-31
FREESHIP,Free shipping on orders,Free Shipping,2024-12-31
WELCOME10,Welcome discount,10% off,2024-12-31`

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        code: 'SAVE20',
        description: 'Get 20% off your purchase',
        discount_value: '20% off',
        expiry_date: '2024-12-31T23:59:59.000Z',
      })
    })

    it('should parse CSV with capitalized column names', async () => {
      const csvContent = `Code,Description,Discount Value,Expiry Date
SAVE20,Get 20% off your purchase,20% off,2024-12-31
FREESHIP,Free shipping on orders,Free Shipping,2024-12-31`

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        code: 'SAVE20',
        description: 'Get 20% off your purchase',
        discount_value: '20% off',
        expiry_date: '2024-12-31T23:59:59.000Z',
      })
    })

    it('should parse CSV with only required code field', async () => {
      const csvContent = `code
COUPON1
COUPON2
COUPON3`

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        code: 'COUPON1',
        description: '',
        discount_value: '',
        expiry_date: '',
      })
    })

    it('should handle optional fields being empty', async () => {
      const csvContent = `code,description,discount_value,expiry_date
COUPON1,Some description,,
COUPON2,,15% off,
COUPON3,,,2025-01-01`

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        code: 'COUPON1',
        description: 'Some description',
        discount_value: '',
        expiry_date: '',
      })
      expect(result[1]).toEqual({
        code: 'COUPON2',
        description: '',
        discount_value: '15% off',
        expiry_date: '',
      })
      expect(result[2]).toEqual({
        code: 'COUPON3',
        description: '',
        discount_value: '',
        expiry_date: '2025-01-01T23:59:59.000Z',
      })
    })

    it('should skip empty lines', async () => {
      const csvContent = `code,description,discount_value,expiry_date

COUPON1,First coupon,10% off,2024-12-31

COUPON2,Second coupon,20% off,2024-12-31
`

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('COUPON1')
      expect(result[1].code).toBe('COUPON2')
    })

    it('should handle special characters in values', async () => {
      const csvContent = `code,description,discount_value,expiry_date
SAVE50,Get 50% off & save big!,50% off,2024-12-31
SPECIAL,"Multi-line description with quotes",$10 off,2024-12-31`

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(2)
      expect(result[0].description).toBe('Get 50% off & save big!')
      expect(result[1].discount_value).toBe('$10 off')
    })

    it('should parse large CSV files efficiently', async () => {
      const header = 'code,description,discount_value,expiry_date\n'
      const rows = Array.from({ length: 100 }, (_, i) => {
        const num = String(i + 1).padStart(3, '0')
        return `COUPON${num},Description for coupon ${num},${i + 1}% off,2024-12-31`
      }).join('\n')
      const csvContent = header + rows

      const file = createCSVFile(csvContent)
      const result = await parseCSV(file)

      expect(result).toHaveLength(100)
      expect(result[0].code).toBe('COUPON001')
      expect(result[99].code).toBe('COUPON100')
    })
  })
})

