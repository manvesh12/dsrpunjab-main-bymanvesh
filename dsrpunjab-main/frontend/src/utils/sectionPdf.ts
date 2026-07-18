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

export async function saveSectionPdf(document: PDFDocument, fileName: string) {
  const bytes = await document.save();
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), fileName);
}
