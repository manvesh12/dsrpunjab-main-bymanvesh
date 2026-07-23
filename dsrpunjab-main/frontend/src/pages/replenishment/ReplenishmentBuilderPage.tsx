import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import { replenishmentApi, type ReplenishmentFile, type ReplenishmentStudy } from "../../api/replenishment.api";
import {
  downloadBlob,
  downloadHtmlAsPdf,
  exportDraftJson,
  exportWordDocument,
  openPrintableDocument,
  replenishmentFileName,
} from "../../utils/reportExport";

type StepId = "setup" | "import" | "content" | "survey" | "evidence" | "review";
type SectionSource = "template" | "dsr" | "manual";

type ReportSection = {
  id: string;
  title: string;
  category: string;
  content: string;
  included: boolean;
  source: SectionSource;
};

type GridRow = {
  id: string;
  grid: string;
  area: string;
  preRl: string;
  postRl: string;
};

type GridColumnKey = keyof GridRow | "gain" | "volume" | "quantity";

type GridColumn = {
  key: GridColumnKey;
  label: string;
  visible: boolean;
};

type GridTable = {
  id: string;
  title: string;
  grids: GridRow[];
  columns?: GridColumn[];
};

type StudyDetails = {
  reportFormat: "official" | "book";
  headerText: string;
  footerText: string;
  reportTitle: string;
  district: string;
  river: string;
  block: string;
  village: string;
  mineral: string;
  applicant: string;
  preparedBy: string;
  studyYear: string;
  leaseArea: string;
  mineableArea: string;
  preSurveyDate: string;
  postSurveyDate: string;
  bulkDensity: string;
  approvedQuantity: string;
  extractedQuantity: string;
  rainfall: string;
  remarks: string;
};

type BuilderState = {
  type: "replenishment_builder_v2";
  schemaVersion: 2;
  details: StudyDetails;
  sectionOverrides?: Record<string, { headerText?: string; footerText?: string }>;
  sections: ReportSection[];
  grids: GridRow[];
  gridTables?: GridTable[];
  photoCaptions?: Record<string, string>;
  inherited?: Record<string, unknown>;
  importedKeys: string[];
  lastSavedAt?: string;
};

type EvidenceRequirement = {
  id: string;
  title: string;
  hint: string;
  required: boolean;
  accept: string;
};

const steps: { id: StepId; label: string; helper: string }[] = [
  { id: "setup", label: "Study setup", helper: "Project identity" },
  { id: "import", label: "Import from DSR", helper: "Select reusable data" },
  { id: "content", label: "Report content", helper: "Write every chapter" },
  { id: "survey", label: "Survey & calculation", helper: "Pre/post monsoon" },
  { id: "evidence", label: "Evidence", helper: "Upload annexures" },
  { id: "review", label: "Review & download", helper: "Validate final report" },
];

const defaultDetails: StudyDetails = {
  reportFormat: "official",
  headerText: "Department of Mines & Geology • Government of Punjab",
  footerText: "Replenishment Study Report • DSR Punjab Portal",
  reportTitle: "Replenishment Study Report",
  district: "",
  river: "",
  block: "",
  village: "",
  mineral: "River Bed Material",
  applicant: "",
  preparedBy: "",
  studyYear: String(new Date().getFullYear()),
  leaseArea: "",
  mineableArea: "",
  preSurveyDate: "",
  postSurveyDate: "",
  bulkDensity: "",
  approvedQuantity: "",
  extractedQuantity: "",
  rainfall: "",
  remarks: "",
};

const defaultSections: ReportSection[] = [
  { id: "executive-summary", title: "Executive Summary", category: "Front matter", included: true, source: "template", content: "This report presents the replenishment assessment for the selected river reach. The assessment compares authenticated pre-monsoon and post-monsoon survey surfaces, applies the verified bulk density and determines the sustainable quantity available for extraction." },
  { id: "introduction", title: "1. Introduction", category: "Project context", included: true, source: "template", content: "The replenishment study has been prepared to assess the natural deposition of river-borne minor minerals within the approved lease area and to support scientific, sustainable and compliant mineral extraction." },
  { id: "project-details", title: "1.1 Project Details and Coordinates", category: "Project context", included: true, source: "template", content: "Describe the project proponent, lease particulars, access, boundary coordinates, environmental clearance and mining plan references." },
  { id: "location", title: "1.2 Location, Access and Maps", category: "Project context", included: true, source: "template", content: "Insert the location, approach, cadastral reference, river reach and map references. Upload signed location maps in the Evidence step." },
  { id: "physiography", title: "2. Physiography, Drainage and Climate", category: "Baseline", included: true, source: "template", content: "Describe regional relief, drainage pattern, catchment behaviour, rainfall and the hydrological conditions influencing sediment transport and deposition." },
  { id: "ecology", title: "3. Flora, Fauna and Hydrogeology", category: "Baseline", included: true, source: "template", content: "Summarise relevant ecological sensitivities, groundwater conditions, restricted zones and safeguards applicable to the study reach." },
  { id: "geology", title: "4. General and Local Geology", category: "Baseline", included: true, source: "template", content: "Describe the regional and local geological setting, river bed material composition, sediment characteristics and source of mineral deposition." },
  { id: "reserve", title: "5. Mineable Reserve and Method of Mining", category: "Mining", included: true, source: "template", content: "State the approved reserve, annual permissible quantity, mineable area, working depth, extraction method and statutory restrictions." },
  { id: "replenishment", title: "6. Replenishment Study", category: "Study", included: true, source: "template", content: "Natural replenishment is evaluated by comparing like-for-like terrain observations over a common eligible area using the same datum, benchmarks and grid extent." },
  { id: "guidelines", title: "6.1 SSMG 2016 / EMGSM 2020 Compliance", category: "Study", included: true, source: "template", content: "Record how the survey, exclusion zones, depth controls, reserve estimation, monitoring and recommended extraction quantity comply with applicable sustainable sand mining guidelines." },
  { id: "equipment", title: "7. Software and Equipment Deployed", category: "Methodology", included: true, source: "template", content: "List DGPS base and rover, total station, UAV/drone, camera, processing software, calibration records and accuracy specifications used for the study." },
  { id: "methodology", title: "8. Survey Methodology and Accuracy", category: "Methodology", included: true, source: "template", content: "Document survey control, benchmark establishment, flight or field plan, data capture, quality checks, accuracy assessment and common-area comparison methodology." },
  { id: "processing", title: "9. Data Processing and Survey Output", category: "Results", included: true, source: "template", content: "Explain the generation of point clouds, DEM/DSM, orthomosaic, contours, cross sections and pre/post monsoon surfaces. Refer to uploaded signed outputs." },
  { id: "calculation", title: "10. Grid-wise Volume and Quantity Calculation", category: "Results", included: true, source: "template", content: "Grid-wise replenished volume is computed from eligible area and positive elevation gain. Quantity is derived using the authenticated bulk density. The calculated table is generated automatically in this report." },
  { id: "conclusion", title: "11. Conclusion and Recommendations", category: "Results", included: true, source: "template", content: "State the assessed replenished quantity, comparison with approved and extracted quantity, safe recommended extraction and site-specific monitoring conditions." },
];

const defaultGrid = (): GridRow => ({ id: crypto.randomUUID(), grid: "", area: "", preRl: "", postRl: "" });

const defaultGridColumns = (): GridColumn[] => [
  { key: "grid", label: "Grid / Chainage", visible: true },
  { key: "area", label: "Area (sq m)", visible: true },
  { key: "preRl", label: "Pre RL (m)", visible: true },
  { key: "postRl", label: "Post RL (m)", visible: true },
  { key: "gain", label: "Gain (m)", visible: true },
  { key: "volume", label: "Volume (cum)", visible: true },
  { key: "quantity", label: "Quantity (MT)", visible: true },
];

function normaliseGridColumns(columns?: GridColumn[]) {
  const saved = new Map((columns || []).map((column) => [column.key, column]));
  const merged = defaultGridColumns().map((column) => {
    const existing = saved.get(column.key);
    return existing ? { ...column, label: existing.label || column.label, visible: existing.visible !== false } : column;
  });
  return merged.some((column) => column.visible) ? merged : merged.map((column) => ({ ...column, visible: true }));
}

const defaultGridTable = (index = 1): GridTable => ({
  id: crypto.randomUUID(),
  title: `Grid-wise calculation ${index}`,
  grids: [defaultGrid()],
  columns: defaultGridColumns(),
});

function normaliseGridTables(saved: Partial<BuilderState>): GridTable[] {
  if (Array.isArray(saved.gridTables) && saved.gridTables.length) {
    return saved.gridTables.map((table, index) => ({
      id: table.id || crypto.randomUUID(),
      title: table.title || `Grid-wise calculation ${index + 1}`,
      grids: Array.isArray(table.grids) && table.grids.length ? table.grids : [defaultGrid()],
      columns: normaliseGridColumns(table.columns),
    }));
  }
  const legacyGrids = Array.isArray(saved.grids) && saved.grids.length ? saved.grids : [defaultGrid()];
  return [{ id: crypto.randomUUID(), title: "Grid-wise calculation 1", grids: legacyGrids, columns: defaultGridColumns() }];
}

function flattenGridTables(tables: GridTable[]) {
  return tables.flatMap((table) => table.grids);
}

