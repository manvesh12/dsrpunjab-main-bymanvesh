import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, FileCheck, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { splitPdfRange, type ParsedDsrResults } from "../../../utils/dsrParser";
import { projectsApi } from "../../../api/projects.api";
import { uploadsApi } from "../../../api/uploads.api";
import { toast } from "sonner";

interface Step4SummaryProps {
  file: File;
  parsedResults: ParsedDsrResults;
  onCancel: () => void;
}

const DISTRICTS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
  "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
  "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga",
  "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar",
  "Sangrur", "Shaheed Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"
];

const initialChapters = [
  { name: "CHAPTER 1 - INTRODUCTION", summary: "Overview of the district and purpose of the DSR under EMGSM 2020 guidelines." },
  { name: "CHAPTER 2 - OVERVIEW OF MINING ACTIVITIES IN THE DISTRICT", summary: "Current and historical sand mining activities, lease details, and district statistics." },
  { name: "CHAPTER 3 - PROCESS OF DEPOSITION OF SEDIMENTS", summary: "River morphology, sedimentation rates, and annual replenishment estimates." },
  { name: "CHAPTER 4 - GENERAL PROFILE OF THE DISTRICT", summary: "Geographic, demographic, and administrative profile of the district." },
  { name: "CHAPTER 5 - PHYSIOGRAPHY OF THE DISTRICT", summary: "Terrain, drainage patterns, river systems, and physical features." },
  { name: "CHAPTER 6 - GEOLOGY AND MINERAL WEALTH", summary: "Geological formations, mineral deposits, and subsurface characteristics." },
  { name: "CHAPTER 7 - ESTIMATION OF DEPOSITS AND REPLENISHMENT STUDIES", summary: "Scientific estimation of available sand deposits and annual natural replenishment." },
  { name: "CHAPTER 8 - TRANSPORT", summary: "Transportation infrastructure, road conditions, and logistics for mining operations." },
  { name: "CHAPTER 9 - REMEDIAL MEASURE TO MITIGATE", summary: "Environmental safeguards, monitoring mechanisms, and impact mitigation plans." },
  { name: "CHAPTER 10 - CONCLUSION", summary: "Summary findings, recommendations, and compliance declarations." }
];

