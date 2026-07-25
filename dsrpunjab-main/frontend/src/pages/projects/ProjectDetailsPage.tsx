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
  Palette,
  Send,
  RotateCcw,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../security/auth.context";
import { hasAnyPermission, isGlobalAdmin, normalizedRole, Permission } from "../../security/access";
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
  ["Replenishment", "Survey inputs and replenishment calculations", "replenishment", RefreshCw, [Permission.SectionReplenishment]],
  ["Model DSR", "Project-specific compiled model report", "model-dsr", FileCheck2, [Permission.ProjectEdit]],
  ["Reviewer & Workflow", "Sequential approval, e-signatures and review notes", "reviewer", ShieldCheck, [Permission.ReportApprove, Permission.SectionReviewOnly]],
  ["Report Preview", "Review the compiled document", "preview", Images, [Permission.ProjectView]],
  ["Generate PDF", "Validate and create the final report", "generate", FileCheck2, [Permission.ReportGenerate, Permission.ReportDownload]],
] as const;

function modulePath(projectId: string, path: string) {
  if (path === "replenishment") return `/projects/${projectId}/generate?tab=replenishment`;
  if (path === "model-dsr") return `/projects/${projectId}/generate?tab=model-dsr`;
  return `/projects/${projectId}/${path}`;
}

export default function ProjectDetailsPage() {
  const { projectId = "1" } = useParams();
  const { user } = useAuth();
  const canSaveAll = hasAnyPermission(user, [Permission.ProjectEdit]);
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
  const visibleModules = modules.filter((module) => hasAnyPermission(user, module.permissions));
  if (isGlobalAdmin(user)) modules.splice(modules.length - 2, 0, {
    title: "DSR Format Designer",
    description: "Redesign, preview and finalize section-wise report formatting",
    path: "format-designer",
    Icon: Palette,
    permissions: [Permission.ProjectEdit],
    progress: (project?.projectState?.["report-format"] as { finalizedAt?: string } | undefined)?.finalizedAt ? 100 : 0,
  });

  const completedSections = visibleModules.filter(m => m.progress === 100).length;
  const overallProgress = overallProjectProgress(project);
  const role = normalizedRole(user);
  const stage = project?.workflow?.stage || "DMO";
  const isStageEditor = role === "STATE_ADMIN" || role === stage;
  const canSubmitStage = role === stage && stage !== "COMPLETED";
  const canReopen = role === "STATE_ADMIN" || (role === "HEAD_OFFICE" && stage === "HEAD_OFFICE");

  const submitStage = async () => {
    const remarks = window.prompt("Submission remarks (optional)", "") ?? undefined;
    try {
      await projectsApi.submitWorkflow(projectId, remarks);
      await refetch();
      toast.success("Stage submitted. Your editing access is now locked.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not submit workflow stage.");
    }
  };

  const reopenStage = async () => {
    const targetRole = window.prompt("Reopen for: DMO, COE_SENSRS, REVIEWER, or HEAD_OFFICE", role === "HEAD_OFFICE" ? "REVIEWER" : "DMO");
    if (!targetRole) return;
    const normalizedTarget = targetRole.trim().toUpperCase().replaceAll(" ", "_") as "DMO" | "COE_SENSRS" | "REVIEWER" | "HEAD_OFFICE";
    if (!["DMO", "COE_SENSRS", "REVIEWER", "HEAD_OFFICE"].includes(normalizedTarget)) {
      toast.error("Invalid workflow role."); return;
    }
    const remarks = window.prompt("Reason for reopening/revision (required)", "");
    if (!remarks?.trim()) return;
    try {
      await projectsApi.reopenWorkflow(projectId, normalizedTarget, remarks.trim());
      await refetch();
      toast.success(`Project reopened for ${normalizedTarget.replaceAll("_", " ")}.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not reopen workflow stage.");
    }
  };

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
            {canSaveAll && isStageEditor && <button className="module-btn-primary" disabled={savingAll || isLoading} onClick={handleSaveAllSections}>
              <Save size={17} />
              {savingAll ? "Saving..." : "Save All Sections"}
            </button>}
            <Link to="/projects" className="module-btn">Back to Projects</Link>
          </div>
        }
      />

      <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-blue-600">Current workflow stage</p>
            <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{stage.replaceAll("_", " ")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {isStageEditor ? "Editing is open for your role." : `Your portal is read-only until ${stage.replaceAll("_", " ")} submits or an administrator reopens your stage.`}
              {project?.workflow?.remarks ? ` Latest note: ${project.workflow.remarks}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {canReopen && <button onClick={reopenStage} className="module-btn"><RotateCcw size={16}/> Reopen / request revision</button>}
            {canSubmitStage && <button onClick={submitStage} className="module-btn-primary"><Send size={16}/> Submit to next stage</button>}
          </div>
        </div>
      </section>
      
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Overall progress" value={`${isLoading ? "--" : overallProgress}%`} />
        <Stat label="Sections completed" value={`${isLoading ? "--" : completedSections} / ${visibleModules.length}`} />
        <Stat 
          label="Last updated" 
          value={project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Just now"} 
        />
      </section>
      
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleModules.map(({ title, description, path, Icon, permissions, progress }) => {
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
              to={modulePath(projectId, path)}
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
