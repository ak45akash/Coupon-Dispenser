import Papa from 'papaparse'

export interface CSVCoupon {
  code: string
  description: string
  discount_value?: string
  expiry_date?: string
}

export function parseCSV(file: File): Promise<CSVCoupon[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const coupons = results.data.map((row: any, index: number) => {
            // Only code and description are required
            const code = row.code || row.Code || ''
            const description = row.description || row.Description || ''
            const discountValue = row.discount_value || row['Discount Value'] || undefined
            let expiryDate = row.expiry_date || row['Expiry Date'] || undefined

            // Validate required fields
            if (!code) {
              throw new Error(`Row ${index + 2}: Missing required field 'code'`)
            }
            if (!description) {
              throw new Error(`Row ${index + 2}: Missing required field 'description'`)
            }

            // Parse expiry_date: if it's YYYY-MM-DD format, convert to ISO datetime
            // Note: expiry_date is optional and will be set when coupon is claimed (1 month from claim date)
            if (expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
              // Convert YYYY-MM-DD to ISO datetime format (end of day in UTC)
              expiryDate = new Date(expiryDate + 'T23:59:59Z').toISOString()
            }
            
            return {
              code,
              description,
              discount_value: discountValue,
              expiry_date: expiryDate,
            }
          })
          resolve(coupons)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export function exportToCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

