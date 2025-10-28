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
          const coupons = results.data.map((row: any) => ({
            code: row.code || row.Code,
            description: row.description || row.Description || '',
            discount_value: row.discount_value || row['Discount Value'] || '',
            expiry_date: row.expiry_date || row['Expiry Date'] || '',
          }))
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

