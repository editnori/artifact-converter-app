"use client"

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  Download,
  Table as TableIcon,
  FileSpreadsheet,
  FileJson,
  FileText,
  Check,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface TableCell {
  value: string
  backgroundColor?: string
  color?: string
  isHeader?: boolean
}

interface ExtractedTable {
  html: string
  data: string[][]
  cellData: TableCell[][]
  index: number
  caption?: string
}

interface TableDownloaderProps {
  htmlContent: string
  onNotification?: (message: string) => void
}

export function TableDownloader({ htmlContent, onNotification }: TableDownloaderProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null)

  const showNotification = useCallback((message: string) => {
    if (onNotification) {
      onNotification(message)
    }
  }, [onNotification])

  const extractTablesFromHTML = useCallback((html: string): ExtractedTable[] => {
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
    tempDiv.offsetHeight
    
    const tables = tempDiv.getElementsByTagName('table')
    const tableData: ExtractedTable[] = []
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      const data: string[][] = []
      const cellData: TableCell[][] = []
      const rows = table.getElementsByTagName('tr')
      
      // Check for caption
      const caption = table.querySelector('caption')?.textContent || undefined
      
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
          let textColor = computedStyle.color
          
          // Handle colspan and rowspan
          const colspan = parseInt(cell.getAttribute('colspan') || '1')
          const cellValue = cell.textContent || ''
          
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
          
          // Add the cell value (handle colspan by repeating)
          for (let span = 0; span < colspan; span++) {
            rowData.push(cellValue)
            rowCellData.push({
              value: cellValue,
              backgroundColor: bgColor,
              color: textColor,
              isHeader: cell.tagName.toLowerCase() === 'th'
            })
          }
        }
        
        data.push(rowData)
        cellData.push(rowCellData)
      }
      
      tableData.push({
        html: table.outerHTML,
        data: data,
        cellData: cellData,
        index: i,
        caption: caption
      })
    }
    
    // Clean up
    document.body.removeChild(tempDiv)
    
    return tableData
  }, [])

  const downloadAsCSV = useCallback(async (tableIndex?: number) => {
    setIsExtracting(true)
    setDownloadedFormat('csv')
    
    try {
      const tables = extractTablesFromHTML(htmlContent)
      
      if (tables.length === 0) {
        showNotification('No tables found to download')
        return
      }
      
      const tablesToExport = tableIndex !== undefined ? [tables[tableIndex]] : tables
      
      if (tablesToExport.length === 1) {
        // Single table - direct download
        const table = tablesToExport[0]
        const csv = table.data.map(row => 
          row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma, newline, or quotes
            const escaped = cell.replace(/"/g, '""')
            return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped
          }).join(',')
        ).join('\n')
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `table${table.caption ? '-' + table.caption.replace(/[^a-z0-9]/gi, '_') : ''}.csv`
        link.click()
        
        showNotification('Table downloaded as CSV')
      } else {
        // Multiple tables - create a zip file or concatenate with separators
        const allCsv = tablesToExport.map((table, idx) => {
          const header = `\n--- Table ${idx + 1}${table.caption ? ': ' + table.caption : ''} ---\n`
          const csv = table.data.map(row => 
            row.map(cell => {
              const escaped = cell.replace(/"/g, '""')
              return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped
            }).join(',')
          ).join('\n')
          return header + csv
        }).join('\n\n')
        
        const blob = new Blob([allCsv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'all-tables.csv'
        link.click()
        
        showNotification(`${tablesToExport.length} tables downloaded as CSV`)
      }
    } catch (error) {
      console.error('Error downloading CSV:', error)
      showNotification('Error downloading CSV')
    } finally {
      setIsExtracting(false)
      setTimeout(() => setDownloadedFormat(null), 2000)
    }
  }, [htmlContent, extractTablesFromHTML, showNotification])

  const downloadAsExcel = useCallback(async (tableIndex?: number) => {
    setIsExtracting(true)
    setDownloadedFormat('xlsx')
    
    try {
      const tables = extractTablesFromHTML(htmlContent)
      
      if (tables.length === 0) {
        showNotification('No tables found to download')
        return
      }
      
      const tablesToExport = tableIndex !== undefined ? [tables[tableIndex]] : tables
      const wb = XLSX.utils.book_new()
      
      tablesToExport.forEach((table, idx) => {
        const ws = XLSX.utils.aoa_to_sheet(table.data)
        
        // Apply styles based on cell data
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
        
        // Set column widths
        const colWidths: { wch: number }[] = []
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 10
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellValue = table.data[R]?.[C] || ''
            maxWidth = Math.max(maxWidth, cellValue.length)
          }
          colWidths.push({ wch: Math.min(maxWidth + 2, 50) })
        }
        ws['!cols'] = colWidths
        
        const sheetName = tablesToExport.length === 1 
          ? 'Table' 
          : `Table ${table.index + 1}${table.caption ? ' - ' + table.caption.substring(0, 20) : ''}`
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      })
      
      const filename = tablesToExport.length === 1 
        ? `table${tablesToExport[0].caption ? '-' + tablesToExport[0].caption.replace(/[^a-z0-9]/gi, '_') : ''}.xlsx`
        : 'all-tables.xlsx'
      
      XLSX.writeFile(wb, filename)
      
      showNotification(
        tablesToExport.length === 1 
          ? 'Table downloaded as Excel' 
          : `${tablesToExport.length} tables downloaded as Excel`
      )
    } catch (error) {
      console.error('Error downloading Excel:', error)
      showNotification('Error downloading Excel')
    } finally {
      setIsExtracting(false)
      setTimeout(() => setDownloadedFormat(null), 2000)
    }
  }, [htmlContent, extractTablesFromHTML, showNotification])

  const downloadAsJSON = useCallback(async (tableIndex?: number) => {
    setIsExtracting(true)
    setDownloadedFormat('json')
    
    try {
      const tables = extractTablesFromHTML(htmlContent)
      
      if (tables.length === 0) {
        showNotification('No tables found to download')
        return
      }
      
      const tablesToExport = tableIndex !== undefined ? [tables[tableIndex]] : tables
      
      const jsonData = tablesToExport.map(table => {
        // Try to use first row as headers if they're th elements
        const hasHeaders = table.cellData[0]?.every(cell => cell.isHeader)
        
        if (hasHeaders && table.data.length > 1) {
          const headers = table.data[0]
          const rows = table.data.slice(1)
          
          return {
            caption: table.caption,
            headers: headers,
            data: rows.map(row => {
              const obj: Record<string, string> = {}
              headers.forEach((header, idx) => {
                obj[header || `Column ${idx + 1}`] = row[idx] || ''
              })
              return obj
            })
          }
        } else {
          // No headers, return as array of arrays
          return {
            caption: table.caption,
            data: table.data
          }
        }
      })
      
      const json = tablesToExport.length === 1 ? jsonData[0] : jsonData
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = tablesToExport.length === 1 
        ? `table${tablesToExport[0].caption ? '-' + tablesToExport[0].caption.replace(/[^a-z0-9]/gi, '_') : ''}.json`
        : 'all-tables.json'
      link.click()
      
      showNotification(
        tablesToExport.length === 1 
          ? 'Table downloaded as JSON' 
          : `${tablesToExport.length} tables downloaded as JSON`
      )
    } catch (error) {
      console.error('Error downloading JSON:', error)
      showNotification('Error downloading JSON')
    } finally {
      setIsExtracting(false)
      setTimeout(() => setDownloadedFormat(null), 2000)
    }
  }, [htmlContent, extractTablesFromHTML, showNotification])

  const getTableCount = useCallback(() => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const count = tempDiv.getElementsByTagName('table').length
    return count
  }, [htmlContent])

  const tableCount = getTableCount()

  if (!htmlContent || tableCount === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExtracting}
          className="gap-2"
        >
          {isExtracting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : downloadedFormat ? (
            <Check className="h-4 w-4" />
          ) : (
            <TableIcon className="h-4 w-4" />
          )}
          Download Tables
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {tableCount} table{tableCount > 1 ? 's' : ''} found
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => downloadAsCSV()}>
          <FileText className="mr-2 h-4 w-4" />
          Download all as CSV
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => downloadAsExcel()}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download all as Excel
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => downloadAsJSON()}>
          <FileJson className="mr-2 h-4 w-4" />
          Download all as JSON
        </DropdownMenuItem>
        
        {tableCount > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Individual Tables</DropdownMenuLabel>
            {Array.from({ length: Math.min(tableCount, 10) }).map((_, idx) => (
              <DropdownMenu key={idx}>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={(e: Event) => e.preventDefault()}
                  >
                    <TableIcon className="mr-2 h-4 w-4" />
                    Table {idx + 1}
                    <Download className="ml-auto h-3 w-3" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onClick={() => downloadAsCSV(idx)}>
                    <FileText className="mr-2 h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadAsExcel(idx)}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadAsJSON(idx)}>
                    <FileJson className="mr-2 h-4 w-4" />
                    JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
            {tableCount > 10 && (
              <DropdownMenuItem disabled className="text-xs text-gray-500">
                ... and {tableCount - 10} more
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}