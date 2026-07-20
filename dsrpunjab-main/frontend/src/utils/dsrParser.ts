import { PDFDocument } from "pdf-lib";

export interface ParsedDsrResults {
  totalPages: number;
  detectedDistrict?: string;
  pageRanges: {
    cover: { start: number; end: number };
    chapters: Array<{ name: string; start: number; end: number }>;
    plates: { start: number; end: number };
  };
}

// Load PDF.js dynamically from CDN
export function loadPdfJS(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error("Failed to load PDF.js from CDN"));
    };
    document.head.appendChild(script);
  });
}

const DISTRICTS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
  "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
  "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga",
  "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar",
  "Sangrur", "Shaheed Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"
];

const chapterDefinitions = [
  { index: 0, label: "CHAPTER 1 - INTRODUCTION", regex: /chapter\s*(?:1|i\b)/i },
  { index: 1, label: "CHAPTER 2 - OVERVIEW OF MINING ACTIVITIES IN THE DISTRICT", regex: /chapter\s*(?:2|ii\b)/i },
  { index: 2, label: "CHAPTER 3 - PROCESS OF DEPOSITION OF SEDIMENTS", regex: /chapter\s*(?:3|iii\b)/i },
  { index: 3, label: "CHAPTER 4 - GENERAL PROFILE OF THE DISTRICT", regex: /chapter\s*(?:4|iv\b)/i },
  { index: 4, label: "CHAPTER 5 - PHYSIOGRAPHY OF THE DISTRICT", regex: /chapter\s*(?:5|v\b)/i },
  { index: 5, label: "CHAPTER 6 - GEOLOGY AND MINERAL WEALTH", regex: /chapter\s*(?:6|vi\b)/i },
  { index: 6, label: "CHAPTER 7 - ESTIMATION OF DEPOSITS AND REPLENISHMENT STUDIES", regex: /chapter\s*(?:7|vii\b)/i },
  { index: 7, label: "CHAPTER 8 - TRANSPORT", regex: /chapter\s*(?:8|viii\b)/i },
  { index: 8, label: "CHAPTER 9 - REMEDIAL MEASURE TO MITIGATE", regex: /chapter\s*(?:9|ix\b)/i },
  { index: 9, label: "CHAPTER 10 - CONCLUSION", regex: /chapter\s*(?:10|x\b)/i },
];

const platesRegex = /plates|list\s+of\s+plates/i;

export async function parseDsrPdf(
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<ParsedDsrResults> {
  onProgress?.("Loading PDF parser engine...", 10);
  const pdfjs = await loadPdfJS();

  onProgress?.("Reading document bytes...", 25);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.("Analyzing PDF structure...", 40);
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pageTexts: string[] = [];
  let detectedDistrict: string | undefined = undefined;

  // Track page numbers where chapters start
  const chapterStartPages: number[] = Array(10).fill(-1);
  let platesStartPage = -1;

  for (let i = 1; i <= numPages; i++) {
    const progressPercent = 40 + Math.floor((i / numPages) * 40);
    onProgress?.(`Extracting text from page ${i} of ${numPages}...`, progressPercent);

    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      pageTexts.push(pageText);

      // Detect district on early pages
      if (i <= 5 && !detectedDistrict) {
        for (const dist of DISTRICTS) {
          const regex = new RegExp(`\\b${dist}\\b`, "i");
          if (regex.test(pageText)) {
            detectedDistrict = dist;
            break;
          }
        }
      }

      // Heuristic: check if this is an index/contents page
      const isIndexPage =
        pageText.toUpperCase().includes("CONTENTS") ||
        pageText.toUpperCase().includes("INDEX") ||
        pageText.toUpperCase().includes("TABLE OF CONTENTS");

      if (!isIndexPage) {
        // Detect chapter starts
        for (const chDef of chapterDefinitions) {
          if (chapterStartPages[chDef.index] === -1 && chDef.regex.test(pageText)) {
            chapterStartPages[chDef.index] = i;
          }
        }

        // Detect plates start
        if (platesStartPage === -1 && platesRegex.test(pageText)) {
          if (pageText.toUpperCase().includes("PLATE 1") || pageText.toUpperCase().includes("LIST OF PLATES")) {
            platesStartPage = i;
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to extract text from page ${i}`, err);
      pageTexts.push("");
    }
  }

  onProgress?.("Structuring document sections...", 90);

  // Compute boundaries
  const cover = { start: 1, end: 1 };

  const defaultPageSize = Math.max(1, Math.floor((numPages - 10) / 11));

  const chapters: Array<{ name: string; start: number; end: number }> = [];

  for (let i = 0; i < 10; i++) {
    const chDef = chapterDefinitions[i];
    let start = chapterStartPages[i];
    
    if (start === -1) {
      if (i === 0) {
        start = 2;
      } else {
        const prevEnd = chapters[i - 1]?.end || 1;
        start = prevEnd + 1;
      }
    }

    let end = -1;
    for (let j = i + 1; j < 10; j++) {
      if (chapterStartPages[j] !== -1) {
        end = chapterStartPages[j] - 1;
        break;
      }
    }

    if (end === -1) {
      if (platesStartPage !== -1) {
        end = platesStartPage - 1;
      } else {
        end = Math.min(numPages, start + defaultPageSize);
      }
    }

    if (end < start) end = start;
    if (start > numPages) start = numPages;
    if (end > numPages) end = numPages;

    chapters.push({
      name: chDef.label,
      start,
      end,
    });
  }

  let platesStart = platesStartPage;
  if (platesStart === -1 || platesStart > numPages) {
    platesStart = Math.min(numPages, chapters[9].end + 1);
  }
  const plates = {
    start: platesStart,
    end: numPages,
  };

  onProgress?.("Completed parser successfully!", 100);

  return {
    totalPages: numPages,
    detectedDistrict,
    pageRanges: {
      cover,
      chapters,
      plates,
    },
  };
}

export async function splitPdfRange(
  pdfBuffer: ArrayBuffer,
  startPage: number, // 1-indexed
  endPage: number    // 1-indexed
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const subDoc = await PDFDocument.create();

  const pageIndices: number[] = [];
  for (let i = startPage - 1; i < endPage; i++) {
    if (i >= 0 && i < srcDoc.getPageCount()) {
      pageIndices.push(i);
    }
  }

  if (pageIndices.length === 0) {
    subDoc.addPage([595.28, 841.89]);
  } else {
    const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => subDoc.addPage(page));
  }

  return await subDoc.save();
}
