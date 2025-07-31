// Auto-reflow functionality for artifact converter
// Automatically reflows content to fill available space like MS Word

interface ElementBounds {
  element: HTMLElement
  elementId: string
  top: number
  bottom: number
  height: number
  marginTop: number
  marginBottom: number
  pageIndex: number
}

interface PageInfo {
  index: number
  startY: number
  endY: number
  elements: ElementBounds[]
  usedHeight: number
  availableHeight: number
}

// Get element bounds including margins
export const getElementFullBounds = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const styles = window.getComputedStyle(element)
  const marginTop = parseInt(styles.marginTop) || 0
  const marginBottom = parseInt(styles.marginBottom) || 0
  
  const top = element.offsetTop
  const height = rect.height + marginTop + marginBottom
  const bottom = top + height
  
  return {
    top,
    bottom,
    height,
    marginTop,
    marginBottom
  }
}

// Calculate page information based on current layout
export const calculatePageInfo = (
  elements: HTMLElement[],
  pageHeightPx: number,
  startOffset: number = 0
): PageInfo[] => {
  const pages: PageInfo[] = []
  // let currentPageIndex = 0
  
  elements.forEach((element, index) => {
    const elementId = element.getAttribute('data-element-id') || `element-${index}`
    const bounds = getElementFullBounds(element)
    
    // Determine which page this element belongs to
    const elementPageStart = Math.max(0, Math.floor((bounds.top - startOffset) / pageHeightPx))
    const elementPageEnd = Math.max(0, Math.floor((bounds.bottom - startOffset) / pageHeightPx))
    
    // Ensure we have pages up to this element
    while (pages.length <= elementPageEnd) {
      pages.push({
        index: pages.length,
        startY: pages.length * pageHeightPx + startOffset,
        endY: (pages.length + 1) * pageHeightPx + startOffset,
        elements: [],
        usedHeight: 0,
        availableHeight: pageHeightPx
      })
    }
    
    // Add element to its primary page
    const elementBounds: ElementBounds = {
      element,
      elementId,
      ...bounds,
      pageIndex: elementPageStart
    }
    
    pages[elementPageStart].elements.push(elementBounds)
  })
  
  // Calculate used height for each page
  pages.forEach(page => {
    if (page.elements.length > 0) {
      const firstElement = page.elements[0]
      const lastElement = page.elements[page.elements.length - 1]
      
      // Calculate from the top of first element to bottom of last element
      const usedTop = Math.max(firstElement.top, page.startY)
      const usedBottom = Math.min(lastElement.bottom, page.endY)
      page.usedHeight = usedBottom - usedTop
      page.availableHeight = pageHeightPx - page.usedHeight
    }
  })
  
  return pages
}

// Find gaps in the layout where content can be moved up
export const findGapsInLayout = (
  pages: PageInfo[],
  minGapSize: number = 20
): { pageIndex: number; gapSize: number; afterElement?: string }[] => {
  const gaps: { pageIndex: number; gapSize: number; afterElement?: string }[] = []
  
  pages.forEach((page, pageIndex) => {
    if (page.elements.length === 0) {
      // Empty page is a full gap
      gaps.push({
        pageIndex,
        gapSize: page.availableHeight
      })
    } else {
      // Check gap at the beginning of the page
      const firstElement = page.elements[0]
      const gapAtStart = firstElement.top - page.startY
      if (gapAtStart >= minGapSize) {
        gaps.push({
          pageIndex,
          gapSize: gapAtStart
        })
      }
      
      // Check gaps between elements
      for (let i = 0; i < page.elements.length - 1; i++) {
        const current = page.elements[i]
        const next = page.elements[i + 1]
        const gapSize = next.top - current.bottom
        
        if (gapSize >= minGapSize) {
          gaps.push({
            pageIndex,
            gapSize,
            afterElement: current.elementId
          })
        }
      }
      
      // Check gap at the end of the page
      const lastElement = page.elements[page.elements.length - 1]
      const gapAtEnd = page.endY - lastElement.bottom
      if (gapAtEnd >= minGapSize && pageIndex < pages.length - 1) {
        gaps.push({
          pageIndex,
          gapSize: gapAtEnd,
          afterElement: lastElement.elementId
        })
      }
    }
  })
  
  return gaps
}

