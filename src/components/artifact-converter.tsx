"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
// Card components removed - using custom layout
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Image as ImageIcon, 
  Loader2,
  Upload,
  Copy,
  Check,
  Settings2,
  Edit3,
  Trash2,
  Table as TableIcon,
  X,
  ArrowUp,
  ArrowDown,
  Move,
  Undo2,
  Redo2,
  Type,
  Palette
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

import { TableDownloader } from './table-downloader'
// import { TableEditor } from './table-editor'
import { extractTablesFromHTML } from './table-extraction'
import { ContainerColorPicker, ContainerColors } from './container-color-picker'



interface PageSize {
  name: string
  width: number
  height: number
}

const PAGE_SIZES: Record<string, PageSize> = {
  a4: { name: 'A4', width: 210, height: 297 },
  letter: { name: 'Letter', width: 216, height: 279 },
  legal: { name: 'Legal', width: 216, height: 356 },
  a3: { name: 'A3', width: 297, height: 420 },
  a5: { name: 'A5', width: 148, height: 210 },
  custom: { name: 'Custom', width: 210, height: 297 }
}

interface PreviewPagesProps {
  htmlContent: string
  pageSize: { width: number; height: number }
  margins: number
  scale: number
  fontSize: number
  lineHeight: number
  showPageBreaks: boolean
  previewRef: React.RefObject<HTMLDivElement | null>
  onPagesUpdate?: (pageCount: number) => void
}

const PreviewPages: React.FC<PreviewPagesProps> = ({
  htmlContent,
  pageSize,
  margins,
  scale,
  fontSize,
  lineHeight,
  showPageBreaks,
  previewRef,
  onPagesUpdate
}) => {
  const [pageBreakPositions, setPageBreakPositions] = useState<number[]>([])
  
  useEffect(() => {
    const calculatePageBreaks = () => {
      // Calculate where automatic page cuts will occur in PDF
      const pageHeightMm = pageSize.height - (2 * margins)
      const pageHeightPx = pageHeightMm * 3.7795275591 // mm to px conversion (96 DPI)
      
      // Calculate page break positions
      if (previewRef.current && htmlContent) {
        // Wait for content to render
        setTimeout(() => {
          if (!previewRef.current) return
          
          const contentHeight = previewRef.current.scrollHeight / scale
          const numberOfPages = Math.ceil(contentHeight / pageHeightPx)
          const breaks: number[] = []
          
          // Get all elements to check for better break positions
          const elements = previewRef.current.querySelectorAll('*')
          const elementPositions: { element: Element; top: number; bottom: number; height: number }[] = []
          
          elements.forEach(el => {
            const rect = el.getBoundingClientRect()
            const containerRect = previewRef.current!.getBoundingClientRect()
            const relativeTop = (rect.top - containerRect.top) / scale
            const relativeBottom = (rect.bottom - containerRect.top) / scale
            
            elementPositions.push({
              element: el,
              top: relativeTop,
              bottom: relativeBottom,
              height: rect.height / scale
            })
          })
          
          // Calculate optimal page breaks
          for (let i = 1; i < numberOfPages; i++) {
            const idealBreakPosition = i * pageHeightPx
            let bestBreakPosition = idealBreakPosition
            
            // Find elements that would be split by this break
            const splitElements = elementPositions.filter(pos => 
              pos.top < idealBreakPosition && pos.bottom > idealBreakPosition
            )
            
            if (splitElements.length > 0) {
              // Try to find a better break position
              const nearbyElements = elementPositions.filter(pos => 
                Math.abs(pos.top - idealBreakPosition) < pageHeightPx * 0.2 || // Within 20% of page height
                Math.abs(pos.bottom - idealBreakPosition) < pageHeightPx * 0.2
              )
              
              // Prefer breaking before elements rather than in the middle
              let bestDiff = Infinity
              nearbyElements.forEach(pos => {
                const tagName = pos.element.tagName.toLowerCase()
                
                // Avoid breaking inside these elements
                const avoidBreakInside = ['table', 'img', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre']
                
                if (avoidBreakInside.includes(tagName) || pos.height > pageHeightPx * 0.3) {
                  // For large or important elements, prefer breaking before them
                  const diff = Math.abs(pos.top - idealBreakPosition)
                  if (diff < bestDiff && pos.top > (i - 1) * pageHeightPx) {
                    bestDiff = diff
                    bestBreakPosition = pos.top - 10 // Small gap before element
                  }
                } else {
                  // For smaller elements, we can break after them
                  const diff = Math.abs(pos.bottom - idealBreakPosition)
                  if (diff < bestDiff && pos.bottom < (i + 1) * pageHeightPx) {
                    bestDiff = diff
                    bestBreakPosition = pos.bottom + 10 // Small gap after element
                  }
                }
              })
            }
            
            breaks.push(bestBreakPosition * scale)
          }
          
          setPageBreakPositions(breaks)
          
          if (onPagesUpdate) {
            onPagesUpdate(numberOfPages)
          }
        }, 100) // Small delay to ensure content is rendered
      }
    }
    
    calculatePageBreaks()
    
    // Set up a MutationObserver to recalculate when content changes
    if (previewRef.current) {
      const observer = new MutationObserver(calculatePageBreaks)
      observer.observe(previewRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
      
      return () => observer.disconnect()
    }
  }, [htmlContent, pageSize, margins, scale, onPagesUpdate, previewRef])
  
  return (
    <div className="bg-white shadow-lg mx-auto relative"
      style={{ 
        width: `${pageSize.width}mm`,
        minHeight: `${pageSize.height}mm`,
        position: 'relative',
        overflow: 'visible',
        boxSizing: 'border-box'
      }}
    >

      {/* Main content */}
      <div 
        ref={previewRef}
        className="prose max-w-none"
        style={{
          padding: `${margins}mm`,
          fontSize: `${fontSize}pt`,
          lineHeight: `${lineHeight}`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${(pageSize.width - 2 * margins) / (pageSize.width * scale / 100)}%`,
          minHeight: `${(pageSize.height - 2 * margins) / (pageSize.height * scale / 100)}%`,
          position: 'relative',
          boxSizing: 'border-box'
        }}
      />
      
      {/* Page break indicators */}
      {showPageBreaks && pageBreakPositions.map((position, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${position + margins * 3.7795275591}px`,
            zIndex: 100
          }}
        >
          <div className="relative">
            <div className="border-t-2 border-dashed border-red-500 opacity-70" />
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              PDF will cut here
            </div>
          </div>
        </div>
      ))}
      

      
      {/* Page info */}
      <div
        className="absolute bottom-2 right-4 text-xs text-muted-foreground"
        style={{
          fontSize: '10pt'
        }}
      >
        {pageBreakPositions.length > 0 
          ? `Content will span ${pageBreakPositions.length + 1} pages in PDF`
          : 'Single page PDF'
        }
      </div>
    </div>
  )
}

