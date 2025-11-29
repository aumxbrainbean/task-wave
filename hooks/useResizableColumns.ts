import { useState, useCallback, useEffect } from 'react'

interface ColumnWidths {
  [key: string]: number
}

export function useResizableColumns(initialWidths: ColumnWidths) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tms-column-widths')
      if (saved) {
        try {
          const savedWidths = JSON.parse(saved)
          // Enforce minimum widths for specific columns
          return {
            ...savedWidths,
            task_description: Math.max(savedWidths.task_description || 350, 350),
            notes: Math.max(savedWidths.notes || 350, 350),
          }
        } catch {
          return initialWidths
        }
      }
    }
    return initialWidths
  })

  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = useCallback((columnKey: string, e: React.MouseEvent) => {
    setIsResizing(columnKey)
    setStartX(e.clientX)
    setStartWidth(columnWidths[columnKey] || 0)
    e.preventDefault()
  }, [columnWidths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const diff = e.clientX - startX
      // Set minimum width based on column type
      const minWidth = (isResizing === 'task_description' || isResizing === 'notes') ? 350 : 100
      const newWidth = Math.max(minWidth, startWidth + diff)
      setColumnWidths(prev => ({
        ...prev,
        [isResizing]: newWidth
      }))
    }
  }, [isResizing, startX, startWidth])

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      // Save to localStorage
      localStorage.setItem('tms-column-widths', JSON.stringify(columnWidths))
      setIsResizing(null)
    }
  }, [isResizing, columnWidths])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return {
    columnWidths,
    handleMouseDown,
    isResizing
  }
}
