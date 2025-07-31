declare module 'html2pdf.js' {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    logging?: boolean;
    backgroundColor?: string;
    [key: string]: unknown;
  }

  interface JsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: 'pt' | 'mm' | 'cm' | 'in';
    format?: string | number[];
    compress?: boolean;
    [key: string]: unknown;
  }

  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Html2CanvasOptions;
    jsPDF?: JsPDFOptions;
    pagebreak?: { mode?: string | string[] };
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf;
    from(element: HTMLElement | string): Html2Pdf;
    save(): Promise<void>;
    toPdf(): Html2Pdf;
    output(type: string, options?: Record<string, unknown>): Promise<Blob> | string;
  }

  function html2pdf(): Html2Pdf;
  export default html2pdf;
}