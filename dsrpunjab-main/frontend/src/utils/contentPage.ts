import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { apiClient } from "../api/client";
import { downloadBlob } from "./reportExport";

export type ContentChapter = {
  name: string;
  file?: { name: string; url?: string };
};

export type ContentEntry = {
  chapterNo: number | string;
  subject: string;
  pageCount: number;
  pageLabel: string;
};

function subjectFromChapterName(name: string, fallback: string) {
  const subject = name
    .replace(/^\s*chapter\s+\d+\s*[-:–—.]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return subject || fallback;
}

async function uploadedPageCount(chapter: ContentChapter) {
  if (!chapter.file?.url) return 0;
  if (!chapter.file.name.toLowerCase().endsWith(".pdf")) return 1;
  const response = await apiClient.get<ArrayBuffer>(chapter.file.url, {
    responseType: "arraybuffer",
    timeout: 60_000,
  });
  const source = await PDFDocument.load(response.data);
  return source.getPageCount();
}

export async function buildContentEntries(chapters: ContentChapter[], firstContentPage = 2) {
  let nextPage = firstContentPage;
  const entries: ContentEntry[] = [];
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    if (!chapter.file?.url) continue;
    const pageCount = await uploadedPageCount(chapter);
    if (!pageCount) continue;
    const start = nextPage;
    const end = start + pageCount - 1;
    entries.push({
      chapterNo: index + 1,
      subject: subjectFromChapterName(chapter.name, `Chapter ${index + 1}`),
      pageCount,
      pageLabel: start === end ? String(start) : `${start} - ${end}`,
    });
    nextPage = end + 1;
  }
  return entries;
}

function centeredText(page: PDFPage, font: PDFFont, text: string, y: number, size: number) {
  page.drawText(text, {
    x: (page.getWidth() - font.widthOfTextAtSize(text, size)) / 2,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  text.split(/\s+/).forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  });
  if (line) lines.push(line);
  return lines;
}

export async function appendGeneratedContentPage(target: PDFDocument, entries: ContentEntry[]) {
  const regular = await target.embedFont(StandardFonts.TimesRoman);
  const bold = await target.embedFont(StandardFonts.TimesRomanBold);
  const left = 38;
  const widths = [105, 365, 49];
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const headerHeight = 28;
  let page!: PDFPage;
  let top = 0;
  const drawRow = (values: string[], height: number, header = false) => {
    let x = left;
    values.forEach((value, index) => {
      page.drawRectangle({ x, y: top - height, width: widths[index], height, borderColor: rgb(0, 0, 0), borderWidth: 0.65 });
      const font = header ? bold : regular;
      const size = header ? 11.5 : 10.5;
      const lines = wrapText(font, value, size, widths[index] - 10);
      const firstY = top - (height - lines.length * 13) / 2 - 10;
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: x + (widths[index] - font.widthOfTextAtSize(line, size)) / 2,
          y: firstY - lineIndex * 13,
          size,
          font,
          color: rgb(0, 0, 0),
        });
      });
      x += widths[index];
    });
    top -= height;
  };

  const startPage = (continued = false) => {
    page = target.addPage([595.28, 841.89]);
    centeredText(page, bold, continued ? "Content (Continued)" : "Content", 742, continued ? 17 : 22);
    top = 715;
    drawRow(["Chapter No.", "Subject", "Page No."], headerHeight, true);
  };

  startPage();
  entries.forEach((entry) => {
    const subjectLines = wrapText(regular, entry.subject, 10.5, widths[1] - 10);
    const rowHeight = Math.max(27, subjectLines.length * 14 + 8);
    if (top - rowHeight < 58) startPage(true);
    drawRow([String(entry.chapterNo), entry.subject, entry.pageLabel], rowHeight);
  });
  page.drawLine({ start: { x: left, y: top }, end: { x: left + tableWidth, y: top }, thickness: 0.65, color: rgb(0, 0, 0) });
}

export async function downloadGeneratedContentPage(entries: ContentEntry[], fileName = "Content_Page.pdf") {
  const pdf = await PDFDocument.create();
  await appendGeneratedContentPage(pdf, entries);
  const bytes = await pdf.save();
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), fileName);
}
