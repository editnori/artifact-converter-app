import { applyAutoReflow, reflowAfterDeletion, reflowAfterResize } from '../auto-reflow'

// Mock page dimensions
const PAGE_HEIGHT_PX = 1122.52 // A4 at 96 DPI
const MARGINS = 20

// Mock DOM elements
const createMockElement = (id: string, top: number, height: number): HTMLElement => {
  const element = document.createElement('div')
  element.id = id
  element.setAttribute('data-element-id', id)
  element.style.position = 'absolute'
  element.style.top = `${top}px`
  element.style.height = `${height}px`
  element.getBoundingClientRect = jest.fn(() => ({
    top,
    left: 0,
    right: 100,
    bottom: top + height,
    width: 100,
    height,
    x: 0,
    y: top,
    toJSON: () => ({})
  }))
  Object.defineProperty(element, 'offsetTop', {
    get: () => top,
    configurable: true
  })
  return element
}

describe('auto-reflow', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.position = 'relative'
    container.style.width = '800px'
    container.style.height = '1200px'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('applyAutoReflow', () => {
    it('should reflow elements to remove gaps', () => {
      // Create elements with gaps
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 200, 100) // 100px gap
      const elem3 = createMockElement('elem3', 400, 100) // 100px gap
      
      container.appendChild(elem1)
      container.appendChild(elem2)
      container.appendChild(elem3)

      applyAutoReflow(container, PAGE_HEIGHT_PX, MARGINS)

      // Elements should be repositioned to remove gaps
      expect(elem2.style.top).toBe('110px') // 100 + 10px margin
      expect(elem3.style.top).toBe('220px') // 210 + 10px margin
    })

    it('should maintain minimum spacing between elements', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 100, 100) // No gap
      
      container.appendChild(elem1)
      container.appendChild(elem2)

      applyAutoReflow(container, PAGE_HEIGHT_PX, MARGINS)

      // Should add minimum spacing
      expect(elem2.style.top).toBe('110px')
    })

    it('should handle elements with different widths', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      elem1.style.width = '400px'
      const elem2 = createMockElement('elem2', 150, 100)
      elem2.style.width = '300px'
      
      container.appendChild(elem1)
      container.appendChild(elem2)

      applyAutoReflow(container, PAGE_HEIGHT_PX, MARGINS)

      expect(elem2.style.top).toBe('110px')
    })

    it('should skip elements with data-no-reflow attribute', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 200, 100)
      elem2.setAttribute('data-no-reflow', 'true')
      
      container.appendChild(elem1)
      container.appendChild(elem2)

      applyAutoReflow(container, PAGE_HEIGHT_PX, MARGINS)

      // elem2 should not move
      expect(elem2.style.top).toBe('200px')
    })

    it('should handle empty container', () => {
      expect(() => applyAutoReflow(container)).not.toThrow()
    })

    it('should handle single element', () => {
      const elem1 = createMockElement('elem1', 50, 100)
      container.appendChild(elem1)

      applyAutoReflow(container, PAGE_HEIGHT_PX, MARGINS)

      // Single element should move to top
      expect(elem1.style.top).toBe('0px')
    })
  })

  describe('reflowAfterDeletion', () => {
    it('should reflow elements after deletion', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 110, 100)
      const elem3 = createMockElement('elem3', 220, 100)
      
      container.appendChild(elem1)
      container.appendChild(elem2)
      container.appendChild(elem3)

      // Remove middle element
      container.removeChild(elem2)

      reflowAfterDeletion(container, new Set(['elem2']), PAGE_HEIGHT_PX, MARGINS)

      // elem3 should move up
      expect(elem3.style.top).toBe('110px')
    })

    it('should handle deletion of multiple elements', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 110, 100)
      const elem3 = createMockElement('elem3', 220, 100)
      const elem4 = createMockElement('elem4', 330, 100)
      
      container.appendChild(elem1)
      container.appendChild(elem2)
      container.appendChild(elem3)
      container.appendChild(elem4)

      // Remove multiple elements
      container.removeChild(elem2)
      container.removeChild(elem3)

      reflowAfterDeletion(container, new Set(['elem2', 'elem3']), PAGE_HEIGHT_PX, MARGINS)

      // elem4 should move up
      expect(elem4.style.top).toBe('110px')
    })

    it('should maintain relative spacing', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 120, 100) // 20px gap
      const elem3 = createMockElement('elem3', 240, 100) // 20px gap
      
      container.appendChild(elem1)
      container.appendChild(elem2)
      container.appendChild(elem3)

      container.removeChild(elem2)
      reflowAfterDeletion(container, new Set(['elem2']), PAGE_HEIGHT_PX, MARGINS)

      // elem3 should maintain similar spacing
      expect(parseInt(elem3.style.top)).toBeGreaterThanOrEqual(110)
      expect(parseInt(elem3.style.top)).toBeLessThanOrEqual(130)
    })
  })

  describe('reflowAfterResize', () => {
    it('should adjust spacing after element resize', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 110, 100)
      
      container.appendChild(elem1)
      container.appendChild(elem2)

      // Resize elem1 to be taller
      elem1.style.height = '150px'
      elem1.getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        right: 100,
        bottom: 150,
        width: 100,
        height: 150,
        x: 0,
        y: 0,
        toJSON: () => ({})
      }))

      reflowAfterResize(container, 'elem1', 100, 150, PAGE_HEIGHT_PX, MARGINS)

      // elem2 should move down
      expect(elem2.style.top).toBe('160px') // 150 + 10px margin
    })

    it('should handle resize to smaller height', () => {
      const elem1 = createMockElement('elem1', 0, 150)
      const elem2 = createMockElement('elem2', 160, 100)
      
      container.appendChild(elem1)
      container.appendChild(elem2)

      // Resize elem1 to be shorter
      elem1.style.height = '80px'
      elem1.getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        right: 100,
        bottom: 80,
        width: 100,
        height: 80,
        x: 0,
        y: 0,
        toJSON: () => ({})
      }))

      reflowAfterResize(container, 'elem1', 150, 80)

      // elem2 should move up
      expect(elem2.style.top).toBe('90px') // 80 + 10px margin
    })

    it('should not affect elements above resized element', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      const elem2 = createMockElement('elem2', 110, 100)
      const elem3 = createMockElement('elem3', 220, 100)
      
      container.appendChild(elem1)
      container.appendChild(elem2)
      container.appendChild(elem3)

      // Resize middle element
      elem2.style.height = '150px'
      elem2.getBoundingClientRect = jest.fn(() => ({
        top: 110,
        left: 0,
        right: 100,
        bottom: 260,
        width: 100,
        height: 150,
        x: 0,
        y: 110,
        toJSON: () => ({})
      }))

      reflowAfterResize(container, 'elem2', 100, 150, PAGE_HEIGHT_PX, MARGINS)

      // elem1 should not move
      expect(elem1.style.top).toBe('0px')
      // elem3 should move down
      expect(elem3.style.top).toBe('270px') // 110 + 150 + 10px margin
    })

    it('should handle resize of non-existent element', () => {
      const elem1 = createMockElement('elem1', 0, 100)
      container.appendChild(elem1)

      expect(() => reflowAfterResize(container, 'non-existent', 100, 150, PAGE_HEIGHT_PX, MARGINS)).not.toThrow()
      expect(elem1.style.top).toBe('0px')
    })
  })
})