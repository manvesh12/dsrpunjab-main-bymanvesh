import html2pdf from "html2pdf.js";

export type DownloadFormat = "original-pdf" | "generated-pdf" | "draft-json" | "docx" | "print";

export interface DownloadHistoryRecord {
  id: string;
  reportId: string;
  generatedBy: string;
  generatedAt: string;
  version: number;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  format: DownloadFormat;
}

export function safeReportPart(value: unknown, fallback: string) {
  const text = String(value || fallback).trim();
  return (text || fallback).replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

export function replenishmentFileName(input: {
  district?: string;
  river?: string;
  year?: string;
  version?: number;
  extension: "pdf" | "json" | "docx";
}) {
  return `Replenishment_Report_${safeReportPart(input.district, "Punjab")}_${safeReportPart(
    input.river,
    "River"
  )}_${safeReportPart(input.year, new Date().getFullYear())}_v${input.version || 1}.${input.extension}`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function dataUrlToBlob(dataUrl: string) {
  const [meta, payload] = dataUrl.split(",");
  const contentType = meta.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(payload || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

export function downloadDataUrlFile(dataUrl: string, fileName: string) {
  downloadBlob(dataUrlToBlob(dataUrl), fileName);
}

export function ensurePdfFileName(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
}

export function openPrintableDocument(html: string, title: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200");
  if (!printWindow) {
    throw new Error("Popup blocked. Please allow popups to print or save the generated PDF.");
  }
  printWindow.document.open();
  printWindow.document.write(html.replace("<title></title>", `<title>${title}</title>`));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}

// Adding a robust html2pdf generator function
export async function downloadHtmlAsPdf(elementOrHtml: HTMLElement | string, filename: string, isLandscape: boolean = false) {
  let previewFrame: HTMLIFrameElement | null = null;
  try {
    let container: HTMLElement = elementOrHtml as HTMLElement;
    
    if (typeof elementOrHtml === 'string') {
      previewFrame = document.createElement('iframe');
      previewFrame.setAttribute('aria-hidden', 'true');
      previewFrame.style.position = 'fixed';
      previewFrame.style.left = '-10000px';
      previewFrame.style.top = '0';
      previewFrame.style.width = isLandscape ? '1123px' : '794px';
      previewFrame.style.height = isLandscape ? '794px' : '1123px';
      previewFrame.style.border = '0';
      document.body.appendChild(previewFrame);

      const previewDocument = previewFrame.contentDocument;
      if (!previewDocument) throw new Error('Unable to create isolated PDF document');
      previewDocument.open();
      previewDocument.write(elementOrHtml);
      previewDocument.close();
      await previewDocument.fonts?.ready;
      await Promise.all(Array.from(previewDocument.images).map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }));
      container = previewDocument.body;
    }
    
    const opt = {
      margin: typeof elementOrHtml === 'string' ? 0 : 5, // No margin for raw HTML which might have its own @page margins
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
      pagebreak: { mode: typeof elementOrHtml === 'string' ? ['css', 'legacy'] : ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(container).save();
    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  } finally {
    previewFrame?.remove();
  }
}

export function exportDraftJson(state: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, fileName);
  return blob.size;
}

export function exportWordDocument(html: string, fileName: string) {
  const wordHtml = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title></title></head>
<body>${html}</body>
</html>`;
  const blob = new Blob([wordHtml], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8",
  });
  downloadBlob(blob, fileName);
  return blob.size;
}

export function loadDownloadHistory(reportId: string): DownloadHistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(`download_history_${reportId}`) || "[]");
  } catch {
    return [];
  }
}

export function recordDownloadHistory(record: Omit<DownloadHistoryRecord, "id" | "generatedAt" | "downloadCount">) {
  const history = loadDownloadHistory(record.reportId);
  const existingIndex = history.findIndex(
    (item) => item.fileName === record.fileName && item.format === record.format && item.version === record.version
  );
  const nextRecord: DownloadHistoryRecord =
    existingIndex >= 0
      ? {
          ...history[existingIndex],
          fileSize: record.fileSize,
          generatedBy: record.generatedBy,
          generatedAt: new Date().toISOString(),
          downloadCount: history[existingIndex].downloadCount + 1,
        }
      : {
          ...record,
          id: crypto.randomUUID(),
          generatedAt: new Date().toISOString(),
          downloadCount: 1,
        };
  const nextHistory = existingIndex >= 0 ? [...history] : [nextRecord, ...history];
  if (existingIndex >= 0) nextHistory[existingIndex] = nextRecord;
  localStorage.setItem(`download_history_${record.reportId}`, JSON.stringify(nextHistory.slice(0, 100)));
  return nextRecord;
}
