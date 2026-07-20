import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Step1Options from "./components/Step1Options";
import Step2Upload from "./components/Step2Upload";
import Step3Processing from "./components/Step3Processing";
import Step4Summary from "./components/Step4Summary";
import { type ParsedDsrResults } from "../../utils/dsrParser";

export default function ImportDsrPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedDsrResults | null>(null);

  const handleSelectOption = (option: "upload" | "skip") => {
    if (option === "upload") {
      setCurrentStep(2);
    } else {
      navigate("/projects/create");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
          onCancel={() => setCurrentStep(2)}
        />
      )}
    </div>
  );
}