// Apply auto-reflow to move elements up to fill gaps
export const applyAutoReflow = (
  tempDiv: HTMLElement,
  pageHeightPx: number,
  margins: number,
  preserveIntentionalSpacing: boolean = true
): { movedCount: number; details: string[] } => {
  const details: string[] = []
  let movedCount = 0
  
  // Get all elements with IDs
  const elements = Array.from(tempDiv.querySelectorAll('[data-element-id]')) as HTMLElement[]
  if (elements.length === 0) return { movedCount: 0, details: [] }
  
  // Calculate current page layout
  const pages = calculatePageInfo(elements, pageHeightPx, margins * 3.7795275591)
  
  // Find gaps in the layout
  const gaps = findGapsInLayout(pages, 30) // Minimum 30px gap to consider
  
  // Sort gaps by page index (process from top to bottom)
  gaps.sort((a, b) => a.pageIndex - b.pageIndex)
  
  // Process each gap
  gaps.forEach(gap => {
    // Find elements that could potentially move up to fill this gap
    const candidateElements = elements.filter((el, index) => {
      const elementId = el.getAttribute('data-element-id')
      const elementBounds = getElementFullBounds(el)
      
      // Element must be below the gap
      if (gap.afterElement) {
        const afterElementIndex = elements.findIndex(e => 
          e.getAttribute('data-element-id') === gap.afterElement
        )
        return index > afterElementIndex
      } else {
        // Gap is at the start of a page
        return elementBounds.top > pages[gap.pageIndex].startY
      }
    })
    
    // Try to move elements up to fill the gap
    candidateElements.forEach(element => {
      const elementBounds = getElementFullBounds(element)
      const elementId = element.getAttribute('data-element-id') || ''
      
      // Check if element fits in the gap
      if (elementBounds.height <= gap.gapSize) {
        // Check if moving this element would create a better layout
        const currentMarginTop = parseInt(window.getComputedStyle(element).marginTop) || 0
        
        // Calculate how much to move up
        let moveDistance = 0
        
        if (gap.afterElement) {
          // Move to position after the specified element
          const afterElement = tempDiv.querySelector(`[data-element-id="${gap.afterElement}"]`)
          if (afterElement) {
            const afterBounds = getElementFullBounds(afterElement as HTMLElement)
            moveDistance = elementBounds.top - (afterBounds.bottom + 10) // 10px spacing
          }
        } else {
          // Move to the start of the page
          moveDistance = elementBounds.top - (pages[gap.pageIndex].startY + 10)
        }
        
        // Only move if it's a significant distance
        if (moveDistance > 50) {
          // Apply the movement
          element.style.marginTop = `${currentMarginTop - moveDistance}px`
          element.setAttribute('data-auto-reflowed', 'true')
          
          movedCount++
          details.push(`Moved ${element.tagName.toLowerCase()} up by ${Math.round(moveDistance)}px to fill gap on page ${gap.pageIndex + 1}`)
          
          // Update gap size
          gap.gapSize -= elementBounds.height
        }
      }
    })
  })
  
  // Second pass: Ensure no elements are cut by page breaks after reflow
  const updatedElements = Array.from(tempDiv.querySelectorAll('[data-element-id]')) as HTMLElement[]
  updatedElements.forEach(element => {
    const bounds = getElementFullBounds(element)
    const pageStart = Math.floor(bounds.top / pageHeightPx)
    const pageEnd = Math.floor(bounds.bottom / pageHeightPx)
    
    // If element spans multiple pages, move it to the next page
    if (pageStart !== pageEnd) {
      const nextPageStart = (pageEnd * pageHeightPx) + 20 // 20px margin from top
      const currentMarginTop = parseInt(window.getComputedStyle(element).marginTop) || 0
      const adjustment = nextPageStart - bounds.top
      
      element.style.marginTop = `${currentMarginTop + adjustment}px`
      element.setAttribute('data-page-break-adjusted', 'true')
      details.push(`Adjusted ${element.tagName.toLowerCase()} to avoid page break cut`)
    }
  })
  
  return { movedCount, details }
}

