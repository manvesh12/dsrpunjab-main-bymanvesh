import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  Archive,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  FileStack,
  FolderTree,
  GitCompare,
  Layers3,
  Lock,
  Map,
  Merge,
  Download,
  FileJson,
  FileText,
  Printer,
  RefreshCw,
  Replace,
  Save,
  Upload,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import {
  replenishmentApi,
  type ReplenishmentStudy,
} from "../../api/replenishment.api";
import {
  downloadBlob,
  exportDraftJson,
  exportWordDocument,
  loadDownloadHistory,
  openPrintableDocument,
  downloadHtmlAsPdf,
  recordDownloadHistory,
  replenishmentFileName,
  type DownloadFormat,
} from "../../utils/reportExport";

type ImportMode = "smart" | "selective" | "fresh";
type ContentAction = "Preview" | "Copy" | "Replace" | "Merge" | "Reference" | "Skip";

type ContentItem = {
  id: string;
  group: string;
  name: string;
  status: "Imported" | "Updated" | "Pending" | "Fresh Survey Required";
  action: ContentAction;
};

type SurveyUpdate = {
  surveyYear: string;
  surveyDate: string;
  projectName: string;
  blockName: string;
  village: string;
  mineral: string;
  applicant: string;
  preparedBy: string;
  leaseArea: string;
  mineableArea: string;
  approvedAnnualQuantity: string;
  preMonsoonDate: string;
  postMonsoonDate: string;
  gridArea: string;
  preMonsoonElevation: string;
  postMonsoonElevation: string;
  bulkDensity: string;
  extractedQuantity: string;
  dgps: boolean;
  drone: boolean;
  demDsm: boolean;
  orthomosaic: boolean;
  crossSections: boolean;
  rainfall: string;
  waterLevel: string;
  riverWidthDepth: string;
  sediment: string;
  photos: string;
};

type CrossSectionRow = {
  id: string;
  chainage: string;
  previous: string;
  updated: string;
  action: "Copy previous" | "Replace graph" | "Upload updated" | "Overlay compare";
};

type WorkflowState = {
  type: "replenishment_enterprise_workflow";
  importMode: ImportMode;
  selectedResources: string[];
  contentItems: ContentItem[];
  crossSections: CrossSectionRow[];
  importSummary: { imported: number; updated: number; pending: number };
  suggestions: { title: string; detail: string; kind: "static" | "dynamic" | "pending" }[];
  dynamicRegeneration: string[];
  previewNotes: string[];
  lastSavedAt?: string;
  district?: string;
  river?: string;
  year?: string;
  version?: number;
};

const resourceOptions = [
  "Chapters",
  "Tables",
  "Figures",
  "Maps",
  "Cross Sections",
  "Images",
  "Graphs",
  "Annexures",
  "References",
];

const dynamicOutputs = [
  "Reserve Estimation",
  "Volume Calculation",
  "Grid Calculation",
  "Replenishment Analysis",
  "Quantity Tables",
  "Cross Section Tables",
  "Updated Figures",
  "Executive Summary",
  "Conclusion",
  "Recommendations",
];

const defaultSurvey: SurveyUpdate = {
  surveyYear: "2025-26",
  surveyDate: "",
  projectName: "River Bed Material Replenishment Study",
  blockName: "",
  village: "",
  mineral: "River Bed Material / Sand",
  applicant: "",
  preparedBy: "District Survey Report Committee",
  leaseArea: "",
  mineableArea: "",
  approvedAnnualQuantity: "",
  preMonsoonDate: "",
  postMonsoonDate: "",
  gridArea: "",
  preMonsoonElevation: "",
  postMonsoonElevation: "",
  bulkDensity: "1.80",
  extractedQuantity: "",
  dgps: true,
  drone: true,
  demDsm: true,
  orthomosaic: true,
  crossSections: true,
  rainfall: "",
  waterLevel: "",
  riverWidthDepth: "",
  sediment: "",
  photos: "",
};