export default function ArtifactConverter() {
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showSettings, setShowSettings] = useState(true)
  const [pageSize, setPageSize] = useState('a4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [margins, setMargins] = useState([10])
  const [scale, setScale] = useState([1])
  const [customWidth, setCustomWidth] = useState(210)
  const [customHeight, setCustomHeight] = useState(297)
  const [extractTables, setExtractTables] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx'>('pdf')
  const [editAction, setEditAction] = useState<'remove' | 'move' | 'edit' | 'color'>('remove')
  const [moveTargetElement, setMoveTargetElement] = useState<string | null>(null)

  
  // New advanced settings
  const [fontSize, setFontSize] = useState([12])
  const [lineHeight, setLineHeight] = useState([1.6])
  const [previewZoom, setPreviewZoom] = useState([1.55])
  const [showPageBreaks, setShowPageBreaks] = useState(true)

  
  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Unified edit toolbar
  const [showEditToolbar, setShowEditToolbar] = useState(false)
  const [editToolbarPosition, setEditToolbarPosition] = useState({ x: 0, y: 0 })
  
  // New features

  const [showTableDownloader, setShowTableDownloader] = useState(false)

  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [colorPickerElement, setColorPickerElement] = useState<{id: string, type: string} | null>(null)
  const [containerColors, setContainerColors] = useState<ContainerColors>({
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    textColor: '#000000'
  })
  

  
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  
  // Add to history when content changes
  const addToHistory = useCallback((content: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(content)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setHtmlContent(history[historyIndex - 1])
      setNotification('Undone')
      setTimeout(() => setNotification(null), 1500)
    }
  }, [history, historyIndex])
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setHtmlContent(history[historyIndex + 1])
      setNotification('Redone')
      setTimeout(() => setNotification(null), 1500)
    }
  }, [history, historyIndex])
  
  // Prevent custom element registration errors
  useEffect(() => {
    // Override customElements.define to prevent duplicate registrations
    const originalDefine = window.customElements.define.bind(window.customElements)
    window.customElements.define = function(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
      if (!window.customElements.get(name)) {
        originalDefine(name, constructor, options)
      }
    }
    
    return () => {
      window.customElements.define = originalDefine
    }
  }, [])

  const handleElementClick = (e: Event) => {
    e.stopPropagation()
    
    let element = e.currentTarget as HTMLElement
    let elementId = element.getAttribute('data-element-id')
    
    // For move action, prefer the container
    if (editAction === 'move') {
      const container = findBestContainer(element)
      if (container !== element) {
        // Update element and elementId to the container
        element = container as HTMLElement
        // Find or create element ID for the container
        if (!container.hasAttribute('data-element-id')) {
          // Generate a new ID for the container
          const newId = `container-${Date.now()}`
          container.setAttribute('data-element-id', newId)
          container.setAttribute('data-editable', 'true')
          elementId = newId
        } else {
          elementId = container.getAttribute('data-element-id')
        }
      }
    }
    
    if (editAction === 'edit') {
      // Enable text editing
      e.preventDefault()
      
      // Store original content
      const originalContent = element.innerHTML
      
      // Make element editable
      element.contentEditable = 'true'
      element.focus()
      
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(element)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      
      // Handle save on blur or enter
      const saveChanges = () => {
        element.contentEditable = 'false'
        
        // Update the HTML content with the new text
        const newContent = element.innerHTML
        if (newContent !== originalContent) {
          updateElementContent(elementId!, newContent)
          setNotification('Text updated successfully')
          setTimeout(() => setNotification(null), 2000)
        }
      }
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          saveChanges()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          element.innerHTML = originalContent
          element.contentEditable = 'false'
        }
      }
      
      element.addEventListener('blur', saveChanges, { once: true })
      element.addEventListener('keydown', handleKeyDown)
      
      // Clean up event listener when done
      element.addEventListener('blur', () => {
        element.removeEventListener('keydown', handleKeyDown)
      }, { once: true })
      
    } else if (editAction === 'move') {
      // Simple move mode - show up/down arrows
      e.preventDefault()
      
      if (elementId) {
        setMoveTargetElement(elementId)
        setSelectedElements(new Set([elementId]))
        element.classList.add('selected-for-move')
        
        // Show move controls near the element
        const rect = element.getBoundingClientRect()
        const previewRect = previewRef.current?.getBoundingClientRect()
        if (previewRect) {
          const relativeTop = rect.top - previewRect.top
          const relativeLeft = rect.right - previewRect.left + 10
          
          setEditToolbarPosition({
            x: relativeLeft,
            y: relativeTop + rect.height / 2 - 40
          })
          setShowEditToolbar(true)
        }
        
        setNotification('Use arrows to move element')
        setTimeout(() => setNotification(null), 2000)
      }
    } else if (editAction === 'remove') {
      // Original selection logic for remove mode
      e.preventDefault()
      
      if (elementId) {
        setSelectedElements(prev => {
          const newSet = new Set(prev)
          if (newSet.has(elementId)) {
            newSet.delete(elementId)
            element.classList.remove('selected-for-deletion')
          } else {
            newSet.add(elementId)
            element.classList.add('selected-for-deletion')
          }
          
          const action = newSet.has(elementId) ? 'Selected' : 'Deselected'
          const tagName = element.tagName.toLowerCase()
          setNotification(`${action} ${tagName} element`)
          setTimeout(() => setNotification(null), 1500)
          
          return newSet
        })
      }
    } else if (editAction === 'color') {
      // Color picker mode
      e.preventDefault()
      
      if (elementId) {
        const tagName = element.tagName.toLowerCase()
        
        // Check if it's a container element (div, section, article, aside, nav, header, footer, main)
        const containerElements = ['div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main']
        if (containerElements.includes(tagName)) {
          // Get current colors
          const computedStyle = window.getComputedStyle(element)
          const currentColors: ContainerColors = {
            backgroundColor: computedStyle.backgroundColor || '#ffffff',
            borderColor: computedStyle.borderColor || '#000000',
            textColor: computedStyle.color || '#000000'
          }
          
          setContainerColors(currentColors)
          setColorPickerElement({ id: elementId, type: tagName })
          setShowColorPicker(true)
        } else {
          setNotification('Color picker is only available for container elements (div, section, etc.)')
          setTimeout(() => setNotification(null), 3000)
        }
      }
    }
  }

  const updatePreview = useCallback(() => {
    if (previewRef.current) {
      if (htmlContent) {
        // Clear previous content
        previewRef.current.innerHTML = ''
        
        // Create a container for processing
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = htmlContent
        
        // Remove scripts for safety
        const scripts = tempDiv.getElementsByTagName('script')
        for (let i = scripts.length - 1; i >= 0; i--) {
          scripts[i].remove()
        }
        
        // Disable all buttons and interactive elements
        const interactiveElements = tempDiv.querySelectorAll('button, input[type="button"], input[type="submit"], a[href^="javascript:"], [onclick]')
        interactiveElements.forEach(el => {
          const element = el as HTMLElement
          element.setAttribute('disabled', 'true')
          element.removeAttribute('onclick')
          element.removeAttribute('href')
          element.style.cursor = 'not-allowed'
          element.style.opacity = '0.5'
          element.setAttribute('title', 'Interactive elements are disabled in preview')
        })
        
        // Add preview styles
        const previewStyles = document.createElement('style')
        previewStyles.textContent = `
          /* Reset and base styles */
          * {
            box-sizing: border-box;
          }
          
          /* Table styles */
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          /* Only apply default colors if no inline styles or classes */
          th:not([style*="background-color"]):not([class*="bg-"]) {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          thead:not([style*="background-color"]):not([class*="bg-"]) {
            background-color: #f8f9fa;
          }
          thead th:not([style*="background-color"]):not([class*="bg-"]):not([style*="color"]):not([class*="text-"]) {
            background-color: #e9ecef;
            font-weight: bold;
            color: #495057;
          }
          tbody tr:nth-child(even):not([style*="background-color"]):not([class*="bg-"]) {
            background-color: #f8f9fa;
          }
          
          /* Preserve color classes */
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .bg-gray-200 { background-color: #e5e7eb !important; }
          .bg-blue-100 { background-color: #dbeafe !important; }
          .bg-green-100 { background-color: #d1fae5 !important; }
          .text-white { color: #ffffff !important; }
          .text-gray-900 { color: #111827 !important; }
          .text-red-500 { color: #ef4444 !important; }
          .text-blue-500 { color: #3b82f6 !important; }
          .text-green-500 { color: #10b981 !important; }
          
          /* Manual page break - invisible in preview */
          .page-break, [style*="page-break-after: always"] {
            display: block;
            height: 0;
            margin: 0;
            padding: 0;
            visibility: hidden;
          }
          
          /* Edit mode styles */
          [data-editable="true"] {
            cursor: pointer;
            transition: all 0.2s;
          }
          [data-editable="true"]:hover {
            outline: 2px dashed #3b82f6;
            outline-offset: 2px;
          }
          .selected-for-deletion {
            outline: 2px solid #ef4444 !important;
            outline-offset: 2px;
            background-color: rgba(239, 68, 68, 0.1) !important;
          }
          .selected-for-spacing {
            outline: 2px solid #8b5cf6 !important;
            outline-offset: 2px;
            background-color: rgba(139, 92, 246, 0.05) !important;
          }
          .selected-for-swap {
            outline: 2px solid #f59e0b !important;
            outline-offset: 2px;
            background-color: rgba(245, 158, 11, 0.1) !important;
          }
          .selected-for-move {
            outline: 2px solid #10b981 !important;
            outline-offset: 2px;
            background-color: rgba(16, 185, 129, 0.1) !important;
            cursor: grab !important;
          }
          .drop-target {
            outline: 3px dashed #10b981 !important;
            outline-offset: 3px;
            background-color: rgba(16, 185, 129, 0.05) !important;
          }
          
          /* Text editing styles */
          [contenteditable="true"] {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px;
            background-color: rgba(59, 130, 246, 0.05) !important;
            cursor: text !important;
          }
          [contenteditable="true"]:focus {
            outline: 3px solid #2563eb !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
          
          /* Drag and drop styles */
          [data-editable="true"][draggable="true"] {
            cursor: move;
          }
          .dragging {
            opacity: 0.3;
            outline: 2px solid #3b82f6 !important;
          }
          .drop-zone {
            position: relative;
          }
          .drop-zone-before::before,
          .drop-zone-after::after,
          .drop-zone-left::before,
          .drop-zone-right::after,
          .drop-zone-center::before {
            content: '';
            position: absolute;
            background-color: #10b981;
            z-index: 1000;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
            animation: pulse 1s infinite;
          }
          .drop-zone-before::before {
            left: -20px;
            right: -20px;
            height: 4px;
            top: -2px;
          }
          .drop-zone-after::after {
            left: -20px;
            right: -20px;
            height: 4px;
            bottom: -2px;
          }
          .drop-zone-left::before {
            top: -20px;
            bottom: -20px;
            width: 4px;
            left: -2px;
          }
          .drop-zone-right::after {
            top: -20px;
            bottom: -20px;
            width: 4px;
            right: -2px;
          }
          .drop-zone-center::before {
            left: 50%;
            transform: translateX(-50%);
            top: -20px;
            bottom: -20px;
            width: 4px;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          .drop-preview {
            outline: 2px dashed #10b981 !important;
            outline-offset: 4px;
            background-color: rgba(16, 185, 129, 0.05) !important;
          }
          .drop-indicator {
            position: absolute;
            background: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 1001;
            pointer-events: none;
            white-space: nowrap;
          }
          .drop-indicator-before {
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
          }
          .drop-indicator-after {
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
          }
          .drop-indicator-left {
            left: -60px;
            top: 50%;
            transform: translateY(-50%);
          }
          .drop-indicator-right {
            right: -60px;
            top: 50%;
            transform: translateY(-50%);
          }
          .drop-indicator-center {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        `
        
        // Process elements for edit mode
        if (editMode) {
          const selectableElements = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'table', 'ul', 'ol', 'blockquote', 'pre',
            'img', 'figure', 'section', 'article', 'aside',
            'nav', 'header', 'footer', 'main', 'div'
          ]
          
          const elements = tempDiv.querySelectorAll(selectableElements.join(', '))
          const validElements: Element[] = []
          
          elements.forEach((el) => {
            if (!el.closest('[data-editable="true"]')) {
              const textContent = el.textContent?.trim()
              const tagName = el.tagName.toLowerCase()
              
              if (textContent || tagName === 'img' || tagName === 'table') {
                if (tagName === 'div') {
                  const hasNonDivChildren = Array.from(el.children).some(child => child.tagName.toLowerCase() !== 'div')
                  const hasDirectText = Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
                  if (hasNonDivChildren || hasDirectText) {
                    validElements.push(el)
                  }
                } else {
                  validElements.push(el)
                }
              }
            }
          })
          
          validElements.forEach((el, index) => {
            el.setAttribute('data-editable', 'true')
            el.setAttribute('data-element-id', `element-${index}`)
            
            if (selectedElements.has(`element-${index}`)) {
              el.classList.add('selected-for-deletion')
            }
          })
        }
        
        // Add the processed content to preview
        previewRef.current.appendChild(previewStyles)
        previewRef.current.innerHTML += tempDiv.innerHTML
        
        // Add event handlers for edit mode
        if (editMode) {
          const editableElements = previewRef.current.querySelectorAll('[data-editable="true"]')
          editableElements.forEach(el => {
            // Always add click handler
            el.addEventListener('click', handleElementClick)
            
            // Update cursor for edit mode
            if (editAction === 'edit') {
              (el as HTMLElement).style.cursor = 'text'

            } else if (editAction === 'color') {
              (el as HTMLElement).style.cursor = 'pointer'
            }
          })
        }
      } else {
        previewRef.current.innerHTML = ''
      }
    }
  }, [htmlContent, editMode, selectedElements, editAction, handleElementClick])

  useEffect(() => {
    updatePreview()
  }, [htmlContent, updatePreview])

  const processHTMLWithJavaScript = async (html: string): Promise<string> => {
    return new Promise((resolve) => {
      try {
        // Create a hidden iframe to execute JavaScript
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.left = '-9999px'
        iframe.style.width = '1200px'
        iframe.style.height = '800px'
        // Use srcdoc for better security and avoid cross-origin issues
        iframe.srcdoc = html
        
        // Set up message handler for communication
        const messageHandler = (event: MessageEvent) => {
          if (event.source === iframe.contentWindow) {
            window.removeEventListener('message', messageHandler)
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe)
            }
            resolve(event.data || html)
          }
        }
        
        window.addEventListener('message', messageHandler)
        
        iframe.onload = () => {
          setTimeout(() => {
            try {
              // Try to get the rendered content
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
              if (iframeDoc) {
                const renderedHTML = iframeDoc.documentElement.outerHTML
                // Clean up any problematic custom elements
                const cleanedHTML = renderedHTML.replace(/<mce-[^>]*>/g, '').replace(/<\/mce-[^>]*>/g, '')
                
                window.removeEventListener('message', messageHandler)
                if (iframe.parentNode) {
                  iframe.parentNode.removeChild(iframe)
                }
                resolve(cleanedHTML)
              } else {
                throw new Error('Cannot access iframe document')
              }
            } catch (error) {
              // If we can't access the iframe due to security, just return the original
              console.warn('Cannot access iframe content, returning original HTML:', error)
              window.removeEventListener('message', messageHandler)
              if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe)
              }
              resolve(html)
            }
          }, 2000) // Give 2 seconds for JavaScript to execute
        }
        
        document.body.appendChild(iframe)
        
        // Timeout fallback
        setTimeout(() => {
          window.removeEventListener('message', messageHandler)
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe)
          }
          resolve(html)
        }, 5000)
        
      } catch (error) {
        console.error('Error setting up iframe:', error)
        resolve(html)
      }
    })
  }

  const autoRemoveSidebars = (html: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Common sidebar selectors
    const sidebarSelectors = [
      // ID-based selectors
      '#sidebar', '#side-bar', '#leftbar', '#rightbar', '#left-sidebar', '#right-sidebar',
      '#navigation', '#nav-sidebar', '#menu-sidebar', '#aside', '#side-panel',
      
      // Class-based selectors
      '.sidebar', '.side-bar', '.leftbar', '.rightbar', '.left-sidebar', '.right-sidebar',
      '.navigation-sidebar', '.nav-sidebar', '.menu-sidebar', '.aside', '.side-panel',
      '.side-menu', '.left-menu', '.right-menu', '.vertical-menu', '.sidebar-wrapper',
      '.sidebar-container', '.nav-container', '.menu-container',
      
      // Semantic elements that might be sidebars
      'aside', 'nav[class*="side"]', 'nav[id*="side"]',
      
      // Common framework sidebars
      '.mdl-layout__drawer', '.mdc-drawer', '.mat-sidenav', '.v-navigation-drawer',
      '.ant-layout-sider', '.el-aside', '.sidebar-nav', '.app-sidebar',
      
      // Width-based detection (narrow fixed elements)
      '[style*="position: fixed"][style*="width: 2"], [style*="position: fixed"][style*="width: 3"]',
      '[style*="position: sticky"][style*="width: 2"], [style*="position: sticky"][style*="width: 3"]'
    ]
    
    // Remove each sidebar element found
    let removedCount = 0
    sidebarSelectors.forEach(selector => {
      try {
        const elements = tempDiv.querySelectorAll(selector)
        elements.forEach(el => {
          // Additional checks to confirm it's likely a sidebar
          const width = el.getBoundingClientRect().width || parseInt(window.getComputedStyle(el).width) || 0
          const position = window.getComputedStyle(el).position
          
          // Remove if it's narrow (typical sidebar width) or has fixed/sticky positioning
          if (width < 400 || position === 'fixed' || position === 'sticky' || selector.includes('aside') || selector.includes('nav')) {
            el.remove()
            removedCount++
          }
        })
      } catch {
        // Ignore selector errors
      }
    })
    
    if (removedCount > 0) {
      console.log(`Auto-removed ${removedCount} sidebar element(s)`)
    }
    
    return tempDiv.innerHTML
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.match(/html?$/i)) {
      setIsLoading(true)
      const reader = new FileReader()
      
      reader.onerror = () => {
        console.error('Error reading file')
        setNotification('Error reading file. Please try again.')
        setTimeout(() => setNotification(null), 3000)
        setIsLoading(false)
      }
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          
          // Check if the HTML contains JavaScript
          if (content.includes('<script') || content.includes('javascript:')) {
            setNotification('Processing JavaScript content...')
            try {
              const processedHTML = await processHTMLWithJavaScript(content)
              setHtmlContent(processedHTML)
              setNotification('JavaScript content processed successfully!')
              setTimeout(() => setNotification(null), 3000)
            } catch (error) {
              console.error('Error processing JavaScript:', error)
              setHtmlContent(content)
              setNotification('Error processing JavaScript, using original HTML')
              setTimeout(() => setNotification(null), 3000)
            }
          } else {
            // Auto-detect and remove sidebars
            const cleanedContent = autoRemoveSidebars(content)
            setHtmlContent(cleanedContent)
            setNotification('File loaded successfully!')
            setTimeout(() => setNotification(null), 2000)
          }
        } catch (error) {
          console.error('Error processing file:', error)
          setNotification('Error processing file. Please try again.')
          setTimeout(() => setNotification(null), 3000)
        } finally {
          setIsLoading(false)
        }
      }
      
      reader.readAsText(file)
    } else {
      setNotification('Please select a valid HTML file')
      setTimeout(() => setNotification(null), 3000)
    }
    
    // Reset the input value to allow re-uploading the same file
    event.target.value = ''
  }



  // Helper function to find the best container element
  const findBestContainer = (element: Element): Element => {
    // Container elements in order of preference (larger to smaller)
    const containerTags = ['section', 'article', 'aside', 'nav', 'header', 'footer', 'main', 'div']
    
    // Start from the element and traverse up
    let current: Element | null = element
    let bestContainer: Element = element
    
    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase()
      
      // If it's a container element, consider it
      if (containerTags.includes(tagName)) {
        // Check if it has meaningful content (not just a wrapper)
        const hasMultipleChildren = current.children.length > 1
        const hasClass = current.className && current.className.trim() !== ''
        const hasId = current.id && current.id.trim() !== ''
        
        // Prefer containers with classes/IDs or multiple children
        if (hasClass || hasId || hasMultipleChildren) {
          bestContainer = current
          
          // If it's a semantic container (not div), prefer it
          if (tagName !== 'div') {
            break
          }
        }
      }
      
      current = current.parentElement
    }
    
    return bestContainer
  }



  const moveElementUpDown = (elementId: string, direction: 'up' | 'down') => {
    // Create a new div with the current HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Find the element to move by its data-element-id
    const elementToMove = tempDiv.querySelector(`[data-element-id="${elementId}"]`)
    if (!elementToMove || !elementToMove.parentNode) {
      setNotification('Cannot move element')
      setTimeout(() => setNotification(null), 2000)
      return
    }
    
    const parent = elementToMove.parentNode
    
    if (direction === 'up') {
      // Move before previous sibling
      const prevSibling = elementToMove.previousElementSibling
      if (prevSibling) {
        parent.insertBefore(elementToMove, prevSibling)
        setNotification('Moved element up')
      } else {
        setNotification('Element is already at the top')
      }
    } else {
      // Move after next sibling
      const nextSibling = elementToMove.nextElementSibling
      if (nextSibling) {
        if (nextSibling.nextElementSibling) {
          parent.insertBefore(elementToMove, nextSibling.nextElementSibling)
        } else {
          parent.appendChild(elementToMove)
        }
        setNotification('Moved element down')
      } else {
        setNotification('Element is already at the bottom')
      }
    }
    
    // Clean up data attributes
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      el.removeAttribute('data-editable')
      el.removeAttribute('data-element-id')
      el.classList.remove('selected-for-move', 'selected-for-deletion')
    })
    
    // Update the HTML content
    setHtmlContent(tempDiv.innerHTML)
    addToHistory(tempDiv.innerHTML)
    setTimeout(() => setNotification(null), 2000)
  }



  const updateElementContent = (elementId: string, newContent: string) => {
    // Create a new div with the current HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Re-apply the same selection logic to find elements
    const selectableElements = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'table', 'ul', 'ol', 'blockquote', 'pre',
      'img', 'figure', 'section', 'article', 'aside',
      'nav', 'header', 'footer', 'main', 'div'
    ]
    
    const elements = tempDiv.querySelectorAll(selectableElements.join(', '))
    const validElements: Element[] = []
    
    elements.forEach((el) => {
      if (!el.closest('[data-editable="true"]')) {
        const textContent = el.textContent?.trim()
        const tagName = el.tagName.toLowerCase()
        if (textContent || tagName === 'img' || tagName === 'table') {
          if (tagName === 'div') {
            const hasNonDivChildren = Array.from(el.children).some(child => child.tagName.toLowerCase() !== 'div')
            const hasDirectText = Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            if (hasNonDivChildren || hasDirectText) {
              validElements.push(el)
            }
          } else {
            validElements.push(el)
          }
        }
      }
    })
    
    // Apply element IDs
    validElements.forEach((el, index) => {
      el.setAttribute('data-element-id', `element-${index}`)
    })
    
    // Find and update the target element
    const targetElement = tempDiv.querySelector(`[data-element-id="${elementId}"]`)
    if (targetElement) {
      targetElement.innerHTML = newContent
    }
    
    // Clean up data attributes
    const remainingElements = tempDiv.querySelectorAll('[data-editable], [data-element-id], [contenteditable]')
    remainingElements.forEach(el => {
      el.removeAttribute('data-editable')
      el.removeAttribute('data-element-id')
      el.removeAttribute('contenteditable')
      el.classList.remove('selected-for-deletion')
    })
    
    // Update the HTML content
    setHtmlContent(tempDiv.innerHTML)
  }

  const removeSelectedElements = () => {
    console.log('removeSelectedElements called with:', Array.from(selectedElements))
    
    if (selectedElements.size === 0) {
      setNotification('No elements selected for removal')
      setTimeout(() => setNotification(null), 2000)
      return
    }
    
    // Create a new div with the current HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    console.log('Re-applying selection logic to match elements...')
    
    // Re-apply the same selection logic as in updatePreview to ensure consistency
    const selectableElements = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'table', 'ul', 'ol', 'blockquote', 'pre',
      'img', 'figure', 'section', 'article', 'aside',
      'nav', 'header', 'footer', 'main', 'div'
    ]
    
    const elements = tempDiv.querySelectorAll(selectableElements.join(', '))
    const validElements: Element[] = []
    
    elements.forEach((el) => {
      if (!el.closest('[data-editable="true"]')) {
        const textContent = el.textContent?.trim()
        const tagName = el.tagName.toLowerCase()
        if (textContent || tagName === 'img' || tagName === 'table') {
          if (tagName === 'div') {
            const hasNonDivChildren = Array.from(el.children).some(child => child.tagName.toLowerCase() !== 'div')
            const hasDirectText = Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            if (hasNonDivChildren || hasDirectText) {
              validElements.push(el)
            }
          } else {
            validElements.push(el)
          }
        }
      }
    })
    
    console.log(`Found ${validElements.length} valid elements to match against`)
    
    // Apply the same element IDs
    validElements.forEach((el, index) => {
      el.setAttribute('data-element-id', `element-${index}`)
    })
    
    // Now remove the selected elements
    let removedCount = 0
    const removedTypes: string[] = []
    const removedDetails: Array<{id: string, tagName: string, text: string}> = []
    
    selectedElements.forEach(elementId => {
      const element = tempDiv.querySelector(`[data-element-id="${elementId}"]`)
      if (element) {
        const tagName = element.tagName.toLowerCase()
        removedTypes.push(tagName)
        removedDetails.push({
          id: elementId,
          tagName,
          text: element.textContent?.substring(0, 50) + '...' || ''
        })
        element.remove()
        removedCount++
        console.log(`Removed element: ${elementId} (${tagName})`)
      } else {
        console.warn(`Could not find element with ID: ${elementId}`)
      }
    })
    
    console.log('Removed elements details:', removedDetails)
    
    // Clean up data attributes from remaining elements
    const remainingElements = tempDiv.querySelectorAll('[data-editable], [data-element-id]')
    remainingElements.forEach(el => {
      el.removeAttribute('data-editable')
      el.removeAttribute('data-element-id')
      el.classList.remove('selected-for-deletion')
    })
    
    // Update the HTML content
    setHtmlContent(tempDiv.innerHTML)
    setSelectedElements(new Set())
    // Keep edit mode active
    
    // Show detailed notification
    if (removedCount > 0) {
      const uniqueTypes = Array.from(new Set(removedTypes))
      const typesSummary = uniqueTypes.slice(0, 3).join(', ') + (uniqueTypes.length > 3 ? '...' : '')
      setNotification(`Successfully removed ${removedCount} element${removedCount > 1 ? 's' : ''} (${typesSummary})`)
      console.log(`Successfully removed ${removedCount} elements`)
    } else {
      setNotification('No elements were removed - please try selecting elements again')
      console.warn('No elements were removed despite having selections')
    }
    setTimeout(() => setNotification(null), 3000)
  }
  
  // Removed unused ExtractedTable interface

  const getPageDimensions = useCallback(() => {
    const size = pageSize === 'custom' 
      ? { width: customWidth, height: customHeight }
      : PAGE_SIZES[pageSize]
    
    return orientation === 'landscape' 
      ? { width: size.height, height: size.width }
      : size
  }, [pageSize, customWidth, customHeight, orientation])

  const convertToPDF = useCallback(async () => {
    if (!htmlContent) return
    
    setIsLoading(true)
    let tempContainer: HTMLDivElement | null = null
    
    try {
      tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = `${getPageDimensions().width}mm`
      tempContainer.innerHTML = htmlContent
      
      // Preserve inline styles by processing all elements
      const allElements = tempContainer.querySelectorAll('*')
      allElements.forEach(el => {
        const element = el as HTMLElement
        if (element.style.color) {
          element.style.setProperty('color', element.style.color, 'important')
        }
        if (element.style.backgroundColor) {
          element.style.setProperty('background-color', element.style.backgroundColor, 'important')
        }
      })
      
      // Add default styles including color preservation
      const styleElement = document.createElement('style')
      styleElement.textContent = `
        * { 
          font-family: Arial, sans-serif; 
          line-height: ${lineHeight};
          font-size: ${fontSize}pt;
        }
        pre, code { 
          font-family: 'Courier New', monospace; 
          background-color: #f4f4f4;
          padding: 2px 4px;
          border-radius: 3px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        /* Only apply default colors if no inline styles or classes */
        th:not([style*="background-color"]):not([class*="bg-"]) {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        thead:not([style*="background-color"]):not([class*="bg-"]) {
          background-color: #f8f9fa;
        }
        thead th:not([style*="background-color"]):not([class*="bg-"]):not([style*="color"]):not([class*="text-"]) {
          background-color: #e9ecef;
          font-weight: bold;
          color: #495057;
        }
        tbody tr:nth-child(even):not([style*="background-color"]):not([class*="bg-"]) {
          background-color: #f8f9fa;
        }
        /* Preserve all color classes */
        .text-red-500 { color: #ef4444 !important; }
        .text-blue-500 { color: #3b82f6 !important; }
        .text-green-500 { color: #10b981 !important; }
        .text-yellow-500 { color: #f59e0b !important; }
        .text-purple-500 { color: #8b5cf6 !important; }
        .text-pink-500 { color: #ec4899 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-green-600 { color: #059669 !important; }
        .bg-red-100 { background-color: #fee2e2 !important; }
        .bg-blue-100 { background-color: #dbeafe !important; }
        .bg-green-100 { background-color: #d1fae5 !important; }
        .bg-yellow-100 { background-color: #fef3c7 !important; }
        .bg-purple-100 { background-color: #e9d5ff !important; }
        .bg-pink-100 { background-color: #fce7f3 !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }

        /* Preserve table inline styles */
        table[style*="background-color"] {
          background-color: var(--inline-bg-color) !important;
        }
        th[style*="background-color"], td[style*="background-color"] {
          background-color: var(--inline-bg-color) !important;
        }
        th[style*="color"], td[style*="color"] {
          color: var(--inline-color) !important;
        }
        /* Preserve specific table classes */
        .table-header-pink { background-color: #fce7f3 !important; }
        .table-header-blue { background-color: #dbeafe !important; }
        .table-header-green { background-color: #d1fae5 !important; }
        .table-header-yellow { background-color: #fef3c7 !important; }
        .table-header-purple { background-color: #e9d5ff !important; }
        .table-header-gray { background-color: #f3f4f6 !important; }        /* Preserve inline styles */
        [style*="color"] {
          color: var(--inline-color) !important;
        }
        [style*="background-color"] {
          background-color: var(--inline-bg-color) !important;
        }
      `
      tempContainer.appendChild(styleElement)
      document.body.appendChild(tempContainer)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Add page break indicators
      const pageBreakStyle = document.createElement('style')
      pageBreakStyle.textContent = `
        .page-break, [style*="page-break-after: always"] {
          display: block;
          height: 2px;
          background: #ddd;
          margin: 20px 0;
          border-top: 2px dashed #999;
        }
        @media print {
          .page-break, [style*="page-break-after: always"] {
            page-break-after: always;
          }
        }
      `
      tempContainer.appendChild(pageBreakStyle)
      
      const canvas = await html2canvas(tempContainer, {
        scale: scale[0] * 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize === 'custom' ? [customWidth, customHeight] : pageSize
      })
      
      const margin = margins[0]
      const pageWidth = getPageDimensions().width
      const pageHeight = getPageDimensions().height
      const contentWidth = pageWidth - (2 * margin)
      const contentHeight = pageHeight - (2 * margin)
      
      // Calculate dimensions
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const totalPages = Math.ceil(imgHeight / contentHeight)
      
      // Add pages
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage()
        }
        
        const sourceY = page * (contentHeight * canvas.width / imgWidth)
        const sourceHeight = Math.min(
          contentHeight * canvas.width / imgWidth,
          canvas.height - sourceY
        )
        
        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHeight
        const ctx = pageCanvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          )
          
          const pageData = pageCanvas.toDataURL('image/jpeg', 0.95)
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width
          
          pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, pageImgHeight)
        }
        
        // Add page number
        pdf.setFontSize(10)
        pdf.setTextColor(150, 150, 150)
        const pageNumText = `${page + 1} / ${totalPages}`
        pdf.text(pageNumText, pageWidth - margin, pageHeight - margin / 2, { align: 'right' })
      }
      
      // Safely remove the container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer)
      }
      
      pdf.save('artifact.pdf')
      
      // Extract tables if requested
      if (extractTables) {
        if (exportFormat === 'xlsx') {
          exportTablesToXLSX()
        } else {
          const tables = extractTablesFromHTML(htmlContent)
          if (tables.length > 0) {
            // Create a separate PDF for tables with colors
            const tablesPdf = new jsPDF()
            
            for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
              if (tableIndex > 0) tablesPdf.addPage()
              
              const table = tables[tableIndex]
              
              // Create a temporary container for the table
              const tableContainer = document.createElement('div')
              tableContainer.style.position = 'absolute'
              tableContainer.style.left = '-9999px'
              tableContainer.style.width = '210mm'
              tableContainer.innerHTML = table.html
              
              // Add styling
              const tableStyle = document.createElement('style')
              tableStyle.textContent = `
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 20px 0;
                }
                th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: left; 
                }
                th { 
                  background-color: #e9ecef; 
                  font-weight: bold; 
                }
              `
              tableContainer.appendChild(tableStyle)
              document.body.appendChild(tableContainer)
              
              // Render table to canvas
              const tableCanvas = await html2canvas(tableContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff'
              })
              
              // Add title
              tablesPdf.setFontSize(16)
              tablesPdf.text(`Table ${tableIndex + 1}`, 10, 20)
              
              // Add table image
              const tableImgData = tableCanvas.toDataURL('image/jpeg', 0.95)
              const tableImgWidth = 190 // A4 width minus margins
              const tableImgHeight = (tableCanvas.height * tableImgWidth) / tableCanvas.width
              
              tablesPdf.addImage(tableImgData, 'JPEG', 10, 30, tableImgWidth, Math.min(tableImgHeight, 250))
              
              // Clean up
              if (tableContainer.parentNode) {
                tableContainer.parentNode.removeChild(tableContainer)
              }
            }
            
            tablesPdf.save('extracted-tables.pdf')
            setNotification(`Successfully extracted ${tables.length} table${tables.length > 1 ? 's' : ''} to PDF with colors`)
            setTimeout(() => setNotification(null), 5000)
          }
        }
      }
    } catch (error) {
      console.error('Error converting to PDF:', error)
      setNotification('Error converting to PDF. Please try again.')
      setTimeout(() => setNotification(null), 3000)
    } finally {
      // Ensure cleanup even if there's an error
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer)
      }
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlContent, orientation, pageSize, customWidth, customHeight, scale, margins, extractTables, getPageDimensions, fontSize, lineHeight, exportFormat, setNotification])

  const convertToPNG = useCallback(async () => {
    if (!htmlContent) return
    
    setIsLoading(true)
    let tempContainer: HTMLDivElement | null = null
    
    try {
      tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = `${getPageDimensions().width * 3.78}px` // mm to px
      tempContainer.innerHTML = htmlContent
      
      // Preserve inline styles by processing all elements
      const allElements = tempContainer.querySelectorAll('*')
      allElements.forEach(el => {
        const element = el as HTMLElement
        if (element.style.color) {
          element.style.setProperty('color', element.style.color, 'important')
        }
        if (element.style.backgroundColor) {
          element.style.setProperty('background-color', element.style.backgroundColor, 'important')
        }
      })
      
      // Add styles to preserve colors and table formatting
      const styleElement = document.createElement('style')
      styleElement.textContent = `
        * { 
          font-family: Arial, sans-serif; 
          line-height: 1.6;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        /* Only apply default colors if no inline styles or classes */
        th:not([style*="background-color"]):not([class*="bg-"]) {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        thead:not([style*="background-color"]):not([class*="bg-"]) {
          background-color: #f8f9fa;
        }
        thead th:not([style*="background-color"]):not([class*="bg-"]):not([style*="color"]):not([class*="text-"]) {
          background-color: #e9ecef;
          font-weight: bold;
          color: #495057;
        }
        tbody tr:nth-child(even):not([style*="background-color"]):not([class*="bg-"]) {
          background-color: #f8f9fa;
        }
        /* Preserve all color classes */
        .text-red-500 { color: #ef4444 !important; }
        .text-blue-500 { color: #3b82f6 !important; }
        .text-green-500 { color: #10b981 !important; }
        .text-yellow-500 { color: #f59e0b !important; }
        .text-purple-500 { color: #8b5cf6 !important; }
        .text-pink-500 { color: #ec4899 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-green-600 { color: #059669 !important; }
        .bg-red-100 { background-color: #fee2e2 !important; }
        .bg-blue-100 { background-color: #dbeafe !important; }
        .bg-green-100 { background-color: #d1fae5 !important; }
        .bg-yellow-100 { background-color: #fef3c7 !important; }
        .bg-purple-100 { background-color: #e9d5ff !important; }
        .bg-pink-100 { background-color: #fce7f3 !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }
      `
      tempContainer.appendChild(styleElement)
      document.body.appendChild(tempContainer)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const canvas = await html2canvas(tempContainer, {
        scale: scale[0] * 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      // Safely remove the container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer)
      }
      
      // Download directly
      const link = document.createElement('a')
      link.download = 'artifact.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error converting to PNG:', error)
      setNotification('Error converting to PNG. Please try again.')
      setTimeout(() => setNotification(null), 3000)
    } finally {
      // Ensure cleanup even if there's an error
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer)
      }
      setIsLoading(false)
    }
  }, [htmlContent, scale, getPageDimensions, setNotification])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(htmlContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  






  const exportTablesToXLSX = useCallback(() => {
    const tables = extractTablesFromHTML(htmlContent)
    
    if (tables.length === 0) {
      setNotification('No tables found in the document')
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    const wb = XLSX.utils.book_new()
    
    tables.forEach((table, index) => {
      // Create worksheet with cell data including colors
      const ws = XLSX.utils.aoa_to_sheet(table.data)
      
      // Apply cell styles
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          const cell = ws[cellAddress]
          
          if (cell) {
            const cellData = table.cellData[R]?.[C]
            if (cellData) {
              // Create cell style object
              if (!cell.s) cell.s = {}
              
              // Apply background color if not default
              if (cellData.backgroundColor && 
                  cellData.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                  cellData.backgroundColor !== 'transparent') {
                
                // Convert RGB to hex
                const rgbMatch = cellData.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
                if (rgbMatch) {
                  const hex = ((1 << 24) + (parseInt(rgbMatch[1]) << 16) + 
                              (parseInt(rgbMatch[2]) << 8) + parseInt(rgbMatch[3]))
                              .toString(16).slice(1).toUpperCase()
                  
                  cell.s.fill = {
                    patternType: "solid",
                    fgColor: { rgb: hex }
                  }
                }
              }
              
              // Apply font color if not default
              if (cellData.color && cellData.color !== 'rgb(0, 0, 0)') {
                const rgbMatch = cellData.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
                if (rgbMatch) {
                  const hex = ((1 << 24) + (parseInt(rgbMatch[1]) << 16) + 
                              (parseInt(rgbMatch[2]) << 8) + parseInt(rgbMatch[3]))
                              .toString(16).slice(1).toUpperCase()
                  
                  if (!cell.s.font) cell.s.font = {}
                  cell.s.font.color = { rgb: hex }
                }
              }
              
              // Make headers bold
              if (cellData.isHeader) {
                if (!cell.s.font) cell.s.font = {}
                cell.s.font.bold = true
              }
            }
          }
        }
      }
      
      // Add worksheet to workbook
      const sheetName = `Table ${index + 1}`
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    // Save the file
    XLSX.writeFile(wb, 'extracted-tables.xlsx')
    
    setNotification(`Successfully extracted ${tables.length} table${tables.length > 1 ? 's' : ''} to Excel with formatting`)
    setTimeout(() => setNotification(null), 5000)
  }, [htmlContent, setNotification])



  const handleExtractTables = () => {
    setShowTableDownloader(true)
  }

  const handleColorApply = (colors: ContainerColors) => {
    if (!colorPickerElement) return
    
    // Create a new div with the current HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Re-apply the same selection logic to find elements
    const selectableElements = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'table', 'ul', 'ol', 'blockquote', 'pre',
      'img', 'figure', 'section', 'article', 'aside',
      'nav', 'header', 'footer', 'main', 'div'
    ]
    
    const elements = tempDiv.querySelectorAll(selectableElements.join(', '))
    const validElements: Element[] = []
    
    elements.forEach((el) => {
      if (!el.closest('[data-editable="true"]')) {
        const textContent = el.textContent?.trim()
        const tagName = el.tagName.toLowerCase()
        if (textContent || tagName === 'img' || tagName === 'table') {
          if (tagName === 'div') {
            const hasNonDivChildren = Array.from(el.children).some(child => child.tagName.toLowerCase() !== 'div')
            const hasDirectText = Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            if (hasNonDivChildren || hasDirectText) {
              validElements.push(el)
            }
          } else {
            validElements.push(el)
          }
        }
      }
    })
    
    // Apply element IDs
    validElements.forEach((el, index) => {
      el.setAttribute('data-element-id', `element-${index}`)
    })
    
    // Find and update the target element
    const targetElement = tempDiv.querySelector(`[data-element-id="${colorPickerElement.id}"]`) as HTMLElement
    if (targetElement) {
      // Apply colors
      if (colors.backgroundColor !== 'transparent') {
        targetElement.style.backgroundColor = colors.backgroundColor
      } else {
        targetElement.style.backgroundColor = 'transparent'
      }
      
      targetElement.style.borderColor = colors.borderColor
      targetElement.style.borderWidth = '2px'
      targetElement.style.borderStyle = 'solid'
      
      // Apply text color to all text elements inside
      const applyTextColor = (element: Element) => {
        const el = element as HTMLElement
        // Apply to the element itself if it has text
        if (el.childNodes.length > 0) {
          el.style.color = colors.textColor
        }
        
        // Apply to all children recursively
        Array.from(el.children).forEach(child => {
          const childEl = child as HTMLElement
          childEl.style.color = colors.textColor
          applyTextColor(child)
        })
      }
      
      applyTextColor(targetElement)
    }
    
    // Clean up data attributes
    const remainingElements = tempDiv.querySelectorAll('[data-editable], [data-element-id]')
    remainingElements.forEach(el => {
      el.removeAttribute('data-editable')
      el.removeAttribute('data-element-id')
    })
    
    // Update the HTML content
    setHtmlContent(tempDiv.innerHTML)
    setNotification('Container colors updated successfully')
    setTimeout(() => setNotification(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-foreground">
              Document Converter Studio
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload HTML
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      <div className="flex h-[calc(100vh-57px)]">
        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 bg-card border-r border-border overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Page Settings */}
              <div className="bg-muted rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Page Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="page-size" className="text-xs">Page Size</Label>
                    <Select value={pageSize} onValueChange={setPageSize}>
                      <SelectTrigger id="page-size" className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAGE_SIZES).map(([key, size]) => (
                          <SelectItem key={key} value={key}>
                            {size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {pageSize === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="custom-width" className="text-xs">Width (mm)</Label>
                        <Input
                          id="custom-width"
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-height" className="text-xs">Height (mm)</Label>
                        <Input
                          id="custom-height"
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="orientation" className="text-xs">Orientation</Label>
                    <Select value={orientation} onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}>
                      <SelectTrigger id="orientation" className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="margins" className="text-xs">Margins: {margins[0]}mm</Label>
                    <Slider
                      id="margins"
                      min={0}
                      max={30}
                      step={1}
                      value={margins}
                      onValueChange={setMargins}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Typography Settings */}
              <div className="bg-muted rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Typography
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="font-size" className="text-xs">Font Size: {fontSize[0]}pt</Label>
                    <Slider
                      id="font-size"
                      min={8}
                      max={24}
                      step={1}
                      value={fontSize}
                      onValueChange={setFontSize}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="line-height" className="text-xs">Line Height: {lineHeight[0]}</Label>
                    <Slider
                      id="line-height"
                      min={1}
                      max={3}
                      step={0.1}
                      value={lineHeight}
                      onValueChange={setLineHeight}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Settings */}
              <div className="bg-muted rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Preview
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="preview-zoom" className="text-xs">Zoom: {Math.round(previewZoom[0] * 100)}%</Label>
                    <Slider
                      id="preview-zoom"
                      min={0.25}
                      max={2}
                      step={0.05}
                      value={previewZoom}
                      onValueChange={setPreviewZoom}
                      className="mt-1"
                    />
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => setPreviewZoom([0.5])}
                      >
                        50%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => setPreviewZoom([0.75])}
                      >
                        75%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => setPreviewZoom([1])}
                      >
                        100%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => setPreviewZoom([1.5])}
                      >
                        150%
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-page-breaks" className="text-xs">Show Page Breaks</Label>
                    <Switch
                      id="show-page-breaks"
                      checked={showPageBreaks}
                      onCheckedChange={setShowPageBreaks}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-preview" className="text-xs">Show Preview</Label>
                    <Switch
                      id="show-preview"
                      checked={showPreview}
                      onCheckedChange={setShowPreview}
                    />
                  </div>
                </div>
              </div>

              {/* Export Settings */}
              <div className="bg-muted rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Export Options
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="scale" className="text-xs">Export Quality: {scale[0]}x</Label>
                    <Slider
                      id="scale"
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={scale}
                      onValueChange={setScale}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="extract-tables" className="text-xs">Extract Tables</Label>
                    <Switch
                      id="extract-tables"
                      checked={extractTables}
                      onCheckedChange={setExtractTables}
                    />
                  </div>
                  
                  {extractTables && (
                    <div>
                      <Label htmlFor="export-format" className="text-xs">Table Export Format</Label>
                      <Select value={exportFormat} onValueChange={(value: 'pdf' | 'xlsx') => setExportFormat(value)}>
                        <SelectTrigger id="export-format" className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Settings */}
              {editMode && (
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Edit Actions
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={editAction === 'remove' ? 'default' : 'outline'}
                        onClick={() => setEditAction('remove')}
                        className="h-8"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        variant={editAction === 'move' ? 'default' : 'outline'}
                        onClick={() => setEditAction('move')}
                        className="h-8"
                      >
                        <Move className="w-3 h-3 mr-1" />
                        Move
                      </Button>
                      <Button
                        size="sm"
                        variant={editAction === 'edit' ? 'default' : 'outline'}
                        onClick={() => setEditAction('edit')}
                        className="h-8"
                      >
                        <Type className="w-3 h-3 mr-1" />
                        Edit Text
                      </Button>
                      <Button
                        size="sm"
                        variant={editAction === 'color' ? 'default' : 'outline'}
                        onClick={() => setEditAction('color')}
                        className="h-8"
                      >
                        <Palette className="w-3 h-3 mr-1" />
                        Color
                      </Button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Action Bar */}
          <div className="bg-card border-b border-border px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {htmlContent && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={convertToPDF}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      Export PDF
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={convertToPNG}
                      disabled={isLoading}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? 'Copied!' : 'Copy HTML'}
                    </Button>
                    
                    <div className="h-4 w-px bg-border" />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {editMode ? 'Done Editing' : 'Edit Content'}
                    </Button>
                    


                    

                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExtractTables}
                    >
                      <TableIcon className="w-4 h-4 mr-2" />
                      Extract Tables
                    </Button>
                    
                    {history.length > 1 && (
                      <>
                        <div className="h-4 w-px bg-border" />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={undo}
                          disabled={historyIndex <= 0}
                          title="Undo (Ctrl+Z)"
                        >
                          <Undo2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={redo}
                          disabled={historyIndex >= history.length - 1}
                          title="Redo (Ctrl+Y)"
                        >
                          <Redo2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {editMode && (
                <div className="flex items-center space-x-2">
                  {editAction === 'remove' && selectedElements.size > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={removeSelectedElements}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Selected ({selectedElements.size})
                    </Button>
                  )}
                  

                </div>
              )}
            </div>
          </div>

          {/* Preview Area */}
        <div 
          className="relative bg-gray-100 rounded-lg overflow-auto"
          style={{ height: 'calc(100vh - 200px)' }}
        >
            {showPreview && htmlContent ? (
              <div style={{ transform: `scale(${previewZoom[0]})`, transformOrigin: 'top center' }}>
                <PreviewPages
                  htmlContent={htmlContent}
                  pageSize={getPageDimensions()}
                  margins={margins[0]}
                  scale={scale[0]}
                  fontSize={fontSize[0]}
                  lineHeight={lineHeight[0]}
                  showPageBreaks={showPageBreaks}
                  previewRef={previewRef}
                  onPagesUpdate={() => {}}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Upload an HTML file to get started</p>
                </div>
              </div>
            )}
            

          </div>
        </div>
      </div>

            {/* Move Controls */}
            {editMode && editAction === 'move' && moveTargetElement && showEditToolbar && (
              <div 
                className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50"
                style={{
                  left: `${editToolbarPosition.x}px`,
                  top: `${editToolbarPosition.y}px`
                }}
              >
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      moveElementUpDown(moveTargetElement, 'up')
                      setShowEditToolbar(false)
                      setMoveTargetElement(null)
                      setSelectedElements(new Set())
                    }}
                    className="flex items-center justify-center"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      moveElementUpDown(moveTargetElement, 'down')
                      setShowEditToolbar(false)
                      setMoveTargetElement(null)
                      setSelectedElements(new Set())
                    }}
                    className="flex items-center justify-center"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowEditToolbar(false)
                      setMoveTargetElement(null)
                      setSelectedElements(new Set())
                      // Clear selected class
                      if (previewRef.current) {
                        const element = previewRef.current.querySelector(`[data-element-id="${moveTargetElement}"]`)
                        if (element) {
                          element.classList.remove('selected-for-move')
                        }
                      }
                    }}
                    className="flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Table Downloader Component */}
            {showTableDownloader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Download Tables</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTableDownloader(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <TableDownloader 
              htmlContent={htmlContent}
              onNotification={setNotification}
            />
          </div>
        </div>
      )}

      {/* Color Picker Dialog */}
      <ContainerColorPicker
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onApply={handleColorApply}
        initialColors={containerColors}
        elementId={colorPickerElement?.id || ''}
        elementType={colorPickerElement?.type || ''}
      />
    </div>
  )
}