// Reflow content when an element is deleted
export const reflowAfterDeletion = (
  tempDiv: HTMLElement,
  deletedElementIds: Set<string>,
  pageHeightPx: number,
  margins: number
): { movedCount: number; details: string[] } => {
  const details: string[] = []
  let movedCount = 0
  
  // Get remaining elements
  const elements = Array.from(tempDiv.querySelectorAll('[data-element-id]')) as HTMLElement[]
  
  // Find the position of the first deleted element
  let minDeletedPosition = Infinity
  deletedElementIds.forEach(id => {
    const index = elements.findIndex(el => el.getAttribute('data-element-id') === id)
    if (index !== -1 && index < minDeletedPosition) {
      minDeletedPosition = index
    }
  })
  
  // Move up all elements after the deleted ones
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    const elementId = element.getAttribute('data-element-id') || ''
    
    // Skip if this element is being deleted
    if (deletedElementIds.has(elementId)) continue
    
    // Check if there's a gap above this element
    if (i > 0) {
      const prevElement = elements[i - 1]
      const prevBounds = getElementFullBounds(prevElement)
      const currentBounds = getElementFullBounds(element)
      const gap = currentBounds.top - prevBounds.bottom
      
      // If there's a significant gap, move this element up
      if (gap > 20) {
        const currentMarginTop = parseInt(window.getComputedStyle(element).marginTop) || 0
        const newMarginTop = Math.max(0, currentMarginTop - gap + 10) // Keep 10px spacing
        
        element.style.marginTop = `${newMarginTop}px`
        element.setAttribute('data-reflowed-after-deletion', 'true')
        
        movedCount++
        details.push(`Moved ${element.tagName.toLowerCase()} up by ${gap - 10}px after deletion`)
      }
    }
  }
  
  // Apply general reflow to optimize layout
  const reflowResult = applyAutoReflow(tempDiv, pageHeightPx, margins)
  movedCount += reflowResult.movedCount
  details.push(...reflowResult.details)
  
  return { movedCount, details }
}

// Reflow content when an element is resized
export const reflowAfterResize = (
  tempDiv: HTMLElement,
  resizedElementId: string,
  oldHeight: number,
  newHeight: number,
  pageHeightPx: number,
  margins: number
): { movedCount: number; details: string[] } => {
  const details: string[] = []
  let movedCount = 0
  
  const heightDifference = oldHeight - newHeight
  
  // If element got smaller, move following elements up
  if (heightDifference > 0) {
    const elements = Array.from(tempDiv.querySelectorAll('[data-element-id]')) as HTMLElement[]
    const resizedIndex = elements.findIndex(el => 
      el.getAttribute('data-element-id') === resizedElementId
    )
    
    if (resizedIndex !== -1) {
      // Move all following elements up by the height difference
      for (let i = resizedIndex + 1; i < elements.length; i++) {
        const element = elements[i]
        const currentMarginTop = parseInt(window.getComputedStyle(element).marginTop) || 0
        
        element.style.marginTop = `${currentMarginTop - heightDifference}px`
        element.setAttribute('data-reflowed-after-resize', 'true')
        
        movedCount++
      }
      
      details.push(`Moved ${movedCount} elements up by ${heightDifference}px after resize`)
    }
  }
  
  // Apply general reflow to optimize layout
  const reflowResult = applyAutoReflow(tempDiv, pageHeightPx, margins)
  movedCount += reflowResult.movedCount
  details.push(...reflowResult.details)
  
  return { movedCount, details }
}