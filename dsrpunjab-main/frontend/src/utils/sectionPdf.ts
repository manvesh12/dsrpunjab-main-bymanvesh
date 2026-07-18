import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { apiClient } from "../api/client";
import { downloadBlob } from "./reportExport";

export type PdfUpload = { name: string; url?: string } | null | undefined;

function safeText(value: string) {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, "-");
}

export function drawWrappedLines(page: PDFPage, font: PDFFont, text: string, options: { x: number; y: number; maxWidth: number; size?: number; lineHeight?: number }) {
  const size = options.size || 11;
  const lineHeight = options.lineHeight || 17;
  let y = options.y;
  let line = "";
  safeText(text).split(/\s+/).forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > options.maxWidth && line) {
      page.drawText(line, { x: options.x, y, size, font, color: rgb(0.15, 0.18, 0.24) });
      y -= lineHeight;
      line = word;
    } else line = candidate;
  });
  if (line) page.drawText(line, { x: options.x, y, size, font, color: rgb(0.15, 0.18, 0.24) });
  return y - lineHeight;
}

export function drawPdfHeading(page: PDFPage, font: PDFFont, text: string, y = 790, size = 18) {
  const safe = safeText(text);
  page.drawText(safe, { x: (page.getWidth() - font.widthOfTextAtSize(safe, size)) / 2, y, size, font, color: rgb(0.06, 0.09, 0.16) });
}

export async function appendUploadedDocument(target: PDFDocument, upload: PdfUpload) {
  if (!upload?.url) return false;
  let data: ArrayBuffer;
  let contentType = "";
  if (/^(blob:|data:)/i.test(upload.url)) {
    const response = await fetch(upload.url);
    if (!response.ok) throw new Error(`Could not read ${upload.name}`);
    data = await response.arrayBuffer();
    contentType = String(response.headers.get("content-type") || "").toLowerCase();
  } else {
    const response = await apiClient.get<ArrayBuffer>(upload.url, {
      responseType: "arraybuffer",
      timeout: 60_000,
    });
    data = response.data;
    contentType = String(response.headers["content-type"] || "").toLowerCase();
  }
  if (!data.byteLength) throw new Error(`${upload.name} is empty`);
  if (contentType.includes("pdf") || upload.name.toLowerCase().endsWith(".pdf")) {
    const source = await PDFDocument.load(data);
    const pages = await target.copyPages(source, source.getPageIndices());
    pages.forEach((page) => target.addPage(page));
    return true;
  }
  const image = contentType.includes("png") || upload.name.toLowerCase().endsWith(".png")
    ? await target.embedPng(data)
    : await target.embedJpg(data);
  const page = target.addPage([595.28, 841.89]);
  const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
  return true;
}

export async function createSectionPdf() {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  return { document, regular, bold };
}

/**
 * Applies the DSR document frame used in the approved Jalandhar report.  This
 * is intentionally added after imported pages are copied so PDFs, scans and
 * images all receive the same numbering and section identification.
 */
export async function applyDsrReportFrame(document: PDFDocument, sections: Array<{ title: string; startPage: number }>, district = "Punjab") {
  const italic = await document.embedFont(StandardFonts.TimesRomanItalic);
  const regular = await document.embedFont(StandardFonts.TimesRoman);
  const bold = await document.embedFont(StandardFonts.TimesRomanBold);
  const pages = document.getPages();

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const scale = Math.min(width / 595.28, height / 841.89);
    const left = 24 * scale;
    const bottom = 24 * scale;
    const top = height - 24 * scale;
    const section = sections.filter((item) => item.startPage <= index).at(-1)?.title || "District Survey Report";
    const title = "District Survey Report";
    const subtitle = section.length > 55 ? `${section.slice(0, 52)}...` : section;

    page.drawRectangle({ x: left, y: bottom, width: width - left * 2, height: height - bottom * 2, borderColor: rgb(0, 0, 0), borderWidth: 0.65 * scale, opacity: 1 });
    page.drawText(title, { x: 76 * scale, y: top - 19 * scale, font: italic, size: 10 * scale, color: rgb(0, 0, 0) });
    page.drawText(`${district} District, Punjab`, { x: 76 * scale, y: top - 34 * scale, font: italic, size: 8.5 * scale, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 74 * scale, y: top - 49 * scale }, end: { x: width - 74 * scale, y: top - 49 * scale }, thickness: 0.55 * scale, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 74 * scale, y: bottom + 42 * scale }, end: { x: width - 74 * scale, y: bottom + 42 * scale }, thickness: 0.35 * scale, color: rgb(0.55, 0.55, 0.55) });

    const footer = "PREPARED BY: DISTRICT SURVEY REPORT COMMITTEE";
    page.drawText(footer, { x: 130 * scale, y: bottom + 18 * scale, font: bold, size: 6.8 * scale, color: rgb(0, 0, 0) });
    page.drawText(`Page ${index + 1}`, { x: width - 108 * scale, y: bottom + 29 * scale, font: regular, size: 8 * scale, color: rgb(0.22, 0.22, 0.22) });
    page.drawText(subtitle, { x: 76 * scale, y: top - 61 * scale, font: regular, size: 7.5 * scale, color: rgb(0.25, 0.25, 0.25) });
  });
}

export async function saveSectionPdf(document: PDFDocument, fileName: string) {
  const bytes = await document.save();
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), fileName);
}
