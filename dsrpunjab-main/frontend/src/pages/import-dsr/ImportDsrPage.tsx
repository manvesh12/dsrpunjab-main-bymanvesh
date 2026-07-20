import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Step1Options from "./components/Step1Options";
import Step2Upload from "./components/Step2Upload";
import Step3Processing from "./components/Step3Processing";
import Step4Summary from "./components/Step4Summary";
import { type ParsedDsrResults } from "../../utils/dsrParser";
import { get, del } from "idb-keyval";
import { toast } from "sonner";

export default function ImportDsrPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedDsrResults | null>(null);
  
  // Local import draft state
  const [importDraft, setImportDraft] = useState<any | null>(null);

  // Check for local drafts on mount
  useEffect(() => {
    get("dsr-import-draft")
      .then((draft) => {
        if (draft) {
          setImportDraft(draft);
        }
      })
      .catch((err) => {
        console.error("Failed to load local DSR import draft:", err);
      });
  }, []);

  const handleSelectOption = (option: "upload" | "skip") => {
    if (option === "upload") {
      setCurrentStep(2);
    } else {
      navigate("/projects/create");
    }
  };

  const handleResumeDraft = () => {
    if (!importDraft) return;

    try {
      // Restore file and parsing results
      setFile(importDraft.fileBlob);
      setParsedResults({
        totalPages: importDraft.totalPages,
        detectedDistrict: importDraft.projectForm.district,
        pageRanges: {
          cover: importDraft.coverPages,
          chapters: importDraft.chaptersRanges,
          plates: importDraft.platesPages,
        }
      });
      
      // Navigate directly to Step 4 config screen
      setCurrentStep(4);
      toast.success("Import draft loaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore import draft.");
    }
  };

  const handleDiscardDraft = async () => {
    try {
      await del("dsr-import-draft");
      setImportDraft(null);
      toast.success("Draft discarded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete draft.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Draft Resume Banner */}
      {currentStep === 1 && importDraft && (
        <div className="mx-auto max-w-4xl px-4 pt-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Unfinished Import Draft Found</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                We found an unsaved import draft for <span className="font-semibold text-blue-600 dark:text-blue-400">{importDraft.projectForm.projectName}</span> (File: {importDraft.fileName}) saved on {new Date(importDraft.savedAt).toLocaleString()}.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleResumeDraft}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500"
              >
                Resume Draft
              </button>
              <button
                onClick={handleDiscardDraft}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <Step1Options onSelectOption={handleSelectOption} />
      )}
      
      {currentStep === 2 && (
        <Step2Upload 
          onUploadComplete={(uploadedFile) => {
            setFile(uploadedFile);
            setCurrentStep(3);
          }} 
          onCancel={() => setCurrentStep(1)} 
        />
      )}
      
      {currentStep === 3 && file && (
        <Step3Processing 
          file={file}
          onProcessingComplete={(results) => {
            setParsedResults(results);
            setCurrentStep(4);
          }} 
        />
      )}
      
      {currentStep === 4 && file && parsedResults && (
        <Step4Summary 
          file={file}
          parsedResults={parsedResults}
          onCancel={() => {
            // Discard active draft context to prevent overwrite conflicts
            setFile(null);
            setParsedResults(null);
            setImportDraft(null);
            setCurrentStep(1);
          }}
          draftData={importDraft ? {
            projectForm: importDraft.projectForm,
            coverPages: importDraft.coverPages,
            chaptersRanges: importDraft.chaptersRanges,
            platesPages: importDraft.platesPages,
          } : undefined}
        />
      )}
    </div>
  );
}