export default function Step4Summary({ file, parsedResults, onCancel }: Step4SummaryProps) {
  const navigate = useNavigate();

  // Project Details Form State
  const [projectForm, setProjectForm] = useState({
    projectName: `District Survey Report - ${parsedResults.detectedDistrict || "Jalandhar"}`,
    district: parsedResults.detectedDistrict || "Jalandhar",
    year: "2025-26",
    mineral: "Sand",
    rivers: "",
    preparedBy: `Sub-Divisional Committee, ${parsedResults.detectedDistrict || "Jalandhar"}`,
  });

  // Page Ranges State
  const [coverPages, setCoverPages] = useState({
    start: parsedResults.pageRanges.cover.start,
    end: parsedResults.pageRanges.cover.end
  });

  const [chaptersRanges, setChaptersRanges] = useState(
    initialChapters.map((ch, idx) => ({
      ...ch,
      start: parsedResults.pageRanges.chapters[idx]?.start || 2,
      end: parsedResults.pageRanges.chapters[idx]?.end || 10
    }))
  );

  const [platesPages, setPlatesPages] = useState({
    start: parsedResults.pageRanges.plates.start,
    end: parsedResults.pageRanges.plates.end
  });

  // Processing Overlay State
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [importProgress, setImportProgress] = useState(0);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "district") {
        next.projectName = `District Survey Report - ${value}`;
        next.preparedBy = `Sub-Divisional Committee, ${value}`;
      }
      return next;
    });
  };

  const handleRangeChange = (
    type: "cover" | "plates" | "chapter",
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const pageNum = parseInt(value, 10) || 0;
    if (type === "cover") {
      setCoverPages(prev => ({ ...prev, [field]: pageNum }));
    } else if (type === "plates") {
      setPlatesPages(prev => ({ ...prev, [field]: pageNum }));
    } else if (type === "chapter") {
      setChaptersRanges(prev =>
        prev.map((ch, idx) => (idx === index ? { ...ch, [field]: pageNum } : ch))
      );
    }
  };

  const executeSplitAndImport = async () => {
    // Basic verification
    const allRanges = [coverPages, ...chaptersRanges, platesPages];
    const invalidRange = allRanges.find(r => r.start <= 0 || r.end < r.start || r.end > parsedResults.totalPages);
    if (invalidRange) {
      toast.error(`Invalid page range found. Pages must be between 1 and ${parsedResults.totalPages}`);
      return;
    }

    setIsImporting(true);
    setImportProgress(5);
    setImportStatus("Creating project in the database...");

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Step 1: Create Project
      const project = await projectsApi.create({
        projectName: projectForm.projectName,
        district: projectForm.district,
        year: projectForm.year,
        mineral: projectForm.mineral,
        rivers: projectForm.rivers || "Not specified",
        description: `Prepared by ${projectForm.preparedBy}`
      });

      const projectId = project.id;
      setImportProgress(20);

      // Step 2: Split and Upload Cover Page
      setImportStatus("Extracting and uploading cover page...");
      const coverBytes = await splitPdfRange(arrayBuffer, coverPages.start, coverPages.end);
      const coverFile = new File([coverBytes], "Cover.pdf", { type: "application/pdf" });
      const uploadedCover = await uploadsApi.upload(coverFile, projectId, "front-matter");
      setImportProgress(30);

      // Step 3: Split and Upload Chapters
      const uploadedChapters: Array<{ name: string; url: string }> = [];
      for (let i = 0; i < chaptersRanges.length; i++) {
        const ch = chaptersRanges[i];
        setImportStatus(`Extracting and uploading ${ch.name} (pages ${ch.start}-${ch.end})...`);
        const chBytes = await splitPdfRange(arrayBuffer, ch.start, ch.end);
        const chFile = new File([chBytes], `Chapter_${i + 1}.pdf`, { type: "application/pdf" });
        const uploadRes = await uploadsApi.upload(chFile, projectId, "chapters");
        uploadedChapters.push({ name: `Chapter_${i + 1}.pdf`, url: uploadRes.url });
        
        // Progress incremental from 30 to 80
        setImportProgress(30 + Math.floor(((i + 1) / chaptersRanges.length) * 50));
      }

      // Step 4: Split and Upload Plates
      setImportStatus("Extracting and uploading Plates section...");
      const platesBytes = await splitPdfRange(arrayBuffer, platesPages.start, platesPages.end);
      const platesFile = new File([platesBytes], "Plates.pdf", { type: "application/pdf" });
      const uploadedPlates = await uploadsApi.upload(platesFile, projectId, "plates");
      setImportProgress(90);

      // Step 5: Save State
      setImportStatus("Assembling project builder data structures...");
      const savedAt = new Date().toISOString();
      const projectStatePayload = {
        "front-matter": {
          data: {
            title: projectForm.projectName,
            district: projectForm.district,
            state: "Punjab",
            year: projectForm.year,
            version: "Final Draft",
            preparedBy: projectForm.preparedBy,
            assistedBy: "Assisted by RSP Green Development",
            preface: "This DSR has been successfully imported and split.",
            acknowledgement: "Imported via AI Document Parser."
          },
          coverFile: { name: uploadedCover.originalName, url: uploadedCover.url },
          certFile: null,
          contentFile: null,
          prefaceFile: null,
          savedAt
        },
        chapters: {
          chapters: chaptersRanges.map((ch, idx) => ({
            name: ch.name,
            summary: ch.summary,
            file: { name: uploadedChapters[idx].name, url: uploadedChapters[idx].url }
          })),
          savedAt
        },
        plates: {
          plates: [
            {
              name: "Plate 1 - Combined DSR Maps and Plates",
              summary: "Merged plates and maps from imported DSR PDF.",
              fileName: uploadedPlates.originalName,
              url: uploadedPlates.url
            }
          ],
          savedAt
        }
      };

      await projectsApi.updateState(projectId, { state: projectStatePayload });
      setImportProgress(100);
      setImportStatus("Success! Redirecting to your project builder...");

      toast.success("DSR Project created and split successfully!");
      
      setTimeout(() => {
        navigate(`/projects/${projectId}`);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to split and import project");
      setIsImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Title */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Configure and Confirm DSR Import</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Total Pages detected: <span className="font-semibold text-blue-600">{parsedResults.totalPages}</span> • File: {file.name}
          </p>
        </div>
        <button onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Cancel
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Hand side: Project Info Form */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
            Project Information
          </h3>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">District</label>
            <select
              name="district"
              value={projectForm.district}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            >
              {DISTRICTS.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Project / Report Title</label>
            <input
              type="text"
              name="projectName"
              value={projectForm.projectName}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Year</label>
            <input
              type="text"
              name="year"
              value={projectForm.year}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Mineral</label>
            <input
              type="text"
              name="mineral"
              value={projectForm.mineral}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Rivers</label>
            <input
              type="text"
              name="rivers"
              value={projectForm.rivers}
              onChange={handleFormChange}
              placeholder="e.g. Sutlej River"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Prepared By</label>
            <input
              type="text"
              name="preparedBy"
              value={projectForm.preparedBy}
              onChange={handleFormChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>

        {/* Right Hand side: Page Ranges Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800 mb-4 flex justify-between items-center">
            <span>Verify Section Page Ranges</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-full">
              Pages 1 to {parsedResults.totalPages}
            </span>
          </h3>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2.5 pr-4">Section</th>
                  <th className="py-2.5 px-4 w-28">Start Page</th>
                  <th className="py-2.5 px-4 w-28">End Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Cover Page */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Cover Page
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={coverPages.start}
                      onChange={e => handleRangeChange("cover", 0, "start", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={coverPages.end}
                      onChange={e => handleRangeChange("cover", 0, "end", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                  </td>
                </tr>

                {/* Chapters */}
                {chaptersRanges.map((ch, idx) => (
                  <tr key={ch.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200 pl-4">
                      {ch.name}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={ch.start}
                        onChange={e => handleRangeChange("chapter", idx, "start", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={ch.end}
                        onChange={e => handleRangeChange("chapter", idx, "end", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </td>
                  </tr>
                ))}

                {/* Plates & Maps */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Plates & Maps
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={platesPages.start}
                      onChange={e => handleRangeChange("plates", 0, "start", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={platesPages.end}
                      onChange={e => handleRangeChange("plates", 0, "end", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={executeSplitAndImport}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Split & Create Project
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Importing Loading Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Loader2 className="animate-spin" size={32} />
            </div>
            
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Importing DSR...</h3>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{importStatus}</p>

            <div className="relative mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <div className="text-right text-xs font-semibold text-blue-600 dark:text-blue-400">
              {importProgress}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