const evidenceRequirements: EvidenceRequirement[] = [
  { id: "environmental-clearance", title: "Environmental Clearance", hint: "EC letter with conditions", required: true, accept: ".pdf" },
  { id: "approved-mining-plan", title: "Approved Mining Plan", hint: "Relevant approved pages or complete plan", required: true, accept: ".pdf" },
  { id: "accreditation", title: "NABET / Agency Accreditation", hint: "Valid consultant and laboratory certificates", required: true, accept: ".pdf,.png,.jpg,.jpeg" },
  { id: "dgps-data", title: "DGPS / Survey Raw Data", hint: "Base-rover observations, CSV or Excel", required: true, accept: ".csv,.xls,.xlsx,.zip,.pdf" },
  { id: "survey-output", title: "Pre & Post Monsoon Survey", hint: "Authenticated survey sheets and output", required: true, accept: ".csv,.xls,.xlsx,.zip,.pdf" },
  { id: "maps-plates", title: "Maps, DEM/DSM and Replenishment Plates", hint: "Location, contours, orthomosaic and signed plates", required: true, accept: ".pdf,.png,.jpg,.jpeg,.tif,.tiff,.zip" },
  { id: "cross-sections", title: "Cross Sections and Graphs", hint: "Chainage-wise pre/post comparison", required: true, accept: ".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.csv,.zip" },
  { id: "survey-photos", title: "Survey Photographs", hint: "Geo-tagged field and equipment photographs", required: true, accept: ".pdf,.png,.jpg,.jpeg,.zip" },
  { id: "bulk-density", title: "Bulk Density / Laboratory Report", hint: "Authenticated test report used in calculation", required: true, accept: ".pdf,.png,.jpg,.jpeg" },
  { id: "supporting", title: "Other Supporting Documents", hint: "Approvals, declarations and correspondence", required: false, accept: ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip" },
];

const inheritedLabels: Record<string, { title: string; target: string; description: string }> = {
  district: { title: "District profile", target: "physiography", description: "District name and administrative context" },
  rivers: { title: "River inventory", target: "location", description: "River names, reaches and source information" },
  demographics: { title: "Demographic baseline", target: "physiography", description: "Reusable district baseline" },
  drainage: { title: "Drainage pattern", target: "physiography", description: "Drainage and catchment information" },
  rainfall: { title: "Rainfall and climate", target: "physiography", description: "Historical rainfall reference" },
  geology: { title: "Geology", target: "geology", description: "General and local geological context" },
  miningLeases: { title: "Mining leases", target: "reserve", description: "Lease and reserve reference data" },
  mineral: { title: "Minor mineral", target: "project-details", description: "Mineral classification" },
};

function numberValue(value: string) {
  const parsed = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number, decimals = 2) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function safe(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readableInherited(value: unknown) {
  if (value == null || value === "") return "No data available";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((item, index) => `${index + 1}. ${typeof item === "object" ? JSON.stringify(item) : item}`).join("\n");
  return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key.replace(/_/g, " ")}: ${typeof item === "object" ? JSON.stringify(item) : item}`).join("\n");
}

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function calculateGridRows(rows: GridRow[], bulkDensity: string) {
  return rows.map((row) => {
    const gain = Math.max(0, numberValue(row.postRl) - numberValue(row.preRl));
    const volume = numberValue(row.area) * gain;
    return { ...row, gain, volume, quantity: volume * numberValue(bulkDensity) };
  });
}

type CalculatedGridTable = GridTable & { rows: ReturnType<typeof calculateGridRows> };

function gridCellValue(row: ReturnType<typeof calculateGridRows>[number], key: GridColumnKey) {
  if (key === "gain" || key === "volume" || key === "quantity") return formatNumber(row[key]);
  return safe(row[key] || "-");
}

function renderGridTableHtml(table: CalculatedGridTable, tableIndex: number) {
  const tableVolume = table.rows.reduce((sum, row) => sum + row.volume, 0);
  const tableQuantity = table.rows.reduce((sum, row) => sum + row.quantity, 0);
  const columns = normaliseGridColumns(table.columns).filter((column) => column.visible);
  const totalCells = columns.map((column, index) => {
    if (column.key === "volume") return `<td>${formatNumber(tableVolume)}</td>`;
    if (column.key === "quantity") return `<td>${formatNumber(tableQuantity)}</td>`;
    return `<td>${index === 0 ? "Total assessed replenishment" : ""}</td>`;
  }).join("");
  return `<h3>Table ${tableIndex + 1}: ${safe(table.title || "Grid-wise Volume and Quantity Calculation")}</h3><table class="inserted-table"><thead><tr>${columns.map((column) => `<th>${safe(column.label)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${columns.map((column) => `<td>${gridCellValue(row, column.key)}</td>`).join("")}</tr>`).join("")}<tr class="total">${totalCells}</tr></tbody></table>`;
}

function renderPhotoHtml(file: ReplenishmentFile, captionText?: string) {
  const caption = safe(captionText?.trim() || file.fileName);
  if (file.downloadUrl) {
    return `<figure class="inserted-photo"><img src="${safe(file.downloadUrl)}" alt="${caption}"><figcaption>${caption}</figcaption></figure>`;
  }
  return `<figure class="inserted-photo inserted-photo-placeholder"><figcaption>Photo: ${caption}</figcaption></figure>`;
}

function renderContentWithInserts(content: string, tables: CalculatedGridTable[], files: ReplenishmentFile[], photoCaptions: Record<string, string> = {}) {
  const tableMap = new Map(tables.map((table, index) => [table.id, { table, index }]));
  const photoMap = new Map(files.filter((file) => file.contentType?.startsWith("image/")).map((file) => [file.id, file]));
  return content.split(/(\[\[(?:TABLE|PHOTO):[^\]]+\]\])/g).map((part) => {
    const tableToken = part.match(/^\[\[TABLE:([^\]]+)\]\]$/);
    if (tableToken) {
      const match = tableMap.get(tableToken[1]);
      return match ? renderGridTableHtml(match.table, match.index) : `<p><b>Missing table:</b> ${safe(tableToken[1])}</p>`;
    }
    const photoToken = part.match(/^\[\[PHOTO:([^\]]+)\]\]$/);
    if (photoToken) {
      const match = photoMap.get(photoToken[1]);
      return match ? renderPhotoHtml(match, photoCaptions[match.id]) : `<p><b>Missing photo:</b> ${safe(photoToken[1])}</p>`;
    }
    return safe(part).replace(/\n/g, "<br>");
  }).join("");
}

function normaliseState(study: ReplenishmentStudy): BuilderState {
  const saved = study.reportState as Partial<BuilderState> & { inherited?: Record<string, unknown> };
  if (saved.type === "replenishment_builder_v2") {
    const gridTables = normaliseGridTables(saved);
    return {
      type: "replenishment_builder_v2",
      schemaVersion: 2,
      details: { ...defaultDetails, ...saved.details },
      sectionOverrides: saved.sectionOverrides || {},
      sections: Array.isArray(saved.sections) ? saved.sections : defaultSections,
      grids: flattenGridTables(gridTables),
      gridTables,
      photoCaptions: saved.photoCaptions || {},
      inherited: saved.inherited || {},
      importedKeys: Array.isArray(saved.importedKeys) ? saved.importedKeys : [],
      lastSavedAt: saved.lastSavedAt,
    };
  }
  return {
    type: "replenishment_builder_v2",
    schemaVersion: 2,
    details: {
      ...defaultDetails,
      reportTitle: study.title || defaultDetails.reportTitle,
      river: study.river || "",
      block: study.miningBlock || "",
    },
    sectionOverrides: {},
    sections: defaultSections,
    grids: [defaultGrid()],
    gridTables: [defaultGridTable()],
    photoCaptions: {},
    inherited: saved.inherited || {},
    importedKeys: [],
  };
}

function buildReportHtml(state: BuilderState, study: ReplenishmentStudy | null, files: ReplenishmentFile[]) {
  const { details } = state;
  const isBook = details.reportFormat === "book";
  const rows = state.grids.map((row) => {
    const difference = Math.max(0, numberValue(row.postRl) - numberValue(row.preRl));
    const volume = numberValue(row.area) * difference;
    const quantity = volume * numberValue(details.bulkDensity);
    return { ...row, difference, volume, quantity };
  });
  const totalVolume = rows.reduce((sum, row) => sum + row.volume, 0);
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const approved = numberValue(details.approvedQuantity);
  const replenishment = approved ? (totalQuantity / approved) * 100 : 0;
  const sections = state.sections.filter((section) => section.included);
  const toc = sections.map((section, index) => `<tr><td>${index + 1}</td><td>${safe(section.title)}</td><td>${safe(section.category)}</td></tr>`).join("");
  const body = sections.map((section) => `<section class="chapter"><div class="chapter-head"><span>${safe(section.category)}</span><small>${section.source === "dsr" ? "Imported from approved DSR" : section.source === "manual" ? "Project-specific content" : "Standard report section"}</small></div><h2>${safe(section.title)}</h2><div class="narrative">${safe(section.content).replace(/\n/g, "<br>")}</div>${section.id === "calculation" ? `<h3>Grid-wise calculation</h3><table><thead><tr><th>Grid / Chainage</th><th>Area (m²)</th><th>Pre RL (m)</th><th>Post RL (m)</th><th>Gain (m)</th><th>Volume (m³)</th><th>Quantity (MT)</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${safe(row.grid || "-")}</td><td>${safe(row.area || "-")}</td><td>${safe(row.preRl || "-")}</td><td>${safe(row.postRl || "-")}</td><td>${formatNumber(row.difference)}</td><td>${formatNumber(row.volume)}</td><td>${formatNumber(row.quantity)}</td></tr>`).join("")}<tr class="total"><td colspan="5">Total assessed replenishment</td><td>${formatNumber(totalVolume)}</td><td>${formatNumber(totalQuantity)}</td></tr></tbody></table>` : ""}</section>`).join("");
  const evidenceRows = evidenceRequirements.map((requirement, index) => {
    const matches = files.filter((file) => file.sectionId === requirement.id);
    return `<tr><td>${index + 1}</td><td>${safe(requirement.title)}</td><td>${requirement.required ? "Required" : "Optional"}</td><td>${matches.length ? matches.map((file) => safe(file.fileName)).join("<br>") : "Not uploaded"}</td><td>${matches.length ? "Attached" : "Pending"}</td></tr>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title></title><style>
  @page{size:A4;margin:20mm 15mm 20mm}*{box-sizing:border-box}body{margin:0;color:${isBook ? "#29251f" : "#172033"};font-family:${isBook ? "Georgia, 'Times New Roman', serif" : "Arial, sans-serif"};font-size:10.5pt;line-height:${isBook ? "1.7" : "1.55"}}h1,h2,h3{color:${isBook ? "#60462d" : "#12396b"}}h1{font-size:${isBook ? "32pt" : "28pt"};line-height:1.15}h2{font-size:${isBook ? "20pt" : "17pt"};border-bottom:${isBook ? "1px solid #ad8b62" : "2px solid #d5a928"};padding-bottom:7px}h3{font-size:12pt;margin-top:22px}.running-header,.running-footer{position:fixed;left:0;right:0;z-index:3;color:${isBook ? "#765f48" : "#53657a"};font-family:Arial,sans-serif;font-size:7.5pt;letter-spacing:.35px}.running-header{top:-12mm;border-bottom:1px solid ${isBook ? "#cdbb9f" : "#cbd5e1"};padding-bottom:3px}.running-footer{bottom:-13mm;border-top:1px solid ${isBook ? "#cdbb9f" : "#cbd5e1"};padding-top:3px;text-align:center}.cover{height:255mm;border:${isBook ? "10px double #765637" : "2px solid #12396b"};padding:24mm 18mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;background:${isBook ? "linear-gradient(145deg,#fbf4e5,#fffdf7 55%,#eadcc5)" : "white"};box-shadow:${isBook ? "inset 0 0 0 3px #fff,inset 0 0 45px #d8c5a7" : "none"}}.kicker{color:${isBook ? "#8a633b" : "#b38500"};font-weight:bold;letter-spacing:2px}.cover-card{background:${isBook ? "rgba(255,255,255,.65)" : "#f3f6fb"};border-left:5px solid ${isBook ? "#8a633b" : "#d5a928"};padding:18px}.cover-grid{display:grid;grid-template-columns:145px 1fr;gap:7px}.muted{color:#657086}.page,.chapter{position:relative;min-height:255mm;border:1px solid ${isBook ? "#765637" : "#12396b"};padding:12mm 10mm}.page{page-break-after:always}.chapter{page-break-before:always}.chapter-head{display:flex;justify-content:space-between;align-items:center;color:${isBook ? "#8a633b" : "#b38500"};text-transform:uppercase;font-size:8pt;font-weight:bold;letter-spacing:1px;${isBook ? "padding-top:28mm;text-align:center;" : ""}}.chapter-head small{color:#718096;text-transform:none;letter-spacing:0}.narrative{white-space:normal;text-align:justify;min-height:40px;${isBook ? "font-size:11pt;" : ""}}table{width:100%;border-collapse:collapse;margin:12px 0;font-family:Arial,sans-serif;font-size:8.3pt}th{background:${isBook ? "#765637" : "#12396b"};color:white;text-align:left}th,td{border:1px solid ${isBook ? "#bba98f" : "#aeb7c4"};padding:5px;vertical-align:top}.total td{font-weight:bold;background:${isBook ? "#f3e9d8" : "#fff8db"}}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.metric{border:1px solid #d6dde8;border-top:4px solid ${isBook ? "#8a633b" : "#d5a928"};padding:12px}.metric b{font-size:16pt;color:${isBook ? "#60462d" : "#12396b"};display:block}.cert{border:1px solid #ccd5e1;padding:18px;margin-top:22px}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:35px;margin-top:65px}.signature{border-top:1px solid #172033;padding-top:6px;text-align:center}.footer-note{font-size:8pt;color:#657086;margin-top:20px}
  </style></head><body>
  <div class="cover"><div><div class="kicker">REPLENISHMENT STUDY REPORT</div><h1>${safe(details.reportTitle)}</h1><p class="muted">Scientific assessment of river bed mineral replenishment</p></div><div class="cover-card"><div class="cover-grid"><b>District</b><span>${safe(details.district || "Not specified")}</span><b>River / Reach</b><span>${safe(details.river || "Not specified")}</span><b>Mining block</b><span>${safe(details.block || "Not specified")}</span><b>Village</b><span>${safe(details.village || "Not specified")}</span><b>Study year</b><span>${safe(details.studyYear)}</span><b>Applicant</b><span>${safe(details.applicant || "Not specified")}</span></div></div><div><b>Prepared by</b><br>${safe(details.preparedBy || "Not specified")}<p class="footer-note">Generated from the DSR Punjab Replenishment Module • Report version ${study?.currentVersion || 1}</p></div></div>
  <div class="running-header">${safe(details.headerText)}</div><div class="running-footer">${safe(details.footerText)}</div>
  <div class="page"><h2>Document control and declaration</h2><table><tbody><tr><th>Report format</th><td>${isBook ? "Bound Book Edition" : "Official Replenishment Format"}</td></tr><tr><th>Report title</th><td>${safe(details.reportTitle)}</td></tr><tr><th>Study period</th><td>${safe(details.preSurveyDate || "-")} to ${safe(details.postSurveyDate || "-")}</td></tr><tr><th>Mineral</th><td>${safe(details.mineral)}</td></tr><tr><th>Lease / mineable area</th><td>${safe(details.leaseArea || "-")} ha / ${safe(details.mineableArea || "-")} ha</td></tr><tr><th>Status</th><td>${safe(study?.approvalState?.replace(/_/g, " ") || "DRAFT")}</td></tr></tbody></table><div class="cert"><b>Declaration</b><p>The data, survey observations, calculations, maps and supporting records included in this report shall be authenticated by the responsible survey, GIS, geology and district authorities before official issue.</p></div><h2>Contents</h2><table><thead><tr><th>No.</th><th>Section</th><th>Group</th></tr></thead><tbody>${toc}</tbody></table></div>
  <div class="page"><h2>Study dashboard</h2><div class="summary"><div class="metric"><span>Assessed volume</span><b>${formatNumber(totalVolume)} m³</b></div><div class="metric"><span>Assessed quantity</span><b>${formatNumber(totalQuantity)} MT</b></div><div class="metric"><span>Replenishment</span><b>${formatNumber(replenishment, 1)}%</b></div><div class="metric"><span>Approved quantity</span><b>${formatNumber(approved)} MT</b></div><div class="metric"><span>Extracted quantity</span><b>${formatNumber(numberValue(details.extractedQuantity))} MT</b></div><div class="metric"><span>Bulk density</span><b>${formatNumber(numberValue(details.bulkDensity))} MT/m³</b></div></div><table><tbody><tr><th>Pre-monsoon survey</th><td>${safe(details.preSurveyDate || "-")}</td><th>Post-monsoon survey</th><td>${safe(details.postSurveyDate || "-")}</td></tr><tr><th>Rainfall</th><td>${safe(details.rainfall || "-")} mm</td><th>Grid rows</th><td>${rows.length}</td></tr><tr><th>Project remarks</th><td colspan="3">${safe(details.remarks || "-")}</td></tr></tbody></table></div>
  ${body}
  <section class="chapter"><div class="chapter-head"><span>Annexures</span><small>Evidence register</small></div><h2>Annexure Register</h2><p>The following uploaded records form part of the digital study file. Their titles are recorded in the generated report; originals remain available through authenticated storage.</p><table><thead><tr><th>No.</th><th>Document group</th><th>Requirement</th><th>Uploaded file(s)</th><th>Status</th></tr></thead><tbody>${evidenceRows}</tbody></table><div class="cert"><b>Final verification</b><p>Coordinates and lease boundary verified • Common datum and benchmark verified • Restricted zones excluded • Bulk density authenticated • Quantity calculation independently checked • Maps and cross sections signed.</p></div><div class="signatures"><div class="signature">Survey Officer</div><div class="signature">Geologist / GIS Expert</div><div class="signature">Competent Authority</div></div></section>
  </body></html>`;
}

function buildFormalReportHtml(state: BuilderState, _study: ReplenishmentStudy | null, files: ReplenishmentFile[]) {
  const details = state.details;
  const frameFor = (sectionId: string) => {
    const override = state.sectionOverrides?.[sectionId];
    const headerText = override?.headerText?.trim() || details.headerText?.trim() || details.reportTitle || "Replenishment Study Report";
    const footerText = override?.footerText?.trim() || details.footerText?.trim() || details.preparedBy || "DSR Punjab Portal";
    return `<div class="page-header">${safe(headerText)}</div><div class="page-footer"><span>${safe(footerText)}</span><span>Page No.</span></div>`;
  };
  const calculationTables = (state.gridTables?.length ? state.gridTables : normaliseGridTables(state)).map((table) => ({ ...table, rows: calculateGridRows(table.grids, details.bulkDensity) }));
  const totalVolume = calculationTables.reduce((sum, table) => sum + table.rows.reduce((tableSum, row) => tableSum + row.volume, 0), 0);
  const totalQuantity = calculationTables.reduce((sum, table) => sum + table.rows.reduce((tableSum, row) => tableSum + row.quantity, 0), 0);
  const approved = numberValue(details.approvedQuantity);
  const replenishment = approved ? (totalQuantity / approved) * 100 : 0;
  const sections = state.sections.filter((section) => section.included);
  const cleanTitle = (title: string) => safe(title).replace(/^\d+(\.\d+)?\s*/, "");
  const toc = sections.map((section, index) => `<tr><td>${index + 1}.0</td><td>${cleanTitle(section.title)}</td><td></td></tr>`).join("");
  const calculationHtml = calculationTables.map((table, tableIndex) => renderGridTableHtml(table, tableIndex)).join("");
  const body = sections.map((section, index) => `<section class="chapter">${frameFor(section.id)}<h2>${index + 1}.0 ${cleanTitle(section.title)}</h2><div class="narrative">${renderContentWithInserts(section.content, calculationTables, files, state.photoCaptions)}</div>${section.id === "calculation" ? calculationHtml : ""}</section>`).join("");
  const evidenceRows = evidenceRequirements.map((requirement, index) => {
    const matches = files.filter((file) => file.sectionId === requirement.id);
    return `<tr><td>${index + 1}</td><td>${safe(requirement.title)}</td><td>${requirement.required ? "Required" : "Optional"}</td><td>${matches.length ? matches.map((file) => safe(file.fileName)).join("<br>") : "Not uploaded"}</td><td>${matches.length ? "Attached" : "Pending"}</td></tr>`;
  }).join("");
  const annexureRows = evidenceRequirements.map((requirement, index) => `<tr><td>${index + 1}.</td><td>${safe(requirement.title)}</td><td></td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${safe(details.reportTitle)}</title><style>
  @page{size:A4;margin:18mm 16mm 18mm}*{box-sizing:border-box}body{margin:0;color:#111;font-family:"Times New Roman",Times,serif;font-size:11pt;line-height:1.42}.cover{min-height:260mm;border:1px solid #222;padding:16mm;display:flex;flex-direction:column;justify-content:center;text-align:center;page-break-after:always}.cover h1{margin:0;font-size:25pt;line-height:1.15;text-transform:uppercase}.cover h2{margin:18px 0 8px;font-size:17pt;text-transform:uppercase}.cover .sub{margin:12px auto 28px;max-width:560px;font-size:11pt;line-height:1.45}.cover .of{margin:18px 0 8px;font-size:13pt;font-weight:bold;text-transform:uppercase}.project-title{margin:0 auto 40px;max-width:560px;font-size:14pt;font-weight:bold;line-height:1.45}.cover-parties{display:grid;grid-template-columns:1fr 1fr;gap:42px;margin-top:50px;text-align:left}.cover-parties h3{margin:0 0 8px;font-size:11pt}.cover-parties p{margin:2px 0}.page,.chapter{position:relative;min-height:260mm;border:1px solid #222;padding:22mm 10mm 20mm;page-break-after:always}.page-header{position:absolute;left:10mm;right:10mm;top:7mm;border-bottom:1px solid #222;padding-bottom:3px;font-size:8pt;text-align:left}.page-footer{position:absolute;left:10mm;right:10mm;bottom:7mm;display:flex;justify-content:space-between;border-top:1px solid #444;padding-top:3px;font-size:8.5pt}h2{margin:0 0 12px;font-size:15pt;text-align:left}h3{margin:18px 0 8px;font-size:12pt}.narrative{text-align:justify;white-space:normal}.inserted-table{page-break-inside:avoid}.inserted-photo{margin:14px 0;text-align:center;page-break-inside:avoid}.inserted-photo img{max-width:100%;max-height:170mm;object-fit:contain;border:1px solid #222}.inserted-photo figcaption{margin-top:5px;font-size:9.5pt}.inserted-photo-placeholder{border:1px solid #222;padding:14px}table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:10pt}th,td{border:1px solid #222;padding:5px 6px;vertical-align:top}th{font-weight:bold;text-align:left;background:#fff}.index-title{margin:0 0 18px;text-align:center;font-size:17pt;font-weight:bold;text-transform:uppercase}.total td{font-weight:bold}.declaration{margin-top:18px;text-align:justify}.summary-table th{width:28%}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:35px;margin-top:70px}.signature{border-top:1px solid #111;padding-top:6px;text-align:center;font-size:10pt}@media print{button{display:none}.chapter:last-child,.page:last-child{page-break-after:auto}}
  </style></head><body>
  <div class="cover"><h1>REPLENISHMENT STUDY<br>REPORT</h1><p class="sub">{As per Sustainable Sand Mining Guidelines, 2016, and the Enforcement & Monitoring Guidelines, 2020 (Sections 5.0, 5.1 & 5.2)}</p><div class="of">OF</div><h2>${safe(details.mineral || "Minor Mineral (River Bed Material)")}</h2><p class="project-title">${safe(details.reportTitle || "River Bed Material Mining Project")}<br>Block No. ${safe(details.block || "-")} ${details.leaseArea ? `(Area-${safe(details.leaseArea)} ha.)` : ""}<br>${safe(details.river || "")}${details.village ? `, ${safe(details.village)}` : ""}<br>District ${safe(details.district || "-")}</p><div class="cover-parties"><div><h3>Submitted By:</h3><p>${safe(details.applicant || "Not specified")}</p><p>${safe(details.village || "")}</p><p>${safe(details.district || "")}</p></div><div><h3>Prepared By:</h3><p>${safe(details.preparedBy || "Not specified")}</p><p>${safe(details.headerText || "")}</p></div></div></div>
  <div class="page">${frameFor("index")}<div class="index-title">INDEX</div><table><thead><tr><th>SR. NO.</th><th>PARTICULARS</th><th>PAGE NO.</th></tr></thead><tbody>${toc}</tbody></table></div>
  <div class="page">${frameFor("table-list")}<div class="index-title">LIST OF TABLES</div><table><thead><tr><th>TABLE NO.</th><th>PARTICULARS</th><th>PAGE NO.</th></tr></thead><tbody><tr><td>1</td><td>Project Details</td><td></td></tr><tr><td>2</td><td>Grid-wise Volume and Quantity Calculation</td><td></td></tr><tr><td>3</td><td>Evidence and Annexure Register</td><td></td></tr></tbody></table><div class="index-title" style="margin-top:28px">LIST OF ANNEXURES</div><table><thead><tr><th>ANNEXURE NO.</th><th>PARTICULARS</th><th>PAGE NO.</th></tr></thead><tbody>${annexureRows}</tbody></table></div>
  <div class="page">${frameFor("project-details-page")}<h2>1.1 PROJECT DETAILS</h2><table class="summary-table"><tbody><tr><th>Total Area</th><td>${safe(details.leaseArea || "-")} Ha</td></tr><tr><th>Mineable Area</th><td>${safe(details.mineableArea || "-")} Ha</td></tr><tr><th>Mineral</th><td>${safe(details.mineral)}</td></tr><tr><th>Village</th><td>${safe(details.village || "-")}</td></tr><tr><th>District</th><td>${safe(details.district || "-")}</td></tr><tr><th>Minor Mineral Block</th><td>${safe(details.block || "-")}</td></tr><tr><th>Pre-monsoon Survey</th><td>${safe(details.preSurveyDate || "-")}</td></tr><tr><th>Post-monsoon Survey</th><td>${safe(details.postSurveyDate || "-")}</td></tr><tr><th>Bulk Density</th><td>${formatNumber(numberValue(details.bulkDensity))} MT/cum</td></tr><tr><th>Approved Quantity</th><td>${formatNumber(approved)} MT</td></tr><tr><th>Extracted Quantity</th><td>${formatNumber(numberValue(details.extractedQuantity))} MT</td></tr><tr><th>Assessed Quantity</th><td>${formatNumber(totalQuantity)} MT</td></tr><tr><th>Replenishment</th><td>${formatNumber(replenishment, 1)}%</td></tr><tr><th>Remarks</th><td>${safe(details.remarks || "-")}</td></tr></tbody></table><p class="declaration">The data, survey observations, calculations, maps and supporting records included in this report shall be authenticated by the responsible survey, GIS, geology and district authorities before official issue.</p></div>
  ${body}
  <section class="chapter">${frameFor("annexures")}<h2>Annexure Register</h2><p class="narrative">The following uploaded records form part of the digital study file. Their titles are recorded in the generated report; originals remain available through authenticated storage.</p><table><thead><tr><th>No.</th><th>Document group</th><th>Requirement</th><th>Uploaded file(s)</th><th>Status</th></tr></thead><tbody>${evidenceRows}</tbody></table><p class="declaration"><b>Final verification:</b> Coordinates and lease boundary verified; common datum and benchmark verified; restricted zones excluded; bulk density authenticated; quantity calculation independently checked; maps and cross sections signed.</p><div class="signatures"><div class="signature">Survey Officer</div><div class="signature">Geologist / GIS Expert</div><div class="signature">Competent Authority</div></div></section>
  </body></html>`;
}

function Field({ label, value, onChange, type = "text", placeholder, suffix }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; suffix?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><div className="relative"><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#12396b] focus:ring-2 focus:ring-blue-100" />{suffix && <span className="absolute right-3 top-2.5 text-xs text-slate-400">{suffix}</span>}</div></label>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

function GridCalculationCard({
  table,
  tableNumber,
  canRemove,
  onAddRow,
  onRemoveTable,
  onUpdateTitle,
  onUpdateColumn,
  onToggleColumn,
  onUpdateRow,
  onRemoveRow,
  extraActions,
}: {
  table: GridTable & { rows: ReturnType<typeof calculateGridRows> };
  tableNumber: number;
  canRemove: boolean;
  onAddRow: () => void;
  onRemoveTable?: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateColumn: (key: GridColumnKey, patch: Partial<GridColumn>) => void;
  onToggleColumn: (key: GridColumnKey, visible: boolean) => void;
  onUpdateRow: (rowId: string, key: keyof GridRow, value: string) => void;
  onRemoveRow: (rowId: string) => void;
  extraActions?: React.ReactNode;
}) {
  const tableVolume = table.rows.reduce((sum, row) => sum + row.volume, 0);
  const tableQuantity = table.rows.reduce((sum, row) => sum + row.quantity, 0);
  const columns = normaliseGridColumns(table.columns);
  const visibleColumns = columns.filter((column) => column.visible);
  const hiddenColumns = columns.filter((column) => !column.visible);
  const editableKeys: GridColumnKey[] = ["grid", "area", "preRl", "postRl"];
  const totalFor = (column: GridColumn, index: number) => {
    if (column.key === "volume") return `${formatNumber(tableVolume)} cum`;
    if (column.key === "quantity") return `${formatNumber(tableQuantity)} MT`;
    return index === 0 ? "Total assessed replenishment" : "";
  };
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <input
            value={table.title || `Grid-wise calculation ${tableNumber}`}
            onChange={(event) => onUpdateTitle(event.target.value)}
            className="w-full min-w-[260px] border-0 bg-transparent text-lg font-extrabold text-[#12396b] outline-none focus:bg-blue-50"
          />
          <p className="text-sm text-slate-500">Edit row names, column headings and report columns for this calculation table.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {extraActions}
          <button onClick={onAddRow} className="module-btn-secondary"><Plus size={16}/> Add row</button>
          {onRemoveTable && <button disabled={!canRemove} onClick={onRemoveTable} className="module-btn-secondary text-red-600 disabled:opacity-40"><Trash2 size={16}/> Remove table</button>}
        </div>
      </div>
      {hiddenColumns.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs"><span className="font-bold text-slate-600">Hidden columns:</span>{hiddenColumns.map((column) => <button key={column.key} onClick={() => onToggleColumn(column.key, true)} className="rounded bg-white px-2.5 py-1 font-bold text-[#12396b] shadow-sm">Restore {column.label}</button>)}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="bg-[#12396b] text-white">
              {visibleColumns.map((column) => <th key={column.key} className="p-2 text-left"><div className="flex min-w-[120px] items-center gap-2"><input value={column.label} onChange={(event) => onUpdateColumn(column.key, { label: event.target.value })} className="min-w-0 flex-1 rounded border border-white/30 bg-white/10 px-2 py-1 text-xs font-bold text-white outline-none focus:bg-white/20"/><button onClick={() => onToggleColumn(column.key, false)} className="rounded p-1 text-white/80 hover:bg-white/15" title="Hide column"><Trash2 size={13}/></button></div></th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-200">
                {visibleColumns.map((column) => <td key={column.key} className="p-1.5">{editableKeys.includes(column.key) ? <input value={row[column.key as keyof GridRow]} onChange={(event) => onUpdateRow(row.id, column.key as keyof GridRow, event.target.value)} placeholder={column.key === "grid" ? "Row name / chainage" : ""} className="w-full rounded border border-slate-300 px-2 py-2 outline-none focus:border-[#12396b]"/> : <div className={`p-2 font-medium ${column.key === "quantity" ? "text-right font-bold text-[#12396b]" : "text-right"}`}>{gridCellValue(row, column.key)}</div>}</td>)}
                <td className="p-2"><button disabled={table.rows.length === 1} onClick={() => onRemoveRow(row.id)} className="text-red-500 disabled:text-slate-300"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-amber-50 font-bold">
              {visibleColumns.map((column, index) => <td key={column.key} className={`p-3 ${column.key === "volume" || column.key === "quantity" ? "text-right text-[#12396b]" : ""}`}>{totalFor(column, index)}</td>)}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

export default function ReplenishmentBuilderPage() {
  const { projectId } = useParams();
  const [activeStep, setActiveStep] = useState<StepId>("setup");
  const [study, setStudy] = useState<ReplenishmentStudy | null>(null);
  const [state, setState] = useState<BuilderState>({ type: "replenishment_builder_v2", schemaVersion: 2, details: defaultDetails, sectionOverrides: {}, sections: defaultSections, grids: [defaultGrid()], gridTables: [defaultGridTable()], photoCaptions: {}, inherited: {}, importedKeys: [] });
  const [selectedFrameSection, setSelectedFrameSection] = useState("index");
  const [files, setFiles] = useState<ReplenishmentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [workspacePreview, setWorkspacePreview] = useState(true);
  const [activeContentSectionId, setActiveContentSectionId] = useState(defaultSections[0].id);
  const [photoDataUrls, setPhotoDataUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const studies = await replenishmentApi.list(projectId);
      const firstTable = defaultGridTable();
      const active = studies.find((item) => item.reportState?.type === "replenishment_builder_v2") || studies[0] || await replenishmentApi.create(projectId, { title: defaultDetails.reportTitle, reportState: { type: "replenishment_builder_v2", schemaVersion: 2, details: defaultDetails, sections: defaultSections, grids: firstTable.grids, gridTables: [firstTable], photoCaptions: {}, importedKeys: [] } });
      setStudy(active);
      setState(normaliseState(active));
      setFiles(await replenishmentApi.listFiles(active.id));
    } catch {
      toast.error("Failed to load replenishment study");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // The API-backed study is the external source of truth for this editor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (!study) return;
    const missingPhotos = files.filter((file) => file.contentType?.startsWith("image/") && photoDataUrls[file.id] === undefined);
    if (!missingPhotos.length) return;
    let mounted = true;
    void Promise.all(missingPhotos.map(async (file) => {
      try {
        const blob = await replenishmentApi.downloadFile(study.id, file.id);
        return [file.id, await blobToDataUrl(blob)] as const;
      } catch {
        return [file.id, ""] as const;
      }
    })).then((entries) => {
      if (!mounted) return;
      setPhotoDataUrls((current) => ({ ...current, ...Object.fromEntries(entries) }));
    });
    return () => {
      mounted = false;
    };
  }, [files, photoDataUrls, study]);

  const calculationTables = useMemo(() => (state.gridTables?.length ? state.gridTables : normaliseGridTables(state)).map((table) => ({ ...table, rows: calculateGridRows(table.grids, state.details.bulkDensity) })), [state.gridTables, state.grids, state.details.bulkDensity]);
  const photoFiles = useMemo(() => files.filter((file) => file.contentType?.startsWith("image/")), [files]);
  const surveyPhotoRequirement = useMemo(() => ({ ...(evidenceRequirements.find((item) => item.id === "survey-photos") || evidenceRequirements[0]), accept: ".png,.jpg,.jpeg" }), []);
  const surveyPhotoFiles = useMemo(() => files.filter((file) => file.sectionId === "survey-photos" && file.contentType?.startsWith("image/")), [files]);
  const primaryTable = calculationTables[0];
  const gridResults = primaryTable?.rows || [];
  const totalVolume = calculationTables.reduce((sum, table) => sum + table.rows.reduce((tableSum, row) => tableSum + row.volume, 0), 0);
  const totalQuantity = calculationTables.reduce((sum, table) => sum + table.rows.reduce((tableSum, row) => tableSum + row.quantity, 0), 0);
  const requiredUploaded = evidenceRequirements.filter((item) => item.required && files.some((file) => file.sectionId === item.id)).length;
  const requiredCount = evidenceRequirements.filter((item) => item.required).length;
  const coreFields = [state.details.district, state.details.river, state.details.studyYear, state.details.preSurveyDate, state.details.postSurveyDate, state.details.bulkDensity];
  const completion = Math.round(((coreFields.filter(Boolean).length + requiredUploaded + state.sections.filter((item) => item.included && item.content.trim()).length) / (coreFields.length + requiredCount + state.sections.filter((item) => item.included).length)) * 100);
  const reportFiles = useMemo(() => files.map((file) => photoDataUrls[file.id] ? { ...file, downloadUrl: photoDataUrls[file.id] } : file), [files, photoDataUrls]);
  const reportHtml = useMemo(() => buildFormalReportHtml(state, study, reportFiles), [state, study, reportFiles]);

  const updateDetails = (key: keyof StudyDetails, value: string) => setState((current) => ({ ...current, details: { ...current.details, [key]: value } }));
  const updateSection = (id: string, patch: Partial<ReportSection>) => setState((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...patch } : section) }));
  const updatePhotoCaption = (fileId: string, caption: string) => setState((current) => ({ ...current, photoCaptions: { ...(current.photoCaptions || {}), [fileId]: caption } }));
  const insertIntoActiveSection = (token: string) => {
    const activeSection = state.sections.find((section) => section.id === activeContentSectionId && section.included) || state.sections.find((section) => section.included) || state.sections[0];
    if (!activeSection) return;
    const textarea = document.getElementById(`replenishment-section-${activeSection.id}`) as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? activeSection.content.length;
    const end = textarea?.selectionEnd ?? start;
    const prefix = start > 0 && !activeSection.content.slice(0, start).endsWith("\n") ? "\n" : "";
    const suffix = activeSection.content.slice(end).startsWith("\n") ? "" : "\n";
    const nextContent = `${activeSection.content.slice(0, start)}${prefix}${token}${suffix}${activeSection.content.slice(end)}`;
    setActiveContentSectionId(activeSection.id);
    updateSection(activeSection.id, { content: nextContent, source: "manual" });
    toast.success("Inserted into selected chapter");
    requestAnimationFrame(() => {
      const element = document.getElementById(`replenishment-section-${activeSection.id}`) as HTMLTextAreaElement | null;
      const nextPosition = start + prefix.length + token.length + suffix.length;
      element?.focus();
      element?.setSelectionRange(nextPosition, nextPosition);
    });
  };
  const updateGridTables = (updater: (tables: GridTable[]) => GridTable[]) => setState((current) => {
    const gridTables = updater(current.gridTables?.length ? current.gridTables : normaliseGridTables(current));
    return { ...current, gridTables, grids: flattenGridTables(gridTables) };
  });
  const addGridTable = () => updateGridTables((tables) => [...tables, defaultGridTable(tables.length + 1)]);
  const updateGridTableTitle = (tableId: string, title: string) => updateGridTables((tables) => tables.map((table) => table.id === tableId ? { ...table, title } : table));
  const updateGridColumn = (tableId: string, key: GridColumnKey, patch: Partial<GridColumn>) => updateGridTables((tables) => tables.map((table) => table.id === tableId ? { ...table, columns: normaliseGridColumns(table.columns).map((column) => column.key === key ? { ...column, ...patch } : column) } : table));
  const toggleGridColumn = (tableId: string, key: GridColumnKey, visible: boolean) => updateGridColumn(tableId, key, { visible });
  const removeGridTable = (tableId: string) => updateGridTables((tables) => tables.length === 1 ? tables : tables.filter((table) => table.id !== tableId));
  const addGridRow = (tableId: string) => updateGridTables((tables) => tables.map((table) => table.id === tableId ? { ...table, grids: [...table.grids, defaultGrid()] } : table));
  const updateGridInTable = (tableId: string, rowId: string, key: keyof GridRow, value: string) => updateGridTables((tables) => tables.map((table) => table.id === tableId ? { ...table, grids: table.grids.map((row) => row.id === rowId ? { ...row, [key]: value } : row) } : table));
  const updateGrid = (rowId: string, key: keyof GridRow, value: string) => primaryTable && updateGridInTable(primaryTable.id, rowId, key, value);
  const removeGridRow = (tableId: string, rowId: string) => updateGridTables((tables) => tables.map((table) => table.id === tableId ? { ...table, grids: table.grids.length === 1 ? table.grids : table.grids.filter((row) => row.id !== rowId) } : table));

  const save = async () => {
    if (!study) return;
    setSaving(true);
    try {
      const next = { ...state, lastSavedAt: new Date().toISOString() };
      const saved = await replenishmentApi.update(study.id, { title: state.details.reportTitle, river: state.details.river, miningBlock: state.details.block, reportState: next, surveyData: { details: state.details, grids: state.grids, gridTables: state.gridTables } });
      setStudy(saved);
      setState(normaliseState(saved));
      toast.success("Replenishment study saved successfully");
    } catch {
      toast.error("Save failed. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const refreshDsr = async () => {
    if (!study) return;
    setImporting(true);
    try {
      const result = await replenishmentApi.fetchFinalDsr(study.id);
      setState((current) => ({ ...current, inherited: result.imported || {} }));
      toast.success("Approved Final DSR data refreshed successfully");
    } catch {
      toast.error("Final DSR is not linked or import is unavailable");
    } finally {
      setImporting(false);
    }
  };

  const importKey = (key: string) => {
    const config = inheritedLabels[key];
    const value = state.inherited?.[key];
    if (!config || value == null) return;
    const imported = readableInherited(value);
    setState((current) => ({
      ...current,
      importedKeys: Array.from(new Set([...current.importedKeys, key])),
      sections: current.sections.map((section) => section.id === config.target ? { ...section, content: `${section.content}\n\nImported from approved Final DSR — ${config.title}:\n${imported}`, source: "dsr" } : section),
      details: {
        ...current.details,
        ...(key === "district" && typeof value === "string" ? { district: value } : {}),
        ...(key === "mineral" && typeof value === "string" ? { mineral: value } : {}),
      },
    }));
    toast.success(`${config.title} successfully copied to report`);
  };

  const uploadEvidence = async (requirement: EvidenceRequirement, event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!study || !selected.length) return;
    const tooLarge = selected.find((file) => file.size > 50 * 1024 * 1024);
    if (tooLarge) { toast.error(`${tooLarge.name} exceeds 50 MB. Please compress or split the file before uploading.`); return; }
    setUploading(requirement.id);
    try {
      const uploaded: ReplenishmentFile[] = [];
      for (const file of selected) uploaded.push(await replenishmentApi.uploadFile(study.id, requirement.id, file));
      setFiles((current) => [...current, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded successfully`);
    } catch {
      toast.error("File upload failed");
    } finally {
      setUploading(null);
    }
  };

  const downloadEvidence = async (file: ReplenishmentFile) => {
    if (!study) return;
    try { downloadBlob(await replenishmentApi.downloadFile(study.id, file.id), file.fileName); }
    catch { toast.error("File download failed"); }
  };

  const downloadPdf = async () => {
    toast.info("Generating Final PDF...");
    try {
      await downloadHtmlAsPdf(reportHtml, replenishmentFileName({ district: state.details.district, river: state.details.river, year: state.details.studyYear, version: study?.currentVersion, extension: "pdf" }));
      toast.success("Final report downloaded");
    } catch { toast.error("PDF generation failed"); }
  };

  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const inheritedEntries = Object.keys(state.inherited || {}).filter((key) => state.inherited?.[key] != null && inheritedLabels[key]);
  const frameSections = [
    { id: "index", label: "Index" },
    { id: "table-list", label: "List of Tables & Annexures" },
    { id: "project-details-page", label: "Project Details" },
    ...state.sections.filter((section) => section.included).map((section) => ({ id: section.id, label: section.title })),
    { id: "annexures", label: "Annexure Register" },
  ];
  const selectedFrameLabel = frameSections.find((section) => section.id === selectedFrameSection)?.label || "Selected section";
  const selectedFrameOverride = state.sectionOverrides?.[selectedFrameSection] || {};
  const updateFrameOverride = (field: "headerText" | "footerText", value: string) => {
    setState((current) => ({
      ...current,
      sectionOverrides: {
        ...current.sectionOverrides,
        [selectedFrameSection]: {
          ...current.sectionOverrides?.[selectedFrameSection],
          [field]: value,
        },
      },
    }));
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><RefreshCw className="animate-spin text-[#12396b]" /></div>;

  return <div className="pb-10">
    <PageHeader backLink={`/projects/${projectId}`} title="Replenishment Report Studio" description="A guided workflow from DSR import to a signed, calculation-backed final report" action={<div className="flex flex-wrap gap-2"><button onClick={() => setWorkspacePreview((visible) => !visible)} className="module-btn-secondary"><Eye size={16} /> {workspacePreview ? "Hide preview" : "Show preview"}</button><button onClick={() => setPreviewOpen(true)} className="module-btn-secondary"><Eye size={16} /> Full preview</button><button onClick={save} disabled={saving} className="module-btn-primary"><Save size={16} /> {saving ? "Saving…" : "Save"}</button></div>} />

    <section className="mx-4 mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Settings2 size={16} />
        Report Header &amp; Footer Settings
      </div>
      <div className="grid gap-3 md:grid-cols-4 md:items-end">
        <Field label="Default header" value={state.details.headerText} onChange={(value) => updateDetails("headerText", value)} />
        <Field label="Default footer" value={state.details.footerText} onChange={(value) => updateDetails("footerText", value)} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600">Page / section override</span>
          <select value={selectedFrameSection} onChange={(event) => setSelectedFrameSection(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#12396b] focus:ring-2 focus:ring-blue-100">
            {frameSections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
        </label>
        <button onClick={save} disabled={saving} className="module-btn-primary justify-center">
          <Save size={16} />
          {saving ? "Saving…" : "Save Format"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label={`${selectedFrameLabel} header`} value={selectedFrameOverride.headerText || ""} onChange={(value) => updateFrameOverride("headerText", value)} placeholder="Uses default header if empty" />
        <Field label={`${selectedFrameLabel} footer`} value={selectedFrameOverride.footerText || ""} onChange={(value) => updateFrameOverride("footerText", value)} placeholder="Uses default footer if empty" />
      </div>
    </section>

    <div className="mb-5 grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="!p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-[#12396b]"><FileText size={20} /></div><div><div className="text-xs text-slate-500">Report completion</div><b className="text-xl text-[#12396b]">{completion}%</b></div></div></Card>
      <Card className="!p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-2 text-amber-700"><Calculator size={20} /></div><div><div className="text-xs text-slate-500">Assessed quantity</div><b className="text-xl text-[#12396b]">{formatNumber(totalQuantity)} MT</b></div></div></Card>
      <Card className="!p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><ShieldCheck size={20} /></div><div><div className="text-xs text-slate-500">Required evidence</div><b className="text-xl text-[#12396b]">{requiredUploaded}/{requiredCount}</b></div></div></Card>
      <Card className="!p-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-violet-50 p-2 text-violet-700"><Database size={20} /></div><div><div className="text-xs text-slate-500">Workflow status</div><b className="text-sm text-[#12396b]">{study?.approvalState?.replace(/_/g, " ") || "DRAFT"}</b></div></div></Card>
    </div>

    <div className={`grid gap-5 px-4 ${workspacePreview ? "xl:grid-cols-[230px_minmax(500px,1fr)_minmax(380px,0.78fr)]" : "xl:grid-cols-[260px_minmax(0,1fr)]"}`}>
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-4">
        {steps.map((step, index) => <button key={step.id} onClick={() => setActiveStep(step.id)} className={`mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${activeStep === step.id ? "bg-[#12396b] text-white" : "hover:bg-slate-50"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${activeStep === step.id ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span><span><b className="block text-sm">{step.label}</b><small className={activeStep === step.id ? "text-blue-100" : "text-slate-400"}>{step.helper}</small></span></button>)}
        <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">Last saved<br/><b className="text-slate-700">{state.lastSavedAt ? new Date(state.lastSavedAt).toLocaleString("en-IN") : "Not saved yet"}</b></div>
      </aside>

      <main className="min-w-0">
        {activeStep === "setup" && <div className="space-y-5"><Card><div className="mb-4"><h3 className="text-lg font-extrabold text-[#12396b]">Report design</h3><p className="text-sm text-slate-500">Switching formats will automatically update both the side preview and final download.</p></div><div className="grid gap-3 md:grid-cols-2"><button onClick={() => updateDetails("reportFormat", "official")} className={`rounded-xl border-2 p-4 text-left transition ${state.details.reportFormat === "official" ? "border-[#12396b] bg-blue-50" : "border-slate-200 hover:border-blue-200"}`}><div className="flex items-center justify-between"><b className="text-[#12396b]">Official Replenishment</b>{state.details.reportFormat === "official" && <CheckCircle2 size={18} className="text-emerald-600"/>}</div><p className="mt-1 text-xs leading-5 text-slate-500">Government technical report, compact tables, declarations and annexure register.</p></button><button onClick={() => updateDetails("reportFormat", "book")} className={`rounded-xl border-2 p-4 text-left transition ${state.details.reportFormat === "book" ? "border-amber-700 bg-amber-50" : "border-slate-200 hover:border-amber-200"}`}><div className="flex items-center justify-between"><b className="text-amber-900">Bound Book Edition</b>{state.details.reportFormat === "book" && <CheckCircle2 size={18} className="text-emerald-600"/>}</div><p className="mt-1 text-xs leading-5 text-slate-500">Book-style cover, serif typography, chapter opening pages and print-ready binding look.</p></button></div></Card><Card><div className="mb-5"><h3 className="text-lg font-extrabold text-[#12396b]">Study identity</h3><p className="text-sm text-slate-500">Details for the final report cover and document control.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Report title" value={state.details.reportTitle} onChange={(value) => updateDetails("reportTitle", value)} /><Field label="District" value={state.details.district} onChange={(value) => updateDetails("district", value)} /><Field label="River / reach" value={state.details.river} onChange={(value) => updateDetails("river", value)} /><Field label="Mining block" value={state.details.block} onChange={(value) => updateDetails("block", value)} /><Field label="Village" value={state.details.village} onChange={(value) => updateDetails("village", value)} /><Field label="Minor mineral" value={state.details.mineral} onChange={(value) => updateDetails("mineral", value)} /><Field label="Applicant / project proponent" value={state.details.applicant} onChange={(value) => updateDetails("applicant", value)} /><Field label="Prepared by" value={state.details.preparedBy} onChange={(value) => updateDetails("preparedBy", value)} /><Field label="Study year" value={state.details.studyYear} onChange={(value) => updateDetails("studyYear", value)} /></div></Card><Card><div className="flex items-start gap-3"><Sparkles className="mt-0.5 text-amber-600" size={20}/><div><h3 className="font-bold text-slate-800">Built from both official report formats</h3><p className="mt-1 text-sm leading-6 text-slate-500">Detailed chapter sequence, survey methodology, grid calculation, evidence annexures, certificates and compact results layout are combined into one editable format. Select reusable data from the approved DSR in the next step.</p></div></div></Card></div>}

        {activeStep === "import" && <div className="space-y-5"><Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-extrabold text-[#12396b]">Selective Final DSR import</h3><p className="text-sm text-slate-500">Only selected data will be copied to the report; the original DSR will remain unchanged.</p></div><button onClick={refreshDsr} disabled={importing} className="module-btn-primary"><RefreshCw size={16} className={importing ? "animate-spin" : ""}/>{importing ? "Fetching…" : "Refresh approved DSR"}</button></div></Card>{inheritedEntries.length ? <div className="grid gap-4 md:grid-cols-2">{inheritedEntries.map((key) => { const config = inheritedLabels[key]; const done = state.importedKeys.includes(key); return <Card key={key}><div className="flex items-start justify-between gap-4"><div><div className="mb-1 flex items-center gap-2"><Database size={16} className="text-blue-700"/><b>{config.title}</b></div><p className="text-xs text-slate-500">{config.description}</p><pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{readableInherited(state.inherited?.[key])}</pre></div><button onClick={() => importKey(key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${done ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#12396b]"}`}>{done ? <><Check size={14} className="inline"/> Copied</> : "Copy"}</button></div></Card>; })}</div> : <Card><div className="py-10 text-center"><FolderOpen className="mx-auto mb-3 text-slate-300" size={44}/><h3 className="font-bold text-slate-700">Approved Final DSR data is not loaded yet</h3><p className="mt-1 text-sm text-slate-500">Use the Refresh button. If no Final DSR is linked with the project, you can continue with fresh or manual content.</p></div></Card>}</div>}

        {activeStep === "content" && <div className="space-y-4"><Card><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-extrabold text-[#12396b]">Report chapters</h3><p className="text-sm text-slate-500">Live preview updates automatically as you type. You can also include or exclude specific sections.</p></div><button onClick={() => setState((current) => ({ ...current, sections: [...current.sections, { id: crypto.randomUUID(), title: `Custom Section ${current.sections.length + 1}`, category: "Custom", content: "", included: true, source: "manual" }] }))} className="module-btn-secondary"><Plus size={16}/> Add section</button></div></Card><Card><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-extrabold text-[#12396b]">Insert tables and photos</h3><p className="text-sm text-slate-500">Click any item to place it at the cursor in the selected chapter.</p></div><span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Target: {state.sections.find((section) => section.id === activeContentSectionId)?.title || "Select chapter"}</span></div><div className="grid gap-4 lg:grid-cols-2"><div><h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Tables</h4><div className="flex flex-wrap gap-2">{calculationTables.map((table, index) => <button key={table.id} onClick={() => insertIntoActiveSection(`[[TABLE:${table.id}]]`)} className="module-btn-secondary"><ClipboardList size={15}/> {table.title || `Table ${index + 1}`}</button>)}</div></div><div><h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Photos</h4><div className="flex flex-wrap gap-2">{photoFiles.length ? photoFiles.map((file) => <button key={file.id} onClick={() => insertIntoActiveSection(`[[PHOTO:${file.id}]]`)} className="module-btn-secondary"><FileText size={15}/> {file.fileName}</button>) : <span className="text-xs text-slate-500">Upload image files in Evidence first.</span>}</div></div></div></Card>{state.sections.map((section) => <Card key={section.id}><div className="mb-3 flex flex-wrap items-center gap-3"><input type="checkbox" checked={section.included} onChange={(event) => updateSection(section.id, { included: event.target.checked })} className="h-4 w-4 accent-[#12396b]"/><input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value, source: "manual" })} className="min-w-[260px] flex-1 border-0 bg-transparent text-base font-bold text-[#12396b] outline-none"/><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${section.source === "dsr" ? "bg-blue-50 text-blue-700" : section.source === "manual" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{section.source === "dsr" ? "DSR + edited" : section.source}</span>{section.category === "Custom" && <button onClick={() => setState((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== section.id) }))} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>}</div><textarea id={`replenishment-section-${section.id}`} disabled={!section.included} value={section.content} onFocus={() => setActiveContentSectionId(section.id)} onChange={(event) => updateSection(section.id, { content: event.target.value, source: "manual" })} rows={6} className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-[#12396b] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"/></Card>)}</div>}

  {activeStep === "survey" && <div className="space-y-5"><Card><h3 className="mb-1 text-lg font-extrabold text-[#12396b]">Survey inputs</h3><p className="mb-5 text-sm text-slate-500">Enter verified pre/post monsoon survey observations using a common datum and same grid extent.</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Lease area" suffix="ha" value={state.details.leaseArea} onChange={(value) => updateDetails("leaseArea", value)} /><Field label="Mineable area" suffix="ha" value={state.details.mineableArea} onChange={(value) => updateDetails("mineableArea", value)} /><Field label="Pre-monsoon survey" type="date" value={state.details.preSurveyDate} onChange={(value) => updateDetails("preSurveyDate", value)} /><Field label="Post-monsoon survey" type="date" value={state.details.postSurveyDate} onChange={(value) => updateDetails("postSurveyDate", value)} /><Field label="Bulk density" suffix="MT/cum" value={state.details.bulkDensity} onChange={(value) => updateDetails("bulkDensity", value)} /><Field label="Approved annual quantity" suffix="MT" value={state.details.approvedQuantity} onChange={(value) => updateDetails("approvedQuantity", value)} /><Field label="Extracted quantity" suffix="MT" value={state.details.extractedQuantity} onChange={(value) => updateDetails("extractedQuantity", value)} /><Field label="Rainfall during period" suffix="mm" value={state.details.rainfall} onChange={(value) => updateDetails("rainfall", value)} /></div></Card><Card><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-extrabold text-[#12396b]">Survey & calculation photos</h3><p className="mt-1 text-sm text-slate-500">Upload site, survey, grid and calculation photos here. Captions will print below inserted photos in the final report.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-[#12396b] hover:bg-blue-100"><Upload size={14}/>{uploading === surveyPhotoRequirement.id ? "Uploadingâ€¦" : "Upload photos"}<input type="file" multiple accept={surveyPhotoRequirement.accept} disabled={uploading !== null} onChange={(event) => void uploadEvidence(surveyPhotoRequirement, event)} className="hidden"/></label></div>{surveyPhotoFiles.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{surveyPhotoFiles.map((file) => <div key={file.id} className="rounded-lg bg-slate-50 p-2"><button onClick={() => void downloadEvidence(file)} className="flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left text-xs hover:bg-blue-50"><span className="truncate font-medium text-[#12396b]">{file.fileName}</span><span className="shrink-0 text-slate-400">{fileSize(file.sizeBytes)}</span></button><label className="mt-2 block"><span className="mb-1 block text-[11px] font-bold text-slate-500">Photo caption</span><input value={state.photoCaptions?.[file.id] || ""} onChange={(event) => updatePhotoCaption(file.id, event.target.value)} placeholder="Text shown below this photo in final report" className="w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#12396b]"/></label></div>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No survey photos uploaded yet.</div>}</Card>{primaryTable && <GridCalculationCard table={primaryTable} tableNumber={1} canRemove={false} onAddRow={() => addGridRow(primaryTable.id)} onUpdateTitle={(title) => updateGridTableTitle(primaryTable.id, title)} onUpdateColumn={(key, patch) => updateGridColumn(primaryTable.id, key, patch)} onToggleColumn={(key, visible) => toggleGridColumn(primaryTable.id, key, visible)} onUpdateRow={(rowId, key, value) => updateGridInTable(primaryTable.id, rowId, key, value)} onRemoveRow={(rowId) => removeGridRow(primaryTable.id, rowId)} extraActions={<button onClick={addGridTable} className="module-btn-secondary"><Plus size={16}/> Add table</button>} />}{calculationTables.slice(1).map((table, index) => <GridCalculationCard key={table.id} table={table} tableNumber={index + 2} canRemove={calculationTables.length > 1} onAddRow={() => addGridRow(table.id)} onRemoveTable={() => removeGridTable(table.id)} onUpdateTitle={(title) => updateGridTableTitle(table.id, title)} onUpdateColumn={(key, patch) => updateGridColumn(table.id, key, patch)} onToggleColumn={(key, visible) => toggleGridColumn(table.id, key, visible)} onUpdateRow={(rowId, key, value) => updateGridInTable(table.id, rowId, key, value)} onRemoveRow={(rowId) => removeGridRow(table.id, rowId)} />)}<Card><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Study remarks and calculation assumptions</span><textarea rows={4} value={state.details.remarks} onChange={(event) => updateDetails("remarks", event.target.value)} className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#12396b]"/></label></Card></div>}

        {activeStep === "evidence" && <div className="space-y-4"><Card><h3 className="text-lg font-extrabold text-[#12396b]">Evidence and annexure upload centre</h3><p className="mt-1 text-sm text-slate-500">Photo upload Survey Photographs / Maps cards me Choose file(s) se hota hai. Image file ke niche caption likh sakte ho; wahi final report me photo ke niche aayega.</p></Card><div className="grid gap-4 md:grid-cols-2">{evidenceRequirements.map((requirement) => { const matches = files.filter((file) => file.sectionId === requirement.id); return <Card key={requirement.id}><div className="flex items-start gap-3"><div className={`rounded-lg p-2 ${matches.length ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{matches.length ? <FileCheck2 size={20}/> : <CloudUpload size={20}/>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><b className="text-sm">{requirement.title}</b><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${requirement.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>{requirement.required ? "REQUIRED" : "OPTIONAL"}</span></div><p className="mt-1 text-xs text-slate-500">{requirement.hint}</p><div className="mt-3 space-y-2">{matches.map((file) => <div key={file.id} className="rounded-lg bg-slate-50 p-2"><button onClick={() => void downloadEvidence(file)} className="flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left text-xs hover:bg-blue-50"><span className="truncate font-medium text-[#12396b]">{file.fileName}</span><span className="shrink-0 text-slate-400">{fileSize(file.sizeBytes)}</span></button>{file.contentType?.startsWith("image/") && <label className="mt-2 block"><span className="mb-1 block text-[11px] font-bold text-slate-500">Photo caption</span><input value={state.photoCaptions?.[file.id] || ""} onChange={(event) => updatePhotoCaption(file.id, event.target.value)} placeholder="Text shown below this photo in final report" className="w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#12396b]"/></label>}</div>)}</div><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-[#12396b] hover:bg-blue-100"><Upload size={14}/>{uploading === requirement.id ? "Uploading…" : matches.length ? "Add another file" : "Choose file(s)"}<input type="file" multiple accept={requirement.accept} disabled={uploading !== null} onChange={(event) => void uploadEvidence(requirement, event)} className="hidden"/></label></div></div></Card>; })}</div></div>}

        {activeStep === "review" && <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3"><Card><CheckCircle2 className="mb-2 text-emerald-600"/><div className="text-xs text-slate-500">Completion</div><b className="text-2xl text-[#12396b]">{completion}%</b></Card><Card><ClipboardList className="mb-2 text-blue-700"/><div className="text-xs text-slate-500">Included chapters</div><b className="text-2xl text-[#12396b]">{state.sections.filter((item) => item.included).length}</b></Card><Card><CloudUpload className="mb-2 text-amber-600"/><div className="text-xs text-slate-500">Uploaded files</div><b className="text-2xl text-[#12396b]">{files.length}</b></Card></div><Card><h3 className="mb-4 text-lg font-extrabold text-[#12396b]">Final verification</h3><div className="grid gap-2 md:grid-cols-2">{[
          [Boolean(state.details.district && state.details.river), "District and river identity complete"],
          [Boolean(state.details.preSurveyDate && state.details.postSurveyDate), "Pre/post survey dates complete"],
          [numberValue(state.details.bulkDensity) > 0, "Bulk density entered"],
          [state.grids.some((row) => numberValue(row.area) > 0), "At least one calculation grid complete"],
          [requiredUploaded === requiredCount, "All required evidence uploaded"],
          [state.sections.filter((item) => item.included).every((item) => item.content.trim()), "All included chapters have content"],
        ].map(([ok, label]) => <div key={String(label)} className={`flex items-center gap-2 rounded-lg p-3 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{ok ? <CheckCircle2 size={17}/> : <ClipboardList size={17}/>}<span>{label}</span></div>)}</div></Card><Card><h3 className="mb-1 text-lg font-extrabold text-[#12396b]">Preview and export</h3><p className="mb-4 text-sm text-slate-500">Save draft, verify live A4 preview, then download PDF/DOCX.</p><div className="flex flex-wrap gap-3"><button onClick={() => setPreviewOpen(true)} className="module-btn-primary"><Eye size={16}/> Open live preview</button><button onClick={() => void downloadPdf()} className="module-btn-primary"><Download size={16}/> Download final PDF</button><button onClick={() => { exportWordDocument(reportHtml, replenishmentFileName({ district: state.details.district, river: state.details.river, year: state.details.studyYear, version: study?.currentVersion, extension: "docx" })); toast.success("Editable document downloaded"); }} className="module-btn-secondary"><FileText size={16}/> Editable DOCX</button><button onClick={() => { exportDraftJson(state, `Replenishment_Draft_${state.details.studyYear}.json`); toast.success("Backup downloaded"); }} className="module-btn-secondary"><Database size={16}/> Draft backup</button><button onClick={() => openPrintableDocument(reportHtml, state.details.reportTitle)} className="module-btn-secondary"><FileCheck2 size={16}/> Print / Save PDF</button></div></Card></div>}

        <div className="mt-5 flex items-center justify-between"><button disabled={activeIndex === 0} onClick={() => setActiveStep(steps[Math.max(0, activeIndex - 1)].id)} className="module-btn-secondary disabled:opacity-40"><ChevronLeft size={16}/> Previous</button><div className="text-xs text-slate-400">Step {activeIndex + 1} of {steps.length}</div><button disabled={activeIndex === steps.length - 1} onClick={() => setActiveStep(steps[Math.min(steps.length - 1, activeIndex + 1)].id)} className="module-btn-primary disabled:opacity-40">Next <ChevronRight size={16}/></button></div>
      </main>

      {workspacePreview && <aside className="hidden h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm xl:sticky xl:top-4 xl:block"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"><div><div className="flex items-center gap-2 text-sm font-extrabold text-[#12396b]"><Eye size={16}/> Live report preview</div><p className="mt-0.5 text-[11px] text-slate-500">Form, DSR import aur calculations instantly update</p></div><button onClick={() => setPreviewOpen(true)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#12396b] hover:bg-blue-50">Expand</button></div><iframe title="Inline replenishment report preview" srcDoc={reportHtml} className="h-[calc(100%-65px)] w-full bg-white"/></aside>}
    </div>

    {previewOpen && <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 p-3 md:p-6"><div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-t-xl bg-white px-4 py-3"><div><b className="text-[#12396b]">Live final report preview</b><p className="text-xs text-slate-500">Current form values, selected DSR content aur calculations</p></div><div className="flex gap-2"><button onClick={() => void downloadPdf()} className="module-btn-primary"><Download size={15}/> PDF</button><button onClick={() => setPreviewOpen(false)} className="module-btn-secondary">Close</button></div></div><iframe title="Replenishment report preview" srcDoc={reportHtml} className="mx-auto h-full w-full max-w-6xl rounded-b-xl bg-white"/></div>}
  </div>;
}
