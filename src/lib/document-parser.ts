export interface ParsedDocument {
  text: string;
  pages: number;
  metadata?: Record<string, any>;
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pages: data.numpages,
      metadata: data.info || {},
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      text: '',
      pages: 0,
      metadata: {},
    };
  }
}

export interface ReceiptData {
  merchant: string | undefined;
  amount: number | undefined;
  date: string | undefined;
  items: string[];
  category?: string;
}

export async function parseReceipt(text: string): Promise<ReceiptData> {
  const amountMatch = text.match(/\$?\s*(\d+\.\d{2})/);
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);

  const lines = text.split('\n').filter(line => line.trim());
  const merchant = lines[0]?.trim();

  return {
    merchant,
    amount: amountMatch ? parseFloat(amountMatch[1]!) : undefined,
    date: dateMatch ? dateMatch[1] : undefined,
    items: lines.slice(1, 6).filter(line => line.length > 3),
  };
}

export interface TaxData {
  year: number | undefined;
  filingStatus?: string;
  totalIncome: number | undefined;
  totalDeductions: number | undefined;
  taxableIncome?: number;
  totalTax: number | undefined;
  refundOrOwed?: number;
}

export async function parseTaxReturn(text: string): Promise<TaxData> {
  const yearMatch = text.match(/20\d{2}/);
  const incomeMatch = text.match(/Total Income.*?(\d{1,3}(?:,\d{3})*)/i);
  const deductionsMatch = text.match(/Total Deductions.*?(\d{1,3}(?:,\d{3})*)/i);
  const taxMatch = text.match(/Total Tax.*?(\d{1,3}(?:,\d{3})*)/i);

  return {
    year: yearMatch ? parseInt(yearMatch[0]) : undefined,
    totalIncome: incomeMatch ? parseFloat(incomeMatch[1]!.replace(/,/g, '')) : undefined,
    totalDeductions: deductionsMatch
      ? parseFloat(deductionsMatch[1]!.replace(/,/g, ''))
      : undefined,
    totalTax: taxMatch ? parseFloat(taxMatch[1]!.replace(/,/g, '')) : undefined,
  };
}
