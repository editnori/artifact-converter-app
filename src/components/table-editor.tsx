import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Copy, 
  Check, 
  Download,
  Edit3,
  Save,
  Plus,
  Trash2
} from 'lucide-react'
import { ExtractedTable, TableCell } from './table-extraction'

interface TableEditorProps {
  tables: ExtractedTable[]
  onClose: () => void
  onSave: (tables: ExtractedTable[]) => void
  onCopyTable: (table: ExtractedTable) => void
  onExportToExcel: () => void
}

export const TableEditor: React.FC<TableEditorProps> = ({
  tables,
  onClose,
  onSave,
  onCopyTable,
  onExportToExcel
}) => {
  const [editableTables, setEditableTables] = useState<ExtractedTable[]>(tables)
  const [editingCell, setEditingCell] = useState<{tableIndex: number, row: number, col: number} | null>(null)
  const [copiedTableIndex, setCopiedTableIndex] = useState<number | null>(null)

  useEffect(() => {
    setEditableTables(tables)
  }, [tables])

  const updateCell = (tableIndex: number, row: number, col: number, value: string) => {
    const newTables = [...editableTables]
    newTables[tableIndex].data[row][col] = value
    newTables[tableIndex].cellData[row][col].value = value
    setEditableTables(newTables)
  }

  const addRow = (tableIndex: number) => {
    const newTables = [...editableTables]
    const table = newTables[tableIndex]
    const numCols = table.data[0]?.length || 0
    const newRow = new Array(numCols).fill('')
    const newCellRow = new Array(numCols).fill(null).map(() => ({
      value: '',
      backgroundColor: 'transparent',
      color: 'inherit',
      isHeader: false
    }))
    table.data.push(newRow)
    table.cellData.push(newCellRow)
    setEditableTables(newTables)
  }

  const deleteRow = (tableIndex: number, rowIndex: number) => {
    const newTables = [...editableTables]
    newTables[tableIndex].data.splice(rowIndex, 1)
    newTables[tableIndex].cellData.splice(rowIndex, 1)
    setEditableTables(newTables)
  }

  const addColumn = (tableIndex: number) => {
    const newTables = [...editableTables]
    const table = newTables[tableIndex]
    table.data.forEach(row => row.push(''))
    table.cellData.forEach(row => row.push({
      value: '',
      backgroundColor: 'transparent',
      color: 'inherit',
      isHeader: false
    }))
    setEditableTables(newTables)
  }

  const deleteColumn = (tableIndex: number, colIndex: number) => {
    const newTables = [...editableTables]
    const table = newTables[tableIndex]
    table.data.forEach(row => row.splice(colIndex, 1))
    table.cellData.forEach(row => row.splice(colIndex, 1))
    setEditableTables(newTables)
  }

  const handleCopyTable = async (tableIndex: number) => {
    await onCopyTable(editableTables[tableIndex])
    setCopiedTableIndex(tableIndex)
    setTimeout(() => setCopiedTableIndex(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Table Editor</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onExportToExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export All to Excel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => onSave(editableTables)}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {editableTables.map((table, tableIndex) => (
            <div key={tableIndex} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Table {tableIndex + 1}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addRow(tableIndex)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Row
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addColumn(tableIndex)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Column
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyTable(tableIndex)}
                    className="flex items-center gap-1"
                  >
                    {copiedTableIndex === tableIndex ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {table.data.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => {
                          const cellData = table.cellData[rowIndex]?.[colIndex]
                          const isEditing = editingCell?.tableIndex === tableIndex && 
                                          editingCell?.row === rowIndex && 
                                          editingCell?.col === colIndex

                          return (
                            <td
                              key={colIndex}
                              className="border border-gray-300 p-2 relative group"
                              style={{
                                backgroundColor: cellData?.backgroundColor || 'transparent',
                                color: cellData?.color || 'inherit',
                                fontWeight: cellData?.isHeader ? 'bold' : 'normal'
                              }}
                            >
                              {isEditing ? (
                                <Input
                                  value={cell}
                                  onChange={(e) => updateCell(tableIndex, rowIndex, colIndex, e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingCell(null)
                                    }
                                  }}
                                  className="w-full h-full p-1"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="cursor-pointer min-h-[24px] flex items-center justify-between"
                                  onClick={() => setEditingCell({ tableIndex, row: rowIndex, col: colIndex })}
                                >
                                  <span>{cell}</span>
                                  <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                </div>
                              )}

                              {/* Delete row button */}
                              {colIndex === row.length - 1 && table.data.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteRow(tableIndex, rowIndex)}
                                  className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}

                              {/* Delete column button */}
                              {rowIndex === 0 && row.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteColumn(tableIndex, colIndex)}
                                  className="absolute left-1/2 -translate-x-1/2 -top-8 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}