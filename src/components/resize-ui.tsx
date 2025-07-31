import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Maximize2 } from 'lucide-react'

interface ResizeUIProps {
  selectedElement: HTMLElement | null
  elementId: string | null
  pageWidth: number
  margins: number
  onResize: (elementId: string, width: number, height: number) => void
  onStretchToMargins: (elementId: string) => void
}

export const ResizeUI: React.FC<ResizeUIProps> = ({
  selectedElement,
  elementId,
  pageWidth,
  margins,
  onResize,
  onStretchToMargins
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [currentSize, setCurrentSize] = useState({ width: 0, height: 0 })
  const [showDimensions, setShowDimensions] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedElement || !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeHandle || !selectedElement) return

      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y
      
      let newWidth = startSize.width
      let newHeight = startSize.height

      // Calculate new dimensions based on handle
      switch (resizeHandle) {
        case 'e':
          newWidth = Math.max(50, startSize.width + deltaX)
          break
        case 'w':
          newWidth = Math.max(50, startSize.width - deltaX)
          break
        case 's':
          newHeight = Math.max(30, startSize.height + deltaY)
          break
        case 'n':
          newHeight = Math.max(30, startSize.height - deltaY)
          break
        case 'se':
          newWidth = Math.max(50, startSize.width + deltaX)
          newHeight = Math.max(30, startSize.height + deltaY)
          break
        case 'sw':
          newWidth = Math.max(50, startSize.width - deltaX)
          newHeight = Math.max(30, startSize.height + deltaY)
          break
        case 'ne':
          newWidth = Math.max(50, startSize.width + deltaX)
          newHeight = Math.max(30, startSize.height - deltaY)
          break
        case 'nw':
          newWidth = Math.max(50, startSize.width - deltaX)
          newHeight = Math.max(30, startSize.height - deltaY)
          break
      }

      // Maintain aspect ratio if Shift is held
      if (e.shiftKey && resizeHandle.length === 2) {
        const aspectRatio = startSize.width / startSize.height
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
        }
      }

      // Constrain to page margins
      const maxWidth = (pageWidth - (2 * margins)) * 3.7795275591 // mm to px
      newWidth = Math.min(newWidth, maxWidth)

      setCurrentSize({ width: newWidth, height: newHeight })
      setShowDimensions(true)

      // Apply temporary styles
      selectedElement.style.width = `${newWidth}px`
      selectedElement.style.height = `${newHeight}px`
    }

    const handleMouseUp = () => {
      if (elementId) {
        onResize(elementId, currentSize.width, currentSize.height)
      }
      setIsResizing(false)
      setResizeHandle(null)
      setShowDimensions(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeHandle, startPos, startSize, selectedElement, pageWidth, margins, onResize, elementId, currentSize])

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedElement) return

    const rect = selectedElement.getBoundingClientRect()
    setIsResizing(true)
    setResizeHandle(handle)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: rect.width, height: rect.height })
    setCurrentSize({ width: rect.width, height: rect.height })
  }

  const handleStretchToMargins = () => {
    if (elementId) {
      onStretchToMargins(elementId)
    }
  }

  if (!selectedElement || !elementId) return null

  const rect = selectedElement.getBoundingClientRect()
  const containerRect = selectedElement.offsetParent?.getBoundingClientRect()
  if (!containerRect) return null

  return (
    <div
      ref={resizeRef}
      className="absolute pointer-events-none"
      style={{
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        zIndex: 1000
      }}
    >
      {/* Resize handles */}
      <div 
        className="resize-handle resize-handle-n pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'n')} 
      />
      <div 
        className="resize-handle resize-handle-s pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 's')} 
      />
      <div 
        className="resize-handle resize-handle-e pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'e')} 
      />
      <div 
        className="resize-handle resize-handle-w pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'w')} 
      />
      <div 
        className="resize-handle resize-handle-ne pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'ne')} 
      />
      <div 
        className="resize-handle resize-handle-nw pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'nw')} 
      />
      <div 
        className="resize-handle resize-handle-se pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'se')} 
      />
      <div 
        className="resize-handle resize-handle-sw pointer-events-auto" 
        onMouseDown={(e) => handleResizeStart(e, 'sw')} 
      />

      {/* Dimensions display */}
      {showDimensions && (
        <div className="resize-dimensions">
          {Math.round(currentSize.width)}px × {Math.round(currentSize.height)}px
        </div>
      )}

      {/* Stretch to margins button */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 h-7 text-xs pointer-events-auto"
        onClick={handleStretchToMargins}
      >
        <Maximize2 className="w-3 h-3 mr-1" />
        Stretch to Margins
      </Button>
    </div>
  )
}