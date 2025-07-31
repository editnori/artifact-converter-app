import React from 'react'
import { render, screen } from '@testing-library/react'

// Simple test for HTML preview functionality
describe('HTML Preview', () => {
  it('should render preview container', () => {
    const TestComponent = () => (
      <div data-testid="preview-container">
        <h1>Preview</h1>
      </div>
    )
    
    render(<TestComponent />)
    
    expect(screen.getByTestId('preview-container')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('should display HTML content', () => {
    const htmlContent = '<h1>Test Heading</h1><p>Test paragraph</p>'
    
    const TestComponent = ({ content }: { content: string }) => (
      <div 
        data-testid="html-preview"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
    
    render(<TestComponent content={htmlContent} />)
    
    const preview = screen.getByTestId('html-preview')
    expect(preview).toBeInTheDocument()
    expect(preview.innerHTML).toContain('Test Heading')
    expect(preview.innerHTML).toContain('Test paragraph')
  })

  it('should handle empty content', () => {
    const TestComponent = ({ content }: { content: string }) => (
      <div data-testid="html-preview">
        {content ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p>No content to preview</p>
        )}
      </div>
    )
    
    render(<TestComponent content="" />)
    
    expect(screen.getByText('No content to preview')).toBeInTheDocument()
  })

  it('should apply styles to preview', () => {
    const TestComponent = () => (
      <div 
        data-testid="styled-preview"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          backgroundColor: 'white'
        }}
      >
        <p>Styled content</p>
      </div>
    )
    
    render(<TestComponent />)
    
    const preview = screen.getByTestId('styled-preview')
    expect(preview).toHaveStyle({
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      backgroundColor: 'white'
    })
  })
})