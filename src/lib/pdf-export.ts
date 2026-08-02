import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfPage {
  element: HTMLElement;
  filename?: string;
}

interface H2COptions {
  scale?: number;
  useCORS?: boolean;
  backgroundColor?: string;
  logging?: boolean;
}

const defaultH2C: H2COptions = {
  scale: 2,
  useCORS: true,
  backgroundColor: '#ffffff',
  logging: false,
};

/**
 * Capture a single DOM element and return as jsPDF instance
 */
export async function captureElementToPdf(
  element: HTMLElement,
  options: {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
  } = {}
): Promise<jsPDF> {
  const { filename = 'export', orientation = 'portrait' } = options;

  const canvas = await html2canvas(element, defaultH2C as Record<string, unknown>);

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = orientation === 'portrait' ? 210 : 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = orientation === 'portrait' ? 297 : 210;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
}

/**
 * Capture a single element and download as PDF
 */
export async function captureAndDownload(
  element: HTMLElement,
  filename: string,
  options: { orientation?: 'portrait' | 'landscape' } = {}
): Promise<void> {
  const pdf = await captureElementToPdf(element, { filename, ...options });
  pdf.save(`${filename}.pdf`);
}

/**
 * Generate multi-page PDF: each element becomes one page
 * Each element is rendered to fit exactly one A4 page (scaled to fit)
 */
export async function generateMultiPagePdf(
  pages: PdfPage[],
  options: {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
  } = {}
): Promise<void> {
  const { filename = 'export', orientation = 'portrait' } = options;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = orientation === 'portrait' ? 210 : 297;
  const pageHeight = orientation === 'portrait' ? 297 : 210;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();

    const canvas = await html2canvas(pages[i].element, defaultH2C as Record<string, unknown>);

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const heightRatio = imgHeight / pageHeight;
    const finalWidth = heightRatio > 1 ? pageWidth / heightRatio : pageWidth;
    const finalHeight = heightRatio > 1 ? pageHeight : imgHeight;

    const xOffset = (pageWidth - finalWidth) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
  }

  pdf.save(`${filename}.pdf`);
}
