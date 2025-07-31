import * as XLSX from 'xlsx'

export interface TableCell {
  value: string
  backgroundColor?: string
  color?: string
  isHeader?: boolean
}

export interface ExtractedTable {
  html: string
  data: string[][]
  cellData: TableCell[][]
}

export const extractTablesFromHTML = (html: string): ExtractedTable[] => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Add styles to ensure proper rendering
  const styleElement = document.createElement('style')
  styleElement.textContent = `
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    thead {
      background-color: #f8f9fa;
    }
    thead th {
      background-color: #e9ecef;
      font-weight: bold;
      color: #495057;
    }
    /* Preserve color classes */
    .bg-gray-100 { background-color: #f3f4f6 !important; }
    .bg-gray-200 { background-color: #e5e7eb !important; }
    .bg-blue-100 { background-color: #dbeafe !important; }
    .bg-green-100 { background-color: #d1fae5 !important; }
    .text-white { color: #ffffff !important; }
    .text-gray-900 { color: #111827 !important; }
  `
  tempDiv.appendChild(styleElement)
  
  // Add to DOM temporarily to get computed styles
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  tempDiv.style.width = '1200px'
  document.body.appendChild(tempDiv)
  
  // Force layout calculation
  void tempDiv.offsetHeight
  
  const tables = tempDiv.getElementsByTagName('table')
  const tableData: ExtractedTable[] = []
  
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]
    const data: string[][] = []
    const cellData: TableCell[][] = []
    const rows = table.getElementsByTagName('tr')
    
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j]
      const cells = row.querySelectorAll('td, th')
      const rowData: string[] = []
      const rowCellData: TableCell[] = []
      
      for (let k = 0; k < cells.length; k++) {
        const cell = cells[k] as HTMLElement
        const computedStyle = window.getComputedStyle(cell)
        
        // Get the actual computed colors
        let bgColor = computedStyle.backgroundColor
        const textColor = computedStyle.color
        
        // If the background is transparent, check parent elements
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
          let parent = cell.parentElement
          while (parent && parent !== tempDiv) {
            const parentStyle = window.getComputedStyle(parent)
            if (parentStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && parentStyle.backgroundColor !== 'transparent') {
              bgColor = parentStyle.backgroundColor
              break
            }
            parent = parent.parentElement
          }
        }
        
        // Default colors for headers if still transparent
        if (cell.tagName.toLowerCase() === 'th' && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
          bgColor = 'rgb(233, 236, 239)' // #e9ecef
        }
        
        rowData.push(cell.textContent || '')
        rowCellData.push({
          value: cell.textContent || '',
          backgroundColor: bgColor,
          color: textColor,
          isHeader: cell.tagName.toLowerCase() === 'th'
        })
      }
      
      data.push(rowData)
      cellData.push(rowCellData)
    }
    
    tableData.push({
      html: table.outerHTML,
      data: data,
      cellData: cellData
    })
  }
  
  // Clean up
  document.body.removeChild(tempDiv)
  
  return tableData
}

export const exportTablesToXLSX = (
  htmlContent: string,
  setNotification: (msg: string | null) => void
) => {
  const tables = extractTablesFromHTML(htmlContent)
  
  if (tables.length === 0) {
    setNotification('No tables found to export')
    setTimeout(() => setNotification(null), 3000)
    return
  }
  
  if (tables.length === 1) {
    // Single table - export as single file
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(tables[0].data)
    
    // Apply styles based on cell data
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = ws[cellAddress]
        if (cell) {
          const cellInfo = tables[0].cellData[R]?.[C]
          if (cellInfo?.isHeader) {
            cell.s = {
              fill: { fgColor: { rgb: "E9ECEF" } },
              font: { bold: true }
            }
          }
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, "Table 1")
    XLSX.writeFile(wb, "extracted-table.xlsx")
    setNotification('Table exported to Excel successfully!')
  } else {
    // Multiple tables - export as single file with multiple sheets
    const wb = XLSX.utils.book_new()
    
    tables.forEach((table, index) => {
      const ws = XLSX.utils.aoa_to_sheet(table.data)
      
      // Apply styles
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          const cell = ws[cellAddress]
          if (cell) {
            const cellInfo = table.cellData[R]?.[C]
            if (cellInfo?.isHeader) {
              cell.s = {
                fill: { fgColor: { rgb: "E9ECEF" } },
                font: { bold: true }
              }
            }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws, `Table ${index + 1}`)
    })
    
    XLSX.writeFile(wb, "extracted-tables.xlsx")
    setNotification(`${tables.length} tables exported to Excel successfully!`)
  }
  
  setTimeout(() => setNotification(null), 3000)
}

export const copyTableToClipboard = async (table: ExtractedTable): Promise<boolean> => {
  try {
    // Create a formatted text version of the table
    const textRows = table.data.map(row => row.join('\t')).join('\n')
    await navigator.clipboard.writeText(textRows)
    return true
  } catch (error) {
    console.error('Failed to copy table:', error)
    return false
  }
}