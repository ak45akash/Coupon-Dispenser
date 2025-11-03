import Papa from 'papaparse'

export interface CSVCoupon {
  code: string
  description?: string
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
          const coupons = results.data.map((row: any) => {
            // Parse expiry_date: if it's YYYY-MM-DD format, convert to ISO datetime
            let expiryDate = row.expiry_date || row['Expiry Date'] || ''
            if (expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
              // Convert YYYY-MM-DD to ISO datetime format (end of day in UTC)
              expiryDate = new Date(expiryDate + 'T23:59:59Z').toISOString()
            }
            
            return {
              code: row.code || row.Code,
              description: row.description || row.Description || '',
              discount_value: row.discount_value || row['Discount Value'] || '',
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

