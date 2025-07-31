# Artifact Converter App - Deployment Guide

## Current Status

The application is fully functional and tested. All TypeScript and ESLint checks pass without errors.

## Features

### Working Features:
- HTML input via textarea or file upload
- Live preview with real-time updates
- PDF export with multiple page sizes (A4, Letter, Legal, A3, A5, Custom)
- Portrait/Landscape orientation
- Adjustable margins (0-50mm)
- Scale control (0.5x-3x)
- PNG export to high-resolution images
- Table extraction to separate PDF
- Safe HTML rendering with XSS protection

### Temporarily Disabled:
- Image cropping for PNG exports (due to CSS import issue)

## Running the Application

1. Navigate to the project directory:
   ```bash
   cd "C:\Users\Layth M Qassem\artifact-converter-app"
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to http://localhost:3000

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Testing

- TypeScript check: `npx tsc --noEmit` (passes)
- ESLint check: `npx eslint src` (passes)
- Manual testing: Use the included `test-artifact.html` file

## Tech Stack

- Next.js 15.4.5
- React 19.1.1
- TypeScript 5.8.3
- Tailwind CSS 3.4.0
- shadcn/ui components
- jsPDF for PDF generation
- html2canvas for rendering

## Known Limitations

- Large HTML files may take longer to process
- External images must be CORS-enabled
- Maximum canvas size varies by browser
- Cropping feature temporarily disabled

## Deployment Options

1. **Vercel** (recommended for Next.js):
   ```bash
   npx vercel
   ```

2. **Static Export**:
   ```bash
   npm run build
   npx next export
   ```

3. **Docker**:
   Create a Dockerfile with Node.js 18+ and run the production build

## Environment Variables

No environment variables required for basic functionality.