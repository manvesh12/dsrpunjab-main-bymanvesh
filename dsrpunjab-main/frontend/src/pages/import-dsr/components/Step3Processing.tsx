import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { parseDsrPdf, type ParsedDsrResults } from "../../../utils/dsrParser";

interface Step3ProcessingProps {
  file: File;
  onProcessingComplete: (results: ParsedDsrResults) => void;
}

const processingSteps = [
  { id: "ocr", label: "Running OCR & Text Extraction" },
  { id: "tables", label: "Extracting Chapters & Sections" },
  { id: "maps", label: "Detecting District & Metadata" },
  { id: "classification", label: "Classifying Data into Portal Modules" },
];

export default function Step3Processing({ file, onProcessingComplete }: Step3ProcessingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing document parser...");

  useEffect(() => {
    let active = true;

    async function runParser() {
      try {
        const results = await parseDsrPdf(file, (stepMsg, percent) => {
          if (!active) return;
          setStatusMessage(stepMsg);
          setOverallProgress(percent);

          // Map percent to step index
          if (percent < 40) {
            setCurrentStepIndex(0);
          } else if (percent < 75) {
            setCurrentStepIndex(1);
          } else if (percent < 90) {
            setCurrentStepIndex(2);
          } else {
            setCurrentStepIndex(3);
          }
        });

        if (active) {
          setCurrentStepIndex(4);
          setOverallProgress(100);
          setStatusMessage("Parser finished successfully!");
          setTimeout(() => {
            if (active) onProcessingComplete(results);
          }, 1000);
        }
      } catch (err) {
        console.error("PDF Parsing failed:", err);
        if (active) {
          setStatusMessage("Parsing failed. Please verify file format.");
        }
      }
    }

    runParser();

    return () => {
      active = false;
    };
  }, [file, onProcessingComplete]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
        <Sparkles size={48} className="animate-pulse" />
      </div>
      
      <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">AI Document Parser</h2>
      <p className="mb-4 text-lg text-slate-600 dark:text-slate-400">
        Extracting and structuring data from your DSR document...
      </p>
      
      {/* Real-time status message */}
      <p className="mb-12 text-sm text-slate-500 font-mono bg-slate-100 dark:bg-slate-900 py-2 px-4 rounded-lg inline-block border border-slate-200 dark:border-slate-800">
        {statusMessage}
      </p>

      <div className="mx-auto mb-10 max-w-md text-left">
        <div className="space-y-6">
          {processingSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="text-emerald-500" size={28} />
                  ) : isCurrent ? (
                    <Loader2 className="animate-spin text-blue-500" size={28} />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                  )}
                </div>
                <span className={`text-lg font-medium transition-colors ${
                  isCompleted ? "text-slate-900 dark:text-white" :
                  isCurrent ? "text-blue-600 dark:text-blue-400" :
                  "text-slate-400 dark:text-slate-600"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <div className="mb-2 flex justify-between text-sm font-semibold">
          <span className="text-slate-700 dark:text-slate-300">Overall Progress</span>
          <span className="text-blue-600 dark:text-blue-400">{Math.floor(overallProgress)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out dark:bg-blue-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
