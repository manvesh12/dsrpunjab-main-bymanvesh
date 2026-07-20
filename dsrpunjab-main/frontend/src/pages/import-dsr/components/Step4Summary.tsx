import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileCheck, AlertTriangle, ArrowRight, Loader2, Eye, Save, RotateCcw } from "lucide-react";
import { splitPdfRange, type ParsedDsrResults } from "../../../utils/dsrParser";
import { projectsApi } from "../../../api/projects.api";
import { uploadsApi } from "../../../api/uploads.api";
import { toast } from "sonner";
import { set, del } from "idb-keyval";

interface Step4SummaryProps {
  file: File;
  parsedResults: ParsedDsrResults;
  onCancel: () => void;
  draftData?: {
    projectForm: any;
    coverPages: any;
    chaptersRanges: any;
    platesPages: any;
  };
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

export default function Step4Summary({ file, parsedResults, onCancel, draftData }: Step4SummaryProps) {
  const navigate = useNavigate();

  // Create local Object URL for the file to render in the iframe
  const [objectUrl] = useState(() => URL.createObjectURL(file));

  // Revoke object URL on unmount to free memory
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Project Details Form State
  const [projectForm, setProjectForm] = useState(() => draftData ? draftData.projectForm : {
    projectName: `District Survey Report - ${parsedResults.detectedDistrict || "Jalandhar"}`,
    district: parsedResults.detectedDistrict || "Jalandhar",
    year: "2025-26",
    mineral: "Sand",
    rivers: "",
    preparedBy: `Sub-Divisional Committee, ${parsedResults.detectedDistrict || "Jalandhar"}`,
  });

  // Page Ranges State
  const [coverPages, setCoverPages] = useState(() => draftData ? draftData.coverPages : {
    start: parsedResults.pageRanges.cover.start,
    end: parsedResults.pageRanges.cover.end
  });

  const [chaptersRanges, setChaptersRanges] = useState(() => draftData ? draftData.chaptersRanges :
    initialChapters.map((ch, idx) => ({
      ...ch,
      start: parsedResults.pageRanges.chapters[idx]?.start || 2,
      end: parsedResults.pageRanges.chapters[idx]?.end || 10
    }))
  );

  const [platesPages, setPlatesPages] = useState(() => draftData ? draftData.platesPages : {
    start: parsedResults.pageRanges.plates.start,
    end: parsedResults.pageRanges.plates.end
  });

  // PDF Preview State
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>("1");

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

  // Jump preview iframe to a specific page
  const jumpToPage = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= parsedResults.totalPages) {
      setPreviewPage(pageNum);
      setInputPage(String(pageNum));
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(inputPage, 10);
    if (pageNum > 0 && pageNum <= parsedResults.totalPages) {
      setPreviewPage(pageNum);
    } else {
      setInputPage(String(previewPage));
      toast.error(`Please enter a page between 1 and ${parsedResults.totalPages}`);
    }
  };

  // Local Storage / IndexedDB Draft Save
  const saveImportDraft = async () => {
    try {
      await set("dsr-import-draft", {
        projectForm,
        coverPages,
        chaptersRanges,
        platesPages,
        fileBlob: file, // Serializes file directly
        fileName: file.name,
        fileType: file.type,
        totalPages: parsedResults.totalPages,
        savedAt: new Date().toISOString()
      });
      toast.success("Import configuration saved as draft successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save draft locally. Please check storage permissions.");
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
      
      // Delete draft upon completion
      await del("dsr-import-draft").catch(() => undefined);
      
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Configure and Confirm DSR Import</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Total Pages detected: <span className="font-semibold text-blue-600 dark:text-blue-400">{parsedResults.totalPages}</span> • File: {file.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel} 
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button 
            onClick={saveImportDraft} 
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Save size={16} />
            Save Draft
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] overflow-hidden">
        {/* Left Side: Configuration & Form (Scrollable) */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
          {/* Project Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800 mb-4">
              Project Details
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">District</label>
                <select
                  name="district"
                  value={projectForm.district}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {DISTRICTS.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  name="projectName"
                  value={projectForm.projectName}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</label>
                <input
                  type="text"
                  name="year"
                  value={projectForm.year}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Mineral</label>
                <input
                  type="text"
                  name="mineral"
                  value={projectForm.mineral}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Rivers</label>
                <input
                  type="text"
                  name="rivers"
                  value={projectForm.rivers}
                  onChange={handleFormChange}
                  placeholder="e.g. Sutlej River"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Section Ranges Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800 mb-4 flex justify-between items-center">
              <span>Section Page Boundaries</span>
              <span className="text-xs text-slate-500">Edit values and check via preview</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2.5 pr-4">Section</th>
                    <th className="py-2.5 px-4 w-24">Start Page</th>
                    <th className="py-2.5 px-4 w-24">End Page</th>
                    <th className="py-2.5 pl-4 w-16 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Cover Page */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 pr-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Cover Page
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={coverPages.start}
                        onChange={e => handleRangeChange("cover", 0, "start", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={coverPages.end}
                        onChange={e => handleRangeChange("cover", 0, "end", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 pl-4 text-center">
                      <button
                        onClick={() => jumpToPage(coverPages.start)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 dark:hover:bg-slate-800"
                        title="Jump preview to start page"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* Chapters */}
                  {chaptersRanges.map((ch, idx) => (
                    <tr key={ch.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200 pl-4 truncate max-w-[200px]" title={ch.name}>
                        {ch.name}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={ch.start}
                          onChange={e => handleRangeChange("chapter", idx, "start", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={ch.end}
                          onChange={e => handleRangeChange("chapter", idx, "end", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </td>
                      <td className="py-2 pl-4 text-center">
                        <button
                          onClick={() => jumpToPage(ch.start)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 dark:hover:bg-slate-800"
                          title="Jump preview to start page"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Plates & Maps */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 pr-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Plates & Maps
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={platesPages.start}
                        onChange={e => handleRangeChange("plates", 0, "start", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={platesPages.end}
                        onChange={e => handleRangeChange("plates", 0, "end", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-xs dark:border-slate-700 dark:bg-slate-950"
                      />
                    </td>
                    <td className="py-2 pl-4 text-center">
                      <button
                        onClick={() => jumpToPage(platesPages.start)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 dark:hover:bg-slate-800"
                        title="Jump preview to start page"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={executeSplitAndImport}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Split & Create Project
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live PDF Viewer Panel */}
        <div className="w-full lg:w-1/2 flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm h-full">
          {/* PDF Viewer Header/Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Document Preview
            </span>
            
            {/* Page Jump Form */}
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Page</span>
              <input
                type="text"
                value={inputPage}
                onChange={e => setInputPage(e.target.value)}
                className="w-12 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 py-0.5 text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-slate-500">of {parsedResults.totalPages}</span>
              <button
                type="submit"
                className="rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                Go
              </button>
            </form>
          </div>

          {/* PDF Container (Uses Key Trick to reload iframe strictly) */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative h-full">
            <iframe
              key={previewPage}
              src={`${objectUrl}#page=${previewPage}&toolbar=0&navpanes=0`}
              className="w-full h-full border-none"
              title="DSR Document Preview"
            />
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
