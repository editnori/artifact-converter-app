/**
 * @jest-environment jsdom
 */
import { extractTablesFromHTML } from '../table-extraction'

describe('Table Extraction', () => {
  it('should extract a simple table from HTML', () => {
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
    expect(tables[0].data).toHaveLength(3) // header + 2 rows
    expect(tables[0].data[0]).toEqual(['Name', 'Age'])
    expect(tables[0].data[1]).toEqual(['John', '30'])
    expect(tables[0].data[2]).toEqual(['Jane', '25'])
    expect(tables[0].html).toContain('<table')
  })

  it('should handle empty HTML', () => {
    const tables = extractTablesFromHTML('')
    expect(tables).toHaveLength(0)
  })

  it('should handle HTML without tables', () => {
    const html = '<div><p>No tables here</p></div>'
    const tables = extractTablesFromHTML(html)
    expect(tables).toHaveLength(0)
  })

  it('should extract multiple tables', () => {
    const html = `
      <table>
        <tr><th>A</th></tr>
        <tr><td>1</td></tr>
      </table>
      <table>
        <tr><th>B</th></tr>
        <tr><td>2</td></tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(2)
    expect(tables[0].data[0]).toEqual(['A'])
    expect(tables[0].data[1]).toEqual(['1'])
    expect(tables[1].data[0]).toEqual(['B'])
    expect(tables[1].data[1]).toEqual(['2'])
  })

  it('should handle tables without headers', () => {
    const html = `
      <table>
        <tr>
          <td>Data 1</td>
          <td>Data 2</td>
        </tr>
        <tr>
          <td>Data 3</td>
          <td>Data 4</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].data).toHaveLength(2)
    expect(tables[0].data[0]).toEqual(['Data 1', 'Data 2'])
    expect(tables[0].data[1]).toEqual(['Data 3', 'Data 4'])
  })

  it('should preserve cell styling information', () => {
    const html = `
      <table>
        <tr>
          <th style="background-color: #f0f0f0; color: #333;">Header</th>
        </tr>
        <tr>
          <td style="background-color: #fff; color: #000;">Cell</td>
        </tr>
      </table>
    `
    
    const tables = extractTablesFromHTML(html)
    
    expect(tables).toHaveLength(1)
    expect(tables[0].cellData).toHaveLength(2)
    expect(tables[0].cellData[0][0].isHeader).toBe(true)
    expect(tables[0].cellData[1][0].isHeader).toBeFalsy()
  })
})