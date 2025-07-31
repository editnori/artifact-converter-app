import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContainerColorPicker } from '../container-color-picker'

describe('ContainerColorPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onApply: jest.fn(),
    initialColors: {
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      textColor: '#333333'
    },
    elementId: 'test-element',
    elementType: 'container' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when open', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    expect(screen.getByText('Container Colors')).toBeInTheDocument()
    expect(screen.getByLabelText('Background Color')).toBeInTheDocument()
    expect(screen.getByLabelText('Border Color')).toBeInTheDocument()
    expect(screen.getByLabelText('Text Color')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ContainerColorPicker {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Container Colors')).not.toBeInTheDocument()
  })

  it('displays initial colors', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const bgInput = screen.getByLabelText('Background Color') as HTMLInputElement
    const borderInput = screen.getByLabelText('Border Color') as HTMLInputElement
    const textInput = screen.getByLabelText('Text Color') as HTMLInputElement
    
    expect(bgInput.value).toBe('#ffffff')
    expect(borderInput.value).toBe('#000000')
    expect(textInput.value).toBe('#333333')
  })

  it('updates colors when inputs change', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const bgInput = screen.getByLabelText('Background Color') as HTMLInputElement
    
    fireEvent.change(bgInput, { target: { value: '#ff0000' } })
    
    expect(bgInput.value).toBe('#ff0000')
  })

  it('calls onApply with updated colors', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const bgInput = screen.getByLabelText('Background Color')
    fireEvent.change(bgInput, { target: { value: '#ff0000' } })
    
    const applyButton = screen.getByText('Apply')
    fireEvent.click(applyButton)
    
    expect(defaultProps.onApply).toHaveBeenCalledWith({
      backgroundColor: '#ff0000',
      borderColor: '#000000',
      textColor: '#333333'
    })
  })

  it('calls onClose when cancel is clicked', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('resets colors when reset button is clicked', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const bgInput = screen.getByLabelText('Background Color') as HTMLInputElement
    
    // Change color
    fireEvent.change(bgInput, { target: { value: '#ff0000' } })
    expect(bgInput.value).toBe('#ff0000')
    
    // Reset
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)
    
    expect(bgInput.value).toBe('#ffffff')
  })

  it('shows correct title for different element types', () => {
    const { rerender } = render(<ContainerColorPicker {...defaultProps} elementType="text" />)
    expect(screen.getByText('Text Colors')).toBeInTheDocument()
    
    rerender(<ContainerColorPicker {...defaultProps} elementType="image" />)
    expect(screen.getByText('Image Colors')).toBeInTheDocument()
    
    rerender(<ContainerColorPicker {...defaultProps} elementType="table" />)
    expect(screen.getByText('Table Colors')).toBeInTheDocument()
  })

  it('handles transparent background option', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const transparentCheckbox = screen.getByLabelText('Transparent Background')
    fireEvent.click(transparentCheckbox)
    
    const applyButton = screen.getByText('Apply')
    fireEvent.click(applyButton)
    
    expect(defaultProps.onApply).toHaveBeenCalledWith({
      backgroundColor: 'transparent',
      borderColor: '#000000',
      textColor: '#333333'
    })
  })

  it('disables background color input when transparent is checked', () => {
    render(<ContainerColorPicker {...defaultProps} />)
    
    const bgInput = screen.getByLabelText('Background Color') as HTMLInputElement
    const transparentCheckbox = screen.getByLabelText('Transparent Background')
    
    expect(bgInput).not.toBeDisabled()
    
    fireEvent.click(transparentCheckbox)
    
    expect(bgInput).toBeDisabled()
  })
})