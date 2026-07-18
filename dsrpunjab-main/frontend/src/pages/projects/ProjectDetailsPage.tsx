import {
  BookOpen,
  ChartNoAxesCombined,
  FileCheck2,
  FileText,
  Images,
  Layers3,
  Lock,
  Map,
  RefreshCw,
  ShieldCheck,
  Save,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../security/auth.context";
import { hasAnyPermission, Permission } from "../../security/access";
import { projectsApi } from "../../api/projects.api";
import { saveProjectBuilderDrafts } from "../../utils/projectDraftState";
import { toast } from "sonner";
import { moduleProgress, overallProjectProgress } from "../../utils/projectProgress";

const modulesTemplate = [
  ["Front Matter", "Certificates, contents and acknowledgements", "front-matter", FileText, [Permission.SectionFrontMatter, Permission.SectionCertificate]],
  ["Chapters", "Core DSR chapters and review status", "chapters", BookOpen, [Permission.SectionChaptersFirstHalf, Permission.SectionChaptersSecondHalf]],
  ["Plates & Maps", "District, geology and mining maps", "plates", Map, [Permission.SectionPlates]],
  ["Cross Sections", "River profiles and cross-section graphs", "cross-sections", ChartNoAxesCombined, [Permission.SectionCrossSections]],
  ["Annexures", "Annexures I-VII and B-K", "annexures", Layers3, [Permission.ProjectEdit]],
  ["Replenishment", "Survey inputs and replenishment calculations", "replenishment", RefreshCw, [Permission.ProjectEdit]],
  ["Model DSR", "Project-specific compiled model report", "model-dsr", FileCheck2, [Permission.ProjectEdit]],
  ["Reviewer & Workflow", "Sequential approval, e-signatures and review notes", "reviewer", ShieldCheck, [Permission.ReportApprove, Permission.SectionReviewOnly]],
  ["Report Preview", "Review the compiled document", "preview", Images, [Permission.ProjectView]],
  ["Generate PDF", "Validate and create the final report", "generate", FileCheck2, [Permission.ReportGenerate, Permission.ReportDownload]],
] as const;

export default function ProjectDetailsPage() {
  const { projectId = "1" } = useParams();
  const { user } = useAuth();
  const [savingAll, setSavingAll] = useState(false);

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
  });

  const modules = modulesTemplate.map(([title, description, path, Icon, permissions]) => {
    return {
      title,
      description,
      path,
      Icon,
      permissions,
      progress: moduleProgress(path, project),
    };
  });

  const completedSections = modules.filter(m => m.progress === 100).length;
  const overallProgress = overallProjectProgress(project);

  const handleSaveAllSections = async () => {
    setSavingAll(true);
    try {
      await saveProjectBuilderDrafts(projectId);
      await refetch();
      toast.success("All available section drafts saved to database");
    } catch (error) {
      console.error("Failed to save all section drafts:", error);
      toast.error("Save all sections failed");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <>
      <PageHeader
        title={project?.title || project?.projectName || `District Survey Report`}
        description={project ? `Project #${project.id} - ${project.year || "Financial Year 2025-26"} - ${project.mineral || "Sand and Minor Minerals"}` : `Loading...`}
        action={
          <div className="flex gap-2">
            <button className="module-btn-primary" disabled={savingAll || isLoading} onClick={handleSaveAllSections}>
              <Save size={17} />
              {savingAll ? "Saving..." : "Save All Sections"}
            </button>
            <Link to="/projects" className="module-btn">Back to Projects</Link>
          </div>
        }
      />
      
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Overall progress" value={`${isLoading ? "--" : overallProgress}%`} />
        <Stat label="Sections completed" value={`${isLoading ? "--" : completedSections} / ${modules.length}`} />
        <Stat 
          label="Last updated" 
          value={project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Just now"} 
        />
      </section>
      
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ title, description, path, Icon, permissions, progress }) => {
          const accessible = hasAnyPermission(user, permissions);
          const content = (
            <>
              <div className="flex items-start justify-between">
                <span className={`flex size-11 items-center justify-center rounded-xl ${accessible ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" : "bg-slate-100 text-slate-400"}`}>
                  {accessible ? <Icon size={21} /> : <Lock size={21} />}
                </span>
                <span className="text-sm font-bold text-slate-500">{accessible ? `${progress}%` : "Locked"}</span>
              </div>
              <h2 className="mt-4 font-bold text-slate-900">{title}</h2>
              <p className="mt-1 min-h-10 text-sm text-slate-500">
                {accessible ? description : "Locked - not accessible for you"}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${accessible ? progress : 0}%` }} />
              </div>
            </>
          );

          return accessible ? (
            <Link
              key={path}
              to={`/projects/${projectId}/${path}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              {content}
            </Link>
          ) : (
            <div key={path} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-80 shadow-sm">
              {content}
            </div>
          );
        })}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
