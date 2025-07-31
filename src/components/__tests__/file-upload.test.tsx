import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArtifactConverterSimplified from '../artifact-converter-simplified'

// Mock the external libraries
jest.mock('html2canvas')
jest.mock('jspdf')
jest.mock('xlsx')

describe('File Upload Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should render the file upload area', () => {
    render(<ArtifactConverterSimplified />)
    
    expect(screen.getByText(/Drop your file here or click to browse/i)).toBeInTheDocument()
    expect(screen.getByText(/Supports: HTML, TXT, DOCX, PDF, Images/i)).toBeInTheDocument()
  })

  it('should handle HTML file upload', async () => {
    const user = userEvent.setup()
    render(<ArtifactConverterSimplified />)
    
    const htmlContent = '<h1>Test HTML</h1><p>This is a test paragraph.</p>'
    const file = new File([htmlContent], 'test.html', { type: 'text/html' })
    
    const input = screen.getByLabelText(/Drop your file here/i)
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText('test.html')).toBeInTheDocument()
    })
  })

  it('should handle text file upload', async () => {
    const user = userEvent.setup()
    render(<ArtifactConverterSimplified />)
    
    const textContent = 'This is a plain text file content.'
    const file = new File([textContent], 'test.txt', { type: 'text/plain' })
    
    const input = screen.getByLabelText(/Drop your file here/i)
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument()
    })
  })

  it('should show error for unsupported file types', async () => {
    const user = userEvent.setup()
    render(<ArtifactConverterSimplified />)
    
    const file = new File(['content'], 'test.xyz', { type: 'application/xyz' })
    
    const input = screen.getByLabelText(/Drop your file here/i)
    
    await user.upload(input, file)
    
    // The component should not process unsupported files
    await waitFor(() => {
      expect(screen.queryByText('test.xyz')).not.toBeInTheDocument()
    })
  })

  it('should handle drag and drop', async () => {
    render(<ArtifactConverterSimplified />)
    
    const dropZone = screen.getByText(/Drop your file here or click to browse/i).parentElement
    
    if (!dropZone) {
      throw new Error('Drop zone not found')
    }
    
    const file = new File(['<h1>Drag and Drop Test</h1>'], 'dragdrop.html', { type: 'text/html' })
    
    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        files: [file],
        types: ['Files']
      }
    })
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
        types: ['Files']
      }
    })
    
    await waitFor(() => {
      expect(screen.getByText('dragdrop.html')).toBeInTheDocument()
    })
  })

  it('should clear file when clicking remove button', async () => {
    const user = userEvent.setup()
    render(<ArtifactConverterSimplified />)
    
    const file = new File(['<h1>Test</h1>'], 'test.html', { type: 'text/html' })
    const input = screen.getByLabelText(/Drop your file here/i)
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText('test.html')).toBeInTheDocument()
    })
    
    // Find and click the remove button
    const removeButton = screen.getByRole('button', { name: /remove file/i })
    await user.click(removeButton)
    
    // File should be removed
    expect(screen.queryByText('test.html')).not.toBeInTheDocument()
    expect(screen.getByText(/Drop your file here or click to browse/i)).toBeInTheDocument()
  })
})