const defaultWorkflow: WorkflowState = {
  type: "replenishment_enterprise_workflow",
  importMode: "smart",
  selectedResources: resourceOptions,
  contentItems: [
    { id: "front", group: "Front Matter", name: "Certificate, Preface, Executive context", status: "Imported", action: "Reference" },
    { id: "chapters", group: "Chapters", name: "Static district, geology and drainage chapters", status: "Imported", action: "Copy" },
    { id: "tables", group: "Tables", name: "Lease, river and baseline district tables", status: "Imported", action: "Merge" },
    { id: "maps", group: "Maps", name: "District maps, mining block plans and GIS outputs", status: "Updated", action: "Replace" },
    { id: "cross", group: "Cross Sections", name: "Pre/post monsoon chainage profiles", status: "Fresh Survey Required", action: "Replace" },
    { id: "annexures", group: "Annexures", name: "References, approvals and survey attachments", status: "Pending", action: "Skip" },
  ],
  crossSections: [
    { id: "cs-01", chainage: "R-01 / 0+500", previous: "Final DSR graph available", updated: "Awaiting updated Excel", action: "Overlay compare" },
    { id: "cs-02", chainage: "R-02 / 1+250", previous: "Final DSR graph available", updated: "Fresh survey required", action: "Upload updated" },
  ],
  importSummary: { imported: 3, updated: 1, pending: 2 },
  suggestions: [
    { title: "Reuse safe", detail: "District profile, geology, drainage and statutory references look static.", kind: "static" },
    { title: "Update required", detail: "Survey year, cross sections, river dimensions, rainfall and water level are dynamic.", kind: "dynamic" },
    { title: "Pending evidence", detail: "Upload updated DGPS/drone/DEM/orthomosaic files before final generation.", kind: "pending" },
  ],
  dynamicRegeneration: dynamicOutputs,
  previewNotes: [
    "Existing Final DSR remains read-only and untouched.",
    "Imported Replenishment Report starts from reusable approved DSR content.",
    "Updated Replenishment Report highlights modified survey-dependent sections.",
  ],
  district: "Punjab",
  river: "River",
  year: String(new Date().getFullYear()),
  version: 1,
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numericValue(value: string) {
  const parsed = Number(String(value || "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formattedNumber(value: number, digits = 2) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

function currentUserName() {
  try {
    const raw = localStorage.getItem("dsr:auth_user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.fullName || user?.username || user?.email || "Current Officer";
  } catch {
    return "Current Officer";
  }
}

function fileNameFor(workflow: WorkflowState, extension: "pdf" | "json" | "docx") {
  return replenishmentFileName({
    district: workflow.district,
    river: workflow.river,
    year: workflow.year,
    version: workflow.version,
    extension,
  });
}

function recordHistory(studyId: string, workflow: WorkflowState, fileName: string, fileSize: number, format: DownloadFormat) {
  recordDownloadHistory({
    reportId: studyId,
    generatedBy: currentUserName(),
    version: workflow.version || 1,
    fileName,
    fileSize,
    format,
  });
}

function buildReplenishmentPreviewHtml(study: ReplenishmentStudy | null, workflow: WorkflowState, survey: SurveyUpdate) {
  const summary = workflow.importSummary;
  const safe = (value: unknown, fallback = "To be provided") => escapeHtml(value || fallback);
  const gridArea = numericValue(survey.gridArea);
  const preElevation = numericValue(survey.preMonsoonElevation);
  const postElevation = numericValue(survey.postMonsoonElevation);
  const elevationDifference = Math.abs(postElevation - preElevation);
  const bulkDensity = numericValue(survey.bulkDensity);
  const replenishedVolume = gridArea * elevationDifference;
  const replenishedQuantity = replenishedVolume * bulkDensity;
  const approvedQuantity = numericValue(survey.approvedAnnualQuantity);
  const replenishmentPercentage = approvedQuantity > 0 ? (replenishedQuantity / approvedQuantity) * 100 : 0;
  const extractedQuantity = numericValue(survey.extractedQuantity);
  const netAvailableQuantity = Math.max(0, replenishedQuantity - extractedQuantity);
  const instrumentList = [survey.dgps && "DGPS", survey.drone && "Drone survey", survey.demDsm && "DEM/DSM", survey.orthomosaic && "Orthomosaic", survey.crossSections && "Cross-section profiles"].filter(Boolean).join(", ");
  const requiredFields = [workflow.district, workflow.river, survey.blockName, survey.preMonsoonDate, survey.postMonsoonDate, survey.gridArea, survey.preMonsoonElevation, survey.postMonsoonElevation, survey.bulkDensity];
  const completedFields = requiredFields.filter(Boolean).length;
  const calculationStatus = completedFields === requiredFields.length ? "CALCULATION READY" : `${completedFields}/${requiredFields.length} DATA FIELDS READY`;
  const rows = workflow.contentItems.map((item) => `<tr><td>${safe(item.group)}</td><td>${safe(item.name)}</td><td>${safe(item.status)}</td><td>${safe(item.action)}</td></tr>`).join("");
  const annexures = [
    ["A", "Environmental Clearance / statutory approval"],
    ["B", "Approved mining plan and lease plan"],
    ["C", "DGPS base and rover observations"],
    ["D", "Pre-monsoon and post-monsoon grid data"],
    ["E", "Orthomosaic, DEM/DSM and cross-section plates"],
    ["F", "Survey photographs and benchmark records"],
    ["G", "Bulk density laboratory report"],
  ].map(([id, name]) => `<tr><td>Annexure ${id}</td><td>${name}</td><td>Attach verified copy</td></tr>`).join("");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title></title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #dbe2e8; color: #17212b; padding: 18px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto 18px; background: #fff; padding: 18mm 17mm 16mm; box-shadow: 0 3px 18px rgba(15,23,42,.16); page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .watermark { position: absolute; left: 0; right: 0; top: 46%; text-align: center; transform: rotate(-28deg); font-size: 42px; font-weight: 800; color: rgba(23,50,77,.045); pointer-events: none; }
  .running { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #183c5a; padding-bottom: 7px; margin-bottom: 18px; color: #183c5a; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .cover { display: flex; min-height: 250mm; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 3px double #183c5a; padding: 18mm; }
  .emblem { width: 76px; height: 76px; object-fit: contain; margin-bottom: 14px; }
  h1 { font-size: 22px; line-height: 1.35; color: #183c5a; text-transform: uppercase; }
  h2 { margin-top: 9px; font-size: 16px; line-height: 1.4; color: #263b4d; text-transform: uppercase; }
  h3 { margin: 22px 0 10px; font-size: 13px; color: #183c5a; text-transform: uppercase; border-bottom: 1px solid #9eacb8; padding-bottom: 6px; }
  h4 { margin: 14px 0 6px; font-size: 11px; color: #263b4d; }
  p, li { font-size: 10.5px; line-height: 1.65; text-align: justify; }
  ul, ol { margin: 6px 0 10px 20px; }
  .meta { margin-top: 12px; font-size: 11px; color: #526575; }
  .flag { display: inline-block; margin-top: 22px; border: 1px solid #14804a; background: #e8f7ef; color: #11643c; padding: 8px 15px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
  .cover-table { width: 82%; margin-top: 28px; }
  .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
  .signature div { border-top: 1px solid #506474; padding-top: 7px; text-align: center; font-size: 9px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin: 15px 0; }
  .metric { border: 1px solid #b9c5cf; background: #f3f6f8; padding: 10px; border-radius: 3px; }
  .metric b { display: block; font-size: 16px; color: #183c5a; }
  .metric span { font-size: 8px; color: #526575; text-transform: uppercase; }
  .notice { border-left: 4px solid #183c5a; background: #eef3f6; padding: 10px 12px; margin: 12px 0; font-size: 10px; line-height: 1.55; }
  .result { border: 2px solid #14804a; background: #edf9f2; padding: 14px; margin: 16px 0; }
  .result strong { color: #11643c; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9.5px; break-inside: avoid; }
  th, td { border: 1px solid #8fa0ad; padding: 6px; text-align: left; vertical-align: top; line-height: 1.4; }
  th { background: #dfe8ee; color: #183c5a; text-transform: uppercase; }
  .toc td:first-child { width: 9%; text-align: center; }
  .toc td:last-child { width: 12%; text-align: center; }
  .formula { font-family: Consolas, monospace; background: #f3f6f8; border: 1px solid #b9c5cf; padding: 10px; margin: 8px 0; font-size: 10px; }
  .checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin: 10px 0; }
  .check { border: 1px solid #b9c5cf; padding: 8px; font-size: 9.5px; background: #f8fafb; }
  .footer { position: absolute; left: 17mm; right: 17mm; bottom: 8mm; border-top: 1px solid #b9c5cf; padding-top: 5px; display: flex; justify-content: space-between; font-size: 8px; color: #667885; }
  @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; margin: 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <img class="emblem" src="/assets/state-emblem.png" alt="State emblem">
    <h1>Government of Punjab</h1>
    <div class="meta">Department of Mines and Geology</div>
    <h2>Replenishment Study Report</h2>
    <p class="meta">Prepared in accordance with Sustainable Sand Mining Management Guidelines, 2016 and Enforcement & Monitoring Guidelines for Sand Mining, 2020</p>
    <div class="flag">Format Validated - Green Flag</div>
    <table class="cover-table">
      <tr><th>Project</th><td>${safe(survey.projectName)}</td></tr>
      <tr><th>Mining Block</th><td>${safe(survey.blockName)}</td></tr>
      <tr><th>River / Village</th><td>${safe(workflow.river)} / ${safe(survey.village)}</td></tr>
      <tr><th>District</th><td>${safe(workflow.district)}</td></tr>
      <tr><th>Study Year</th><td>${safe(survey.surveyYear || workflow.year)}</td></tr>
      <tr><th>Applicant</th><td>${safe(survey.applicant)}</td></tr>
      <tr><th>Prepared By</th><td>${safe(survey.preparedBy)}</td></tr>
    </table>
    <p class="meta">Report version ${safe(workflow.version, "1")} | ${safe(calculationStatus)}</p>
  </div>
  <div class="footer"><span>Replenishment Study Report</span><span>Cover</span></div>
</div>

<div class="page">
  <div class="watermark">GOVERNMENT OF PUNJAB</div>
  <div class="running"><span>Replenishment Study Report</span><span>${safe(workflow.district)} | ${safe(workflow.year)}</span></div>
  <h2>Certificate and Declaration</h2>
  <div class="notice">This generic report format has been prepared for documenting a scientific replenishment assessment. All project-specific values, survey observations, maps, photographs, laboratory results and statutory approvals must be verified by the competent authority before submission.</div>
  <h3>Certificate</h3>
  <p>It is certified that the pre-monsoon and post-monsoon survey data presented in this report shall be based on field observations, authenticated benchmarks and approved survey methodology. The replenished quantity shall be restricted to scientifically assessed deposition within the eligible mineable area.</p>
  <h3>Report Particulars</h3>
  <table>
    <tr><th>Mineral</th><td>${safe(survey.mineral)}</td><th>Lease Area</th><td>${safe(survey.leaseArea)} ha</td></tr>
    <tr><th>Mineable Area</th><td>${safe(survey.mineableArea)} ha</td><th>Mining Block</th><td>${safe(survey.blockName)}</td></tr>
    <tr><th>Pre-monsoon Survey</th><td>${safe(survey.preMonsoonDate)}</td><th>Post-monsoon Survey</th><td>${safe(survey.postMonsoonDate)}</td></tr>
    <tr><th>Survey Technologies</th><td colspan="3">${safe(instrumentList, "DGPS / drone / cross-section survey as applicable")}</td></tr>
  </table>
  <div class="signature"><div>Survey Officer / GIS Expert</div><div>District Mining Officer</div></div>
  <div class="signature"><div>Project Proponent</div><div>Competent Authority</div></div>
  <div class="footer"><span>Government format - verify before issue</span><span>Page 2</span></div>
</div>

<div class="page">
  <div class="running"><span>Replenishment Study Report</span><span>Contents</span></div>
  <h2>Table of Contents</h2>
  <table class="toc">
    <tr><th>Sr.</th><th>Section</th><th>Page</th></tr>
    <tr><td>1</td><td>Introduction, objectives and statutory basis</td><td>4</td></tr>
    <tr><td>2</td><td>Project and baseline particulars</td><td>4</td></tr>
    <tr><td>3</td><td>Survey methodology and quality controls</td><td>5</td></tr>
    <tr><td>4</td><td>Pre/post monsoon observations</td><td>6</td></tr>
    <tr><td>5</td><td>Volume, quantity and replenishment calculation</td><td>6</td></tr>
    <tr><td>6</td><td>Findings, conclusion and recommendations</td><td>7</td></tr>
    <tr><td>7</td><td>Annexure and evidence checklist</td><td>8</td></tr>
  </table>
  <h3>Imported DSR Content Register</h3>
  <table><tr><th>Group</th><th>Content</th><th>Status</th><th>Treatment</th></tr>${rows}</table>
  <div class="grid">
    <div class="metric"><b>${summary.imported}</b><span>Imported references</span></div>
    <div class="metric"><b>${summary.updated}</b><span>Updated sections</span></div>
    <div class="metric"><b>${summary.pending}</b><span>Pending evidence</span></div>
  </div>
  <div class="footer"><span>${safe(study?.title, "Replenishment Study")}</span><span>Page 3</span></div>
</div>

<div class="page">
  <div class="running"><span>Chapter 1</span><span>Introduction and Project Profile</span></div>
  <h2>1. Introduction</h2>
  <p>Natural replenishment is the deposition of river-borne sediment within a river reach during the hydrological cycle. A replenishment study establishes the quantity of minor mineral deposited between scientifically comparable survey periods and supports a sustainable extraction limit.</p>
  <p>The study shall compare authenticated pre-monsoon and post-monsoon terrain surfaces using common benchmarks, eligible grid areas and consistent survey controls. Static district information may be referenced from the approved District Survey Report, while survey-dependent data must be refreshed for the current study year.</p>
  <h3>1.1 Objectives</h3>
  <ol><li>Measure changes in river-bed elevation between the selected survey periods.</li><li>Estimate deposited volume and convert it to mass using verified bulk density.</li><li>Compare replenishment with approved annual quantity and recorded extraction.</li><li>Recommend a sustainable quantity subject to statutory safety restrictions.</li></ol>
  <h3>1.2 Project Details</h3>
  <table>
    <tr><th>Project / Block</th><td>${safe(survey.projectName)} / ${safe(survey.blockName)}</td></tr>
    <tr><th>Location</th><td>${safe(survey.village)}, ${safe(workflow.district)}, Punjab</td></tr>
    <tr><th>River and Mineral</th><td>${safe(workflow.river)} | ${safe(survey.mineral)}</td></tr>
    <tr><th>Lease / Mineable Area</th><td>${safe(survey.leaseArea)} ha / ${safe(survey.mineableArea)} ha</td></tr>
    <tr><th>Approved Annual Quantity</th><td>${safe(survey.approvedAnnualQuantity)} metric tonnes</td></tr>
    <tr><th>Rainfall / Water Level</th><td>${safe(survey.rainfall)} / ${safe(survey.waterLevel)}</td></tr>
    <tr><th>River Width / Depth</th><td>${safe(survey.riverWidthDepth)}</td></tr>
    <tr><th>Sediment Description</th><td>${safe(survey.sediment)}</td></tr>
  </table>
  <h3>1.3 Statutory Basis</h3>
  <p>The assessment framework follows the Sustainable Sand Mining Management Guidelines, 2016 and the Enforcement & Monitoring Guidelines for Sand Mining, 2020. Applicable Environmental Clearance conditions, approved mining plan provisions, bridge and embankment safety distances, active-channel exclusions and no-mining zones shall prevail.</p>
  <div class="footer"><span>${safe(survey.blockName, "Mining block")}</span><span>Page 4</span></div>
</div>

<div class="page">
  <div class="running"><span>Chapter 2</span><span>Survey Methodology</span></div>
  <h2>2. Survey Methodology</h2>
  <h3>2.1 Survey Design</h3>
  <p>A common survey boundary and coordinate reference system shall be used for both survey epochs. Permanent benchmarks shall be fixed outside disturbance-prone areas and validated against an authenticated reduced level. Grid points and cross-sections must adequately represent the mineable river-bed surface.</p>
  <h3>2.2 Field and Processing Workflow</h3>
  <ol><li>Reconnaissance, boundary verification and benchmark establishment.</li><li>Pre-monsoon acquisition of DGPS/drone elevations and cross-sections.</li><li>Post-monsoon acquisition using the same control network and grid.</li><li>Generation of orthomosaic, DEM/DSM and cleaned terrain surfaces.</li><li>Grid-wise comparison, exclusion of ineligible areas and volume computation.</li><li>Independent quality review of coordinates, elevations and quantity tables.</li></ol>
  <h3>2.3 Equipment and Deliverables</h3>
  <div class="checklist">
    <div class="check">${survey.dgps ? "[Included]" : "[Required]"} DGPS base/rover observations</div>
    <div class="check">${survey.drone ? "[Included]" : "[Required]"} Geo-tagged drone imagery</div>
    <div class="check">${survey.demDsm ? "[Included]" : "[Required]"} DEM/DSM terrain model</div>
    <div class="check">${survey.orthomosaic ? "[Included]" : "[Required]"} Orthomosaic and grid map</div>
    <div class="check">${survey.crossSections ? "[Included]" : "[Required]"} Pre/post cross-sections</div>
    <div class="check">[Required] Bulk density laboratory report</div>
  </div>
  <h3>2.4 Quality Assurance</h3>
  <p>Outliers, water-covered cells, restricted zones and disturbed surfaces shall be identified before calculation. Survey accuracy, coordinate reference, instrument calibration and benchmark closure must be recorded. The final quantity table shall remain traceable to grid/cross-section source data.</p>
  <div class="notice"><strong>Current survey record:</strong> Survey date ${safe(survey.surveyDate)}; pre-monsoon ${safe(survey.preMonsoonDate)}; post-monsoon ${safe(survey.postMonsoonDate)}; photographs ${safe(survey.photos)}.</div>
  <div class="footer"><span>Scientific survey and QA/QC</span><span>Page 5</span></div>
</div>

<div class="page">
  <div class="running"><span>Chapter 3</span><span>Calculation and Results</span></div>
  <h2>3. Replenishment Calculation</h2>
  <h3>3.1 Survey Observation Summary</h3>
  <table>
    <tr><th>Parameter</th><th>Pre-monsoon</th><th>Post-monsoon</th><th>Difference / Basis</th></tr>
    <tr><td>Survey date</td><td>${safe(survey.preMonsoonDate)}</td><td>${safe(survey.postMonsoonDate)}</td><td>Comparable survey epochs</td></tr>
    <tr><td>Average eligible elevation (m)</td><td>${safe(survey.preMonsoonElevation)}</td><td>${safe(survey.postMonsoonElevation)}</td><td>${formattedNumber(elevationDifference, 3)} m</td></tr>
    <tr><td>Eligible grid area</td><td colspan="2">${safe(survey.gridArea)} sq. m</td><td>After statutory exclusions</td></tr>
    <tr><td>Bulk density</td><td colspan="2">${safe(survey.bulkDensity)} t/cu. m</td><td>Laboratory value required</td></tr>
  </table>
  <h3>3.2 Formula</h3>
  <div class="formula">Replenished volume = Eligible grid area x Average positive elevation difference</div>
  <div class="formula">Replenished quantity = Replenished volume x Verified bulk density</div>
  <h3>3.3 Auto-calculated Result</h3>
  <table>
    <tr><th>Eligible grid area</th><td>${formattedNumber(gridArea)} sq. m</td></tr>
    <tr><th>Average elevation difference</th><td>${formattedNumber(elevationDifference, 3)} m</td></tr>
    <tr><th>Replenished volume</th><td>${formattedNumber(replenishedVolume)} cu. m</td></tr>
    <tr><th>Bulk density</th><td>${formattedNumber(bulkDensity, 3)} t/cu. m</td></tr>
    <tr><th>Replenished quantity</th><td><strong>${formattedNumber(replenishedQuantity)} metric tonnes</strong></td></tr>
    <tr><th>Recorded extraction</th><td>${formattedNumber(extractedQuantity)} metric tonnes</td></tr>
    <tr><th>Net available after recorded extraction</th><td>${formattedNumber(netAvailableQuantity)} metric tonnes</td></tr>
    <tr><th>Replenishment against approved annual quantity</th><td>${formattedNumber(replenishmentPercentage)}%</td></tr>
  </table>
  <div class="result"><strong>${safe(calculationStatus)}</strong><br>Scientifically supportable quantity is subject to verified source data, statutory exclusions and competent-authority approval.</div>
  <div class="footer"><span>Auto-calculation from entered survey values</span><span>Page 6</span></div>
</div>

<div class="page">
  <div class="running"><span>Chapter 4</span><span>Findings and Recommendations</span></div>
  <h2>4. Findings, Conclusion and Recommendations</h2>
  <h3>4.1 Findings</h3>
  <ul><li>The assessed eligible area is ${formattedNumber(gridArea)} sq. m with an average survey elevation difference of ${formattedNumber(elevationDifference, 3)} m.</li><li>The computed replenished volume is ${formattedNumber(replenishedVolume)} cu. m and the corresponding quantity is ${formattedNumber(replenishedQuantity)} metric tonnes at a bulk density of ${formattedNumber(bulkDensity, 3)} t/cu. m.</li><li>The computed replenishment is ${formattedNumber(replenishmentPercentage)}% of the entered approved annual quantity.</li></ul>
  <h3>4.2 Conclusion</h3>
  <p>Based on the entered pre-monsoon and post-monsoon survey parameters, the estimated replenished quantity is <strong>${formattedNumber(replenishedQuantity)} metric tonnes</strong>. This value is a calculation output and shall be adopted only after verification of survey grids, benchmarks, bulk density, restricted areas and the competent authority's approval.</p>
  <h3>4.3 Recommendations</h3>
  <ol><li>Permit extraction only up to the lower of verified replenished quantity, approved mineable quantity and statutory limit.</li><li>Exclude active water channels, safety barriers, bridge influence zones, embankments and ecologically sensitive areas.</li><li>Maintain benchmark pillars and repeat surveys using the same datum, grid and cross-sections.</li><li>Reconcile dispatch/extraction records with replenishment before the next mining cycle.</li><li>Continue annual pre-monsoon and post-monsoon monitoring to establish a reliable deposition trend.</li></ol>
  <h3>4.4 Officer Review Note</h3>
  <div class="notice">The green flag on this template confirms report-format completeness only. It does not constitute environmental clearance, mining permission or administrative approval.</div>
  <div class="signature"><div>Technical Reviewer</div><div>District Level Committee</div></div>
  <div class="footer"><span>Conclusion subject to verification</span><span>Page 7</span></div>
</div>

<div class="page">
  <div class="running"><span>Annexures</span><span>Evidence Register</span></div>
  <h2>5. Annexure and Evidence Checklist</h2>
  <table><tr><th>Reference</th><th>Document / Evidence</th><th>Status</th></tr>${annexures}</table>
  <h3>Dynamic Outputs Selected for Regeneration</h3>
  <table>${workflow.dynamicRegeneration.map((item, index) => `<tr><td>${index + 1}</td><td>${safe(item)}</td><td>Regenerate from current survey</td></tr>`).join("")}</table>
  <h3>Final Submission Checklist</h3>
  <div class="checklist"><div class="check">[ ] Coordinates and lease boundary verified</div><div class="check">[ ] Benchmarks and datum authenticated</div><div class="check">[ ] Pre/post grids use identical extent</div><div class="check">[ ] Restricted zones excluded</div><div class="check">[ ] Bulk density report attached</div><div class="check">[ ] Quantity table independently checked</div><div class="check">[ ] Maps and cross-sections signed</div><div class="check">[ ] Competent authority approval recorded</div></div>
  <div class="result"><strong>GENERIC REPLENISHMENT REPORT FORMAT READY</strong><br>Complete project-specific evidence and signatures before official issue.</div>
  <div class="footer"><span>DSR Portal | Government of Punjab</span><span>Page 8</span></div>
</div>
</body>
</html>`;
}

export default function ReplenishmentBuilderPage() {
  const { projectId } = useParams();
  const [study, setStudy] = useState<ReplenishmentStudy | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState>(defaultWorkflow);
  const [survey, setSurvey] = useState<SurveyUpdate>(defaultSurvey);
  const [originalPdf, setOriginalPdf] = useState<{ name: string; url: string; size: number; serverKey?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [importingDsr, setImportingDsr] = useState(false);

  const loadStudy = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const studies = await replenishmentApi.list(projectId);
      const existing = studies.find((item) => item.reportState?.type === defaultWorkflow.type) || studies[0];
      const active = existing || await replenishmentApi.create(projectId, {
        title: "Enterprise Replenishment Report",
        reportState: defaultWorkflow,
        surveyData: defaultSurvey,
      });
      setStudy(active);
      setWorkflow({ ...defaultWorkflow, ...(active.reportState as Partial<WorkflowState>) });
      setSurvey({ ...defaultSurvey, ...(active.surveyData as Partial<SurveyUpdate>) });
    } catch {
      toast.error("Replenishment workflow load nahi ho paya");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStudy();
  }, [loadStudy]);

  const summary = useMemo(() => ({
    imported: workflow.contentItems.filter((item) => item.status === "Imported").length,
    updated: workflow.contentItems.filter((item) => item.status === "Updated").length,
    pending: workflow.contentItems.filter((item) => item.status === "Pending" || item.status === "Fresh Survey Required").length,
  }), [workflow.contentItems]);

  const calculation = useMemo(() => {
    const gridArea = numericValue(survey.gridArea);
    const elevationDifference = Math.abs(numericValue(survey.postMonsoonElevation) - numericValue(survey.preMonsoonElevation));
    const volume = gridArea * elevationDifference;
    const quantity = volume * numericValue(survey.bulkDensity);
    const approved = numericValue(survey.approvedAnnualQuantity);
    return { elevationDifference, volume, quantity, percentage: approved > 0 ? quantity / approved * 100 : 0 };
  }, [survey]);

  const persist = async () => {
    if (!study) return;
    setSaving(true);
    try {
      const nextState = { ...workflow, importSummary: summary, lastSavedAt: new Date().toISOString() };
      const saved = await replenishmentApi.update(study.id, {
        reportState: nextState,
        surveyData: survey,
      });
      setStudy(saved);
      setWorkflow({ ...defaultWorkflow, ...(saved.reportState as Partial<WorkflowState>) });
      setSurvey({ ...defaultSurvey, ...(saved.surveyData as Partial<SurveyUpdate>) });
      toast.success("Replenishment workflow database me save ho gaya");
    } catch {
      toast.error("Save failed - database connection/API check karo");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (id: string, patch: Partial<ContentItem>) => {
    setWorkflow((current) => ({
      ...current,
      contentItems: current.contentItems.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  };

  const updateWorkflowMeta = (key: "district" | "river" | "year" | "version", value: string) => {
    setWorkflow((current) => ({ ...current, [key]: key === "version" ? Number(value) || 1 : value }));
  };

  const updateSurveyField = (key: keyof SurveyUpdate, value: string | boolean) => {
    setSurvey((current) => ({ ...current, [key]: value }));
  };

  const livePreviewHtml = useMemo(
    () => buildReplenishmentPreviewHtml(study, { ...workflow, importSummary: summary }, survey),
    [study, workflow, summary, survey],
  );

  const exportHtml = () => livePreviewHtml;

  const handleDownloadGeneratedPdf = async () => {
    const fileName = fileNameFor(workflow, "pdf");
    toast.info("Generating PDF, please wait...");
    try {
      await downloadHtmlAsPdf(exportHtml(), fileName, false);
      if (study) recordHistory(study.id, workflow, fileName, 0, "generated-pdf");
      toast.success("Generated PDF downloaded");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadDraft = () => {
    if (!study) return;
    const fileName = fileNameFor(workflow, "json");
    const size = exportDraftJson({ study, workflow: { ...workflow, importSummary: summary }, survey }, fileName);
    recordHistory(study.id, workflow, fileName, size, "draft-json");
    toast.success("Draft JSON downloaded");
  };

  const handleExportDocx = () => {
    if (!study) return;
    const fileName = fileNameFor(workflow, "docx");
    const size = exportWordDocument(exportHtml(), fileName);
    recordHistory(study.id, workflow, fileName, size, "docx");
    toast.success("Editable DOCX downloaded");
  };

  const handlePrint = () => {
    if (!study) return;
    openPrintableDocument(exportHtml(), study.title);
    recordHistory(study.id, workflow, fileNameFor(workflow, "pdf"), 0, "print");
  };

  const handleOriginalPdfSelect = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Original official file PDF hona chahiye");
      return;
    }
    if (!study) {
      toast.error("Please wait for study to load");
      return;
    }
    try {
      const result = await replenishmentApi.uploadFile(study.id, "original_pdf", file);
      if (originalPdf?.url) URL.revokeObjectURL(originalPdf.url);
      setOriginalPdf({ name: file.name, url: URL.createObjectURL(file), size: file.size, serverKey: result.objectKey });
      toast.success("Original PDF uploaded successfully");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleCrossSectionUpload = async (file: File | undefined) => {
    if (!file || !study) return;
    try {
      await replenishmentApi.uploadFile(study.id, "cross_section", file);
      toast.success("Cross section data uploaded successfully");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleExecuteImport = async () => {
    if (!study) return;
    setImportingDsr(true);
    try {
      await replenishmentApi.fetchFinalDsr(study.id);
      toast.success("Final DSR data imported successfully");
      loadStudy(); // Reload to get updated inherited state
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Import failed");
    } finally {
      setImportingDsr(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!study) return;
    setGeneratingAi(true);
    try {
      const result = await replenishmentApi.generateAi(study.id, "general");
      setWorkflow((current) => ({
        ...current,
        suggestions: [{ title: "AI Generated Insight", detail: result.generatedText, kind: "dynamic" }, ...current.suggestions]
      }));
      toast.success("AI insights generated successfully");
    } catch {
      toast.error("AI Generation failed");
    } finally {
      setGeneratingAi(false);
    }
  };

  const WORKFLOW_STAGES = [
    "DRAFT", "SURVEY_OFFICER_APPROVED", "GIS_EXPERT_APPROVED", 
    "GEOLOGIST_APPROVED", "DISTRICT_OFFICER_APPROVED", "REVIEWER_APPROVED", 
    "DISTRICT_ADMIN_APPROVED", "STATE_ADMIN_APPROVED", "FINAL_REPORT_GENERATED"
  ];

  const handleWorkflowAdvance = async () => {
    if (!study) return;
    const currentIndex = WORKFLOW_STAGES.indexOf(study.approvalState || "DRAFT");
    const nextState = WORKFLOW_STAGES[currentIndex + 1];
    if (!nextState) {
      toast.success("Workflow already complete!");
      return;
    }
    try {
      await replenishmentApi.workflow(study.id, { action: nextState });
      toast.success(`Workflow advanced to ${nextState}`);
      loadStudy(); // Reload to get new status
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Workflow advancement failed");
    }
  };

  const handleDownloadOriginalPdf = () => {
    if (!study || !originalPdf) {
      toast.error("Pehle official Replenishment PDF upload karo");
      return;
    }
    fetch(originalPdf.url)
      .then((response) => response.blob())
      .then((blob) => {
        downloadBlob(blob, originalPdf.name);
        recordHistory(study.id, workflow, originalPdf.name, blob.size || originalPdf.size, "original-pdf");
      })
      .catch(() => toast.error("Original PDF download nahi ho paya"));
  };

  const downloadHistory = study ? loadDownloadHistory(study.id).slice(0, 4) : [];

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading replenishment workflow...</div>;
  }

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title="Enterprise Replenishment Report"
        description="Approved Final DSR se smart import, selective reuse, survey updates aur dynamic regeneration - sab database me persisted."
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <label className="module-btn cursor-pointer">
              <Upload size={17}/>Upload Original PDF
              <input type="file" accept="application/pdf" hidden onChange={(event) => handleOriginalPdfSelect(event.target.files?.[0])} />
            </label>
            <button className="module-btn" onClick={handleDownloadOriginalPdf}><FileText size={17}/>Download Original PDF</button>
            <button className="module-btn-primary" onClick={handleDownloadGeneratedPdf}><Download size={17}/>Download Generated PDF</button>
            <button className="module-btn" onClick={handleDownloadDraft}><FileJson size={17}/>Download Draft (.json)</button>
            <button className="module-btn" onClick={handleExportDocx}><FileText size={17}/>Export DOCX</button>
            <button className="module-btn" onClick={handlePrint}><Printer size={17}/>Print</button>
            <button className="module-btn-primary" onClick={persist} disabled={saving || !study}><Save size={17}/>{saving ? "Saving..." : "Save to Database"}</button>
          </div>
        }
      />

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {([
            ["district", "District"],
            ["river", "River"],
            ["year", "Year"],
            ["version", "Version"],
          ] as const).map(([key, label]) => (
            <label key={key} className="text-xs font-bold uppercase text-slate-500">
              {label}
              <input
                value={String(workflow[key] || (key === "version" ? 1 : ""))}
                onChange={(event) => updateWorkflowMeta(key, event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold normal-case text-slate-700 outline-none focus:border-blue-500"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {originalPdf && <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Original: {originalPdf.name}</span>}
          {downloadHistory.map((item) => (
            <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1">
              {item.fileName} | v{item.version} | {Math.ceil(item.fileSize / 1024)} KB | {item.downloadCount}x | {item.generatedBy}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-5 border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-bold text-slate-900">Generic Report Particulars</h2>
            <p className="text-sm text-slate-500">Project identity, survey epochs and scientific calculation values.</p>
          </div>
          <span className="rounded bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-700 ring-1 ring-emerald-200">
            Format Validated - Green Flag
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {([
            ["projectName", "Project Name", "text"],
            ["blockName", "Mining Block", "text"],
            ["village", "Village / Site", "text"],
            ["mineral", "Mineral", "text"],
            ["applicant", "Applicant", "text"],
            ["preparedBy", "Prepared By", "text"],
            ["leaseArea", "Lease Area (ha)", "number"],
            ["mineableArea", "Mineable Area (ha)", "number"],
            ["approvedAnnualQuantity", "Approved Quantity (MT)", "number"],
            ["preMonsoonDate", "Pre-monsoon Survey", "date"],
            ["postMonsoonDate", "Post-monsoon Survey", "date"],
            ["gridArea", "Eligible Grid Area (sq. m)", "number"],
            ["preMonsoonElevation", "Pre-monsoon Avg. RL (m)", "number"],
            ["postMonsoonElevation", "Post-monsoon Avg. RL (m)", "number"],
            ["bulkDensity", "Bulk Density (t/cu. m)", "number"],
            ["extractedQuantity", "Recorded Extraction (MT)", "number"],
          ] as [keyof SurveyUpdate, string, string][]).map(([key, label, type]) => (
            <label key={key} className="text-xs font-bold uppercase text-slate-500">
              {label}
              <input
                value={String(survey[key] || "")}
                type={type}
                min={type === "number" ? "0" : undefined}
                step={type === "number" ? "any" : undefined}
                onChange={(event) => updateSurveyField(key, event.target.value)}
                className="mt-1 w-full border border-slate-200 px-3 py-2 text-sm font-semibold normal-case text-slate-700 outline-none focus:border-blue-500"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Elevation Difference", `${formattedNumber(calculation.elevationDifference, 3)} m`],
            ["Replenished Volume", `${formattedNumber(calculation.volume)} cu. m`],
            ["Replenished Quantity", `${formattedNumber(calculation.quantity)} MT`],
            ["Against Approved Qty.", `${formattedNumber(calculation.percentage)}%`],
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Progress Bar */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Current Workflow Stage</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${study?.approvalState === 'FINAL_REPORT_GENERATED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {study?.approvalState?.replace(/_/g, ' ') || "DRAFT"}
            </span>
            {study?.status === 'APPROVED' && <span className="text-green-600 font-bold ml-2">✓ GREEN FLAG - FULLY APPROVED</span>}
          </div>
        </div>
        <div>
          <button 
            onClick={handleWorkflowAdvance} 
            disabled={study?.approvalState === 'FINAL_REPORT_GENERATED'}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Advance Workflow Stage <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Metric icon={FileStack} label="Study" value={study?.title || "Draft"} />
        <Metric icon={CheckCircle2} label="Imported" value={String(summary.imported)} />
        <Metric icon={RefreshCw} label="Updated" value={String(summary.updated)} />
        <Metric icon={Lock} label="Pending/Fresh Survey" value={String(summary.pending)} />
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Import Setup" icon={Archive} description="Final DSR read-only source rahega; Replenishment report usse imported working copy banata hai.">
          <div className="grid gap-3 md:grid-cols-3">
            {(["smart", "selective", "fresh"] as ImportMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkflow((current) => ({ ...current, importMode: mode }))}
                className={`rounded-2xl border p-4 text-left transition ${workflow.importMode === mode ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:border-blue-300"}`}
              >
                <p className="font-semibold capitalize">{mode === "smart" ? "Smart Import" : mode === "selective" ? "Selective Import" : "Fresh Report"}</p>
                <p className="mt-1 text-sm text-slate-500">{mode === "smart" ? "Auto-detect reusable and outdated DSR content." : mode === "selective" ? "Choose chapters/resources one by one." : "Start clean but still linked to project DB."}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {resourceOptions.map((resource) => (
              <label key={resource} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={workflow.selectedResources.includes(resource)}
                  onChange={(event) => setWorkflow((current) => ({
                    ...current,
                    selectedResources: event.target.checked
                      ? [...current.selectedResources, resource]
                      : current.selectedResources.filter((item) => item !== resource),
                  }))}
                />
                {resource}
              </label>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <button 
              onClick={handleExecuteImport}
              disabled={importingDsr}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {importingDsr ? "Importing Data..." : "Execute DSR Import"}
            </button>
          </div>
        </Panel>

        <Panel title="AI Smart Suggestions" icon={Bot} description="Static vs dynamic detection summary.">
          <div className="mb-3">
            <button 
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
            >
              <Sparkles size={16} /> {generatingAi ? "Generating AI Insights..." : "Generate AI Insights"}
            </button>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {workflow.suggestions.map((suggestion) => (
              <div key={suggestion.title} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">{suggestion.title}</p>
                <p className="text-sm text-slate-600">{suggestion.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="DSR Content Manager" icon={FolderTree} description="Each imported item can be previewed, copied, replaced, merged, referenced or skipped.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-3">Group</th><th>Name</th><th>Status</th><th>Action</th><th>Tools</th></tr>
              </thead>
              <tbody>
                {workflow.contentItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-3 font-semibold">{item.group}</td>
                    <td className="pr-3 text-slate-600">{item.name}</td>
                    <td className="pr-3"><StatusBadge status={item.status} /></td>
                    <td className="pr-3">
                      <select value={item.action} onChange={(event) => updateItem(item.id, { action: event.target.value as ContentAction })} className="rounded-lg border border-slate-200 px-2 py-1">
                        {["Preview", "Copy", "Replace", "Merge", "Reference", "Skip"].map((action) => <option key={action}>{action}</option>)}
                      </select>
                    </td>
                    <td className="flex gap-2 py-3">
                      {[Eye, Copy, Replace, Merge].map((Icon, index) => <button key={index} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Icon size={15}/></button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Survey Update Section" icon={ClipboardCheck} description="Sirf new/changing survey data yahan capture hota hai.">
          <div className="grid gap-3">
            {(["surveyYear", "surveyDate", "rainfall", "waterLevel", "riverWidthDepth", "sediment", "photos"] as (keyof SurveyUpdate)[]).map((field) => (
              <label key={field} className="text-sm font-medium text-slate-700">
                {labelize(field)}
                <input
                  value={String(survey[field] || "")}
                  type={field === "surveyDate" ? "date" : "text"}
                  onChange={(event) => setSurvey((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            ))}
            <div className="grid grid-cols-2 gap-2">
              {(["dgps", "drone", "demDsm", "orthomosaic", "crossSections"] as (keyof SurveyUpdate)[]).map((field) => (
                <label key={field} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={Boolean(survey[field])} onChange={(event) => setSurvey((current) => ({ ...current, [field]: event.target.checked }))} />
                  {labelize(field)}
                </label>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-2">
        <Panel title="Cross Section Manager" icon={GitCompare} description="Previous graph, updated Excel, overlay compare and regenerate flow.">
          <div className="space-y-3">
            {workflow.crossSections.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-semibold">{row.chainage}</p><p className="text-sm text-slate-500">{row.previous} {"->"} {row.updated}</p></div>
                  <select value={row.action} onChange={(event) => setWorkflow((current) => ({ ...current, crossSections: current.crossSections.map((item) => item.id === row.id ? { ...item, action: event.target.value as CrossSectionRow["action"] } : item) }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    {["Copy previous", "Replace graph", "Upload updated", "Overlay compare"].map((action) => <option key={action}>{action}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload size={16}/> Upload updated Excel / graph
              <input type="file" accept=".xls,.xlsx,.png,.jpg,.jpeg" hidden onChange={(e) => handleCrossSectionUpload(e.target.files?.[0])} />
            </label>
          </div>
        </Panel>

        <Panel title="Dynamic Regeneration Queue" icon={Layers3} description="Only changing calculations and report sections regenerate automatically.">
          <div className="grid gap-2 md:grid-cols-2">
            {dynamicOutputs.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={workflow.dynamicRegeneration.includes(item)}
                  onChange={(event) => setWorkflow((current) => ({
                    ...current,
                    dynamicRegeneration: event.target.checked
                      ? [...current.dynamicRegeneration, item]
                      : current.dynamicRegeneration.filter((entry) => entry !== item),
                  }))}
                />
                {item}
              </label>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Preview Mode" icon={Map} description="Side-by-side review: Existing Final DSR, Imported Replenishment, Updated Replenishment.">
        <div className="grid gap-4 lg:grid-cols-3">
          {["Existing Final DSR", "Imported Replenishment Report", "Updated Replenishment Report"].map((title, index) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold">{title}</p>
              <p className="mt-2 text-sm text-slate-600">{workflow.previewNotes[index]}</p>
              <div className="mt-4 rounded-xl bg-white p-3 text-xs text-slate-500">{index === 0 ? "Read-only approved content" : index === 1 ? `${workflow.selectedResources.length} resource groups imported` : `${workflow.dynamicRegeneration.length} dynamic outputs selected`}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5">
        <Panel title="Live Replenishment Preview" icon={Eye} description="Database draft ka current printable report preview. Har form change yahan turant update hota hai.">
          <div className="mb-3 flex justify-end">
            <button className="module-btn-primary" onClick={handleDownloadGeneratedPdf}>
              <Download size={17}/>Download This Preview PDF
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-200">
            <iframe
              title="Live replenishment report preview"
              srcDoc={livePreviewHtml}
              className="block h-[calc(100vh-120px)] min-h-[920px] w-full bg-white"
            />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon size={18}/></div><div><h2 className="font-bold">{title}</h2><p className="text-sm text-slate-500">{description}</p></div></div>{children}</section>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-slate-500"><Icon size={16}/>{label}</div><p className="mt-2 truncate text-xl font-bold">{value}</p></div>;
}

function StatusBadge({ status }: { status: ContentItem["status"] }) {
  const tone = status === "Imported" ? "bg-green-50 text-green-700" : status === "Updated" ? "bg-blue-50 text-blue-700" : status === "Fresh Survey Required" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
