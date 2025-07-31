# Artifact Converter App

A modern web application for converting HTML artifacts (like those from Claude) to PDF or PNG format with advanced features.

## Features

- **Multiple Input Methods**
  - Paste HTML directly
  - Upload HTML files
  - Live preview with syntax highlighting

- **PDF Export**
  - Multiple page sizes (A4, Letter, Legal, A3, A5, Custom)
  - Portrait/Landscape orientation
  - Adjustable margins (0-50mm)
  - Scale control (0.5x-3x)
  - Multi-page support
  - Table extraction to separate PDF

- **PNG Export**
  - High-resolution output
  - Built-in cropping tool
  - Adjustable scale

- **Advanced Features**
  - Live preview with real-time updates
  - Dynamic margin visualization
  - Table detection and extraction
  - Safe HTML rendering (XSS protection)
  - Responsive design
  - Dark mode support

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **PDF Generation**: jsPDF
- **HTML to Canvas**: html2canvas
- **Image Cropping**: react-cropper
- **Styling**: Tailwind CSS

## Installation

1. Clone the repository:
```bash
cd "/mnt/c/Users/Layth M Qassem/artifact-converter-app"
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Input HTML Content**
   - Paste HTML directly into the textarea
   - Or upload an HTML file using the upload button

2. **Configure Settings**
   - Choose page size and orientation
   - Adjust margins using the slider
   - Set scale factor for output quality
   - Enable table extraction if needed
   - Enable cropping for PNG exports

3. **Preview**
   - View live preview in the Preview tab
   - Preview updates automatically as you type
   - Toggle preview visibility with the eye icon

4. **Export**
   - Click "Convert to PDF" for PDF output
   - Click "Convert to PNG" for image output
   - Files download automatically

## Project Structure

```
artifact-converter-app/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── artifact-converter.tsx  # Main converter component
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Known Limitations

- Large HTML files may take longer to process
- Some complex CSS animations may not render in PDF
- External images must be CORS-enabled
- Maximum canvas size varies by browser

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT