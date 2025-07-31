import { extractTablesFromHTML } from '../table-extraction'

describe('extractTablesFromHTML', () => {
  it('should extract a simple table', () => {
    const html = `
      <table>
        <tr>
          <th>Name</th>
          <th>Age</th>
        </tr>
        <tr>
          <td>John</td>
          <td>30</td>
        </tr>
        <tr>
          <td>Jane</td>
          <td>25</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data).toEqual([
      ['Name', 'Age'],
      ['John', '30'],
      ['Jane', '25']
    ])
    expect(tables[0].cellData).toHaveLength(3)
    expect(tables[0].cellData[0][0].value).toBe('Name')
    expect(tables[0].cellData[0][0].isHeader).toBe(true)
  })

  it('should extract multiple tables', () => {
    const html = `
      <table>
        <tr><th>A</th><th>B</th></tr>
        <tr><td>1</td><td>2</td></tr>
      </table>
      <table>
        <tr><th>X</th><th>Y</th></tr>
        <tr><td>3</td><td>4</td></tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(2)
    expect(tables[0].data).toEqual([['A', 'B'], ['1', '2']])
    expect(tables[1].data).toEqual([['X', 'Y'], ['3', '4']])
  })

  it('should handle tables without headers', () => {
    const html = `
      <table>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
        <tr>
          <td>Cell 3</td>
          <td>Cell 4</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data).toEqual([
      ['Cell 1', 'Cell 2'],
      ['Cell 3', 'Cell 4']
    ])
    expect(tables[0].cellData[0][0].isHeader).toBeFalsy()
  })

  it('should handle empty tables', () => {
    const html = '<table></table>'
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(0)
  })

  it('should handle tables with thead and tbody', () => {
    const html = `
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Data 1</td>
            <td>Data 2</td>
          </tr>
        </tbody>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data[0]).toEqual(['Header 1', 'Header 2'])
    expect(tables[0].data[1]).toEqual(['Data 1', 'Data 2'])
  })

  it('should handle colspan', () => {
    const html = `
      <table>
        <tr>
          <th colspan="2">Merged Header</th>
        </tr>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data[0]).toContain('Merged Header')
  })

  it('should handle nested HTML in cells', () => {
    const html = `
      <table>
        <tr>
          <th><strong>Bold Header</strong></th>
          <th><em>Italic Header</em></th>
        </tr>
        <tr>
          <td><a href="#">Link</a></td>
          <td><span>Span text</span></td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data[0]).toEqual(['Bold Header', 'Italic Header'])
    expect(tables[0].data[1]).toEqual(['Link', 'Span text'])
  })

  it('should handle special characters', () => {
    const html = `
      <table>
        <tr>
          <th>&lt;Header&gt;</th>
          <th>&amp;Special&amp;</th>
        </tr>
        <tr>
          <td>&quot;Quoted&quot;</td>
          <td>&apos;Apostrophe&apos;</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data[0]).toEqual(['<Header>', '&Special&'])
    expect(tables[0].data[1]).toEqual(['"Quoted"', "'Apostrophe'"])
  })

  it('should handle empty cells', () => {
    const html = `
      <table>
        <tr>
          <th>Header 1</th>
          <th></th>
          <th>Header 3</th>
        </tr>
        <tr>
          <td>Data 1</td>
          <td></td>
          <td>Data 3</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data[0]).toEqual(['Header 1', '', 'Header 3'])
    expect(tables[0].data[1]).toEqual(['Data 1', '', 'Data 3'])
  })

  it('should preserve cell styling', () => {
    const html = `
      <table>
        <tr>
          <td style="background-color: red; color: white;">Styled Cell</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].cellData[0][0].backgroundColor).toBeDefined()
    expect(tables[0].cellData[0][0].color).toBeDefined()
  })

  it('should return empty array for HTML without tables', () => {
    const html = '<div><p>No tables here</p></div>'
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toEqual([])
  })

  it('should handle malformed HTML gracefully', () => {
    const html = '<table><tr><td>Unclosed cell'
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toBeDefined()
    expect(Array.isArray(tables)).toBe(true)
  })
})