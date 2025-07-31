declare module 'mammoth' {
  export interface ConvertOptions {
    arrayBuffer?: ArrayBuffer;
    path?: string;
  }

  export interface Message {
    type: 'warning' | 'error' | 'info';
    message: string;
  }

  export interface ConvertResult {
    value: string;
    messages: Message[];
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertResult>;
  export function extractRawText(options: ConvertOptions): Promise<ConvertResult>;
}