import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderKanban,
  Landmark,
  MapPinned,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, type ProjectListItem } from "../../api/projects.api";
import { settingsApi } from "../../api/settings.api";
import { useAuth } from "../../security/auth.context";
import { normalizedRole, Permission } from "../../security/access";
import { overallProjectProgress, workflowCompletion } from "../../utils/projectProgress";

type DashboardRole = "state" | "district" | "review" | "publishing" | "preparation";
type Action = { label: string; detail: string; to: string; icon: LucideIcon; primary?: boolean };
const WORKFLOW_PROJECT_KEY = "dsr:dashboard:workflow-project";

const roleDetails: Record<DashboardRole, { eyebrow: string; title: string; description: string; queueTitle: string; queueDescription: string; accent: string }> = {
  state: {
    eyebrow: "State Administration",
    title: "State DSR Control Room",
    description: "Statewide monitoring of district submissions, approval movement, user access and report readiness.",
    queueTitle: "Statewide priority register",
    queueDescription: "Projects requiring administrative attention or inter-district coordination.",
    accent: "border-[#a6580d]",
  },
  district: {
    eyebrow: "District Administration",
    title: "District Coordination Desk",
    description: "Coordinate district inputs, assign preparation work and keep the District Survey Report on schedule.",
    queueTitle: "District work register",
    queueDescription: "Current district reports, milestones and incomplete submissions.",
    accent: "border-[#0f5f69]",
  },
  review: {
    eyebrow: "Review and Approval",
    title: "Technical Review Desk",
    description: "Review report readiness, record observations and move complete District Survey Reports through approval.",
    queueTitle: "Approval inbox",
    queueDescription: "Reports ready for technical examination, observation or approval action.",
    accent: "border-[#7a3e84]",
  },
  publishing: {
    eyebrow: "Report Generation",
    title: "Report Publication Desk",
    description: "Prepare approved DSR records for controlled PDF generation, verification and release.",
    queueTitle: "Publication queue",
    queueDescription: "Reports that need generation, verification or final document handling.",
    accent: "border-[#176a42]",
  },
  preparation: {
    eyebrow: "District Survey Report Preparation",
    title: "DSR Preparation Workspace",
    description: "Complete assigned data, chapters, plates and annexures in a controlled department workflow.",
    queueTitle: "My preparation queue",
    queueDescription: "Continue active DSR work and resolve the next incomplete deliverable.",
    accent: "border-[#154a82]",
  },
};

function dashboardRole(role: string, canReview: boolean, canGenerate: boolean) {
  if (role === "SUPER_ADMIN" || role === "STATE_ADMIN") return "state" as const;
  if (canReview || role === "REVIEWER") return "review" as const;
  if (canGenerate || role === "REPORT_GENERATOR") return "publishing" as const;
  if (role === "DISTRICT_ADMIN") return "district" as const;
  return "preparation" as const;
}

function projectStatus(project: ProjectListItem) {
  return String(project.status || "Draft").replace(/_/g, " ");
}

function badgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("completed")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (normalized.includes("review")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized.includes("draft")) return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const role = normalizedRole(user);
  const canReview = hasPermission(Permission.ReportApprove) || hasPermission(Permission.SectionReviewOnly);
  const canGenerate = hasPermission(Permission.ReportGenerate) || hasPermission(Permission.ReportDownload);
  const canCreate = hasPermission(Permission.ProjectCreate);
  const profile = dashboardRole(role, canReview, canGenerate);
  const details = roleDetails[profile];

  const { data: projectResponse, isLoading: projectsLoading, isError: projectsError } = useQuery({
    queryKey: ["projects", "dashboard", profile],
    queryFn: () => projectsApi.list({ limit: 100 }),
  });
  const { data: noticeSetting } = useQuery({
    queryKey: ["settings", "notice_text"],
    queryFn: () => settingsApi.get("notice_text"),
  });

  const projects = projectResponse?.data || [];
  const workProjects = projects.filter((project) => !project.phaseLocked && !["COMPLETED", "APPROVED", "ARCHIVED"].includes(String(project.status).toUpperCase()));
  const completedProjects = projects.filter((project) => ["COMPLETED", "APPROVED"].includes(String(project.status).toUpperCase()));
  const reviewProjects = projects.filter((project) => String(project.status).toUpperCase().includes("REVIEW"));
  const readyToGenerate = projects.filter((project) => overallProjectProgress(project) >= 85 || ["APPROVED", "COMPLETED"].includes(String(project.status).toUpperCase()));
  const queue = [...(profile === "review" ? reviewProjects : workProjects)].sort((a, b) => overallProjectProgress(b) - overallProjectProgress(a)).slice(0, 5);
  const notices = noticeSetting?.value || "Use the portal only for official District Survey Report preparation, review and approval activities.";
  const actions = roleActions(profile, canCreate, canReview, canGenerate);
  const metrics = roleMetrics(profile, projects.length, workProjects.length, reviewProjects.length, completedProjects.length, readyToGenerate.length);

  return (
    <main className="space-y-5 pb-6">
      <section className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className={`border-t-4 ${details.accent} px-5 py-5 sm:px-6`}>
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#a6580d]"><Landmark size={14} /> Government of Punjab | {details.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#102f55] dark:text-white sm:text-3xl">{details.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{details.description}</p>
            </div>
            <div className="min-w-[220px] border-l-4 border-[#e9a319] bg-[#fff9ed] px-4 py-3 dark:bg-amber-950/20">
              <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#9a5a08]">Signed in as</p>
              <p className="mt-1 text-sm font-extrabold text-[#102f55] dark:text-white">{user?.fullName || "Authorised user"}</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{user?.uiRole || "Department user"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex min-h-11 shrink-0 items-center gap-2 border-r border-amber-200 bg-[#e9a319] px-4 text-xs font-extrabold text-[#102f55]"><Bell size={15} /> Notice</div>
          <p className="line-clamp-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">{notices}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]">
        <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <PanelTitle icon={FolderKanban} title={details.queueTitle} subtitle={details.queueDescription} to="/projects" />
          {projectsLoading ? <EmptyState text="Loading project register..." /> : projectsError ? <EmptyState text="Project register could not be loaded. Please refresh the page." error /> : queue.length === 0 ? <EmptyState text="No project is waiting for action in this workspace." /> : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {queue.map((project) => <ProjectRow key={project.id} project={project} profile={profile} canReview={canReview} canGenerate={canGenerate} />)}
            </div>
          )}
        </article>

        <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <PanelTitle icon={ClipboardCheck} title="Priority actions" subtitle="Tasks available under your current access" />
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {actions.map((action) => <ActionRow key={action.label} action={action} />)}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">All actions are logged against your authorised role and access scope.</p>
          </div>
        </article>
      </section>

      <WorkflowOverview projects={workProjects} canReview={canReview} />

      <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <RoleBriefing profile={profile} projects={projects} canReview={canReview} canGenerate={canGenerate} />
        <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <PanelTitle icon={ScrollText} title="Current report register" subtitle="Most recently updated DSR records available in this workspace" to="/projects" />
          {projects.length === 0 && !projectsLoading ? <EmptyState text="No project records are available." /> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60">
                  <tr><th className="px-5 py-3">Report</th><th className="px-4 py-3">District</th><th className="px-4 py-3">Stage</th><th className="px-5 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {projects.slice(0, 5).map((project) => <tr key={project.id} className="text-slate-700 dark:text-slate-200"><td className="px-5 py-3.5 font-bold text-[#102f55] dark:text-white">{project.title || project.projectName}</td><td className="px-4 py-3.5 text-xs">{project.district || "Punjab"}</td><td className="px-4 py-3.5"><span className={`inline-flex border px-2 py-1 text-[10px] font-extrabold uppercase ${badgeClass(projectStatus(project))}`}>{projectStatus(project)}</span></td><td className="px-5 py-3.5 text-right"><Link to={`/projects/${project.id}`} className="text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Open</Link></td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function roleMetrics(role: DashboardRole, total: number, active: number, review: number, completed: number, ready: number) {
  const common = { total, active, review, completed, ready };
  const byRole: Record<DashboardRole, Array<{ label: string; value: number; detail: string; icon: LucideIcon; tone: string }>> = {
    state: [{ label: "Registered DSRs", value: common.total, detail: "Statewide project register", icon: FolderKanban, tone: "blue" }, { label: "Active districts", value: common.active, detail: "Reports under preparation", icon: MapPinned, tone: "teal" }, { label: "Pending review", value: common.review, detail: "Awaiting authority action", icon: ShieldCheck, tone: "amber" }, { label: "Completed reports", value: common.completed, detail: "Approved or finalised", icon: CheckCircle2, tone: "green" }],
    district: [{ label: "District projects", value: common.total, detail: "Available in your register", icon: FolderKanban, tone: "blue" }, { label: "In preparation", value: common.active, detail: "Current district workload", icon: Activity, tone: "teal" }, { label: "For review", value: common.review, detail: "Ready for scrutiny", icon: ClipboardCheck, tone: "amber" }, { label: "Finalised", value: common.completed, detail: "Completed DSRs", icon: CheckCircle2, tone: "green" }],
    review: [{ label: "Review queue", value: common.review, detail: "Reports under review", icon: ClipboardCheck, tone: "amber" }, { label: "Active reports", value: common.active, detail: "Preparing for submission", icon: FolderKanban, tone: "blue" }, { label: "Approved", value: common.completed, detail: "Completed decisions", icon: ShieldCheck, tone: "green" }, { label: "Register coverage", value: common.total, detail: "Available report records", icon: MapPinned, tone: "teal" }],
    publishing: [{ label: "Ready for publication", value: common.ready, detail: "High-completion reports", icon: FileCheck2, tone: "green" }, { label: "Approved / final", value: common.completed, detail: "Controlled final reports", icon: CheckCircle2, tone: "blue" }, { label: "In preparation", value: common.active, detail: "Awaiting source completion", icon: FolderKanban, tone: "teal" }, { label: "Total register", value: common.total, detail: "Available reports", icon: ScrollText, tone: "amber" }],
    preparation: [{ label: "My active DSRs", value: common.active, detail: "Assigned preparation work", icon: FolderKanban, tone: "blue" }, { label: "Review ready", value: common.review, detail: "Submitted for review", icon: ClipboardCheck, tone: "amber" }, { label: "Completed", value: common.completed, detail: "Finalised reports", icon: CheckCircle2, tone: "green" }, { label: "Available register", value: common.total, detail: "Accessible DSR records", icon: MapPinned, tone: "teal" }],
  };
  return byRole[role];
}

function roleActions(role: DashboardRole, canCreate: boolean, canReview: boolean, canGenerate: boolean): Action[] {
  const actions: Record<DashboardRole, Action[]> = {
    state: [{ label: "Manage users and access", detail: "Maintain user roles, districts and permissions", to: "/users", icon: Users, primary: true }, { label: "Open statewide analytics", detail: "Review operational and district indicators", to: "/analytics", icon: Activity }, { label: "Import approved DSR", detail: "Bring a prior DSR record into the portal", to: "/import-previous-dsr", icon: FilePlus2 }, { label: "Audit portal activity", detail: "Review administrative activity trail", to: "/audit", icon: ScrollText }],
    district: [{ label: "Create District Survey Report", detail: "Open a new project for the assigned district", to: "/projects/create", icon: FilePlus2, primary: true }, { label: "Review project register", detail: "Monitor all district report work", to: "/projects", icon: FolderKanban }, { label: "Open district details", detail: "Check district coverage and DSR mapping", to: "/districts", icon: MapPinned }, { label: "Generate report", detail: "Prepare an authorised report version", to: "/reports", icon: FileText }],
    review: [{ label: "Open review workspace", detail: "Record observations and take review action", to: "/workflow", icon: ShieldCheck, primary: true }, { label: "Review project register", detail: "Inspect report context before a decision", to: "/projects", icon: FolderKanban }, { label: "View generated reports", detail: "Check report copies and versions", to: "/reports", icon: FileText }],
    publishing: [{ label: "Open reports register", detail: "Generate and manage authorised report versions", to: "/reports", icon: FileCheck2, primary: true }, { label: "Review source projects", detail: "Confirm report readiness and source data", to: "/projects", icon: FolderKanban }, { label: "Open workflow status", detail: "Check approval stage before publication", to: "/workflow", icon: ShieldCheck }],
    preparation: [{ label: "Open my projects", detail: "Continue section, annexure and evidence work", to: "/projects", icon: FolderKanban, primary: true }, { label: "Create DSR project", detail: "Start an authorised district report", to: "/projects/create", icon: FilePlus2 }, { label: "View report copies", detail: "Open available previews and generated records", to: "/reports", icon: FileText }],
  };
  return actions[role].filter((action) => !(action.to === "/projects/create" && !canCreate) && !(action.to === "/workflow" && !canReview) && !(action.to === "/reports" && !canGenerate && role === "publishing"));
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: LucideIcon; tone: string }) {
  const tones: Record<string, string> = { blue: "border-blue-200 bg-blue-50 text-blue-800", teal: "border-teal-200 bg-teal-50 text-teal-800", amber: "border-amber-200 bg-amber-50 text-amber-800", green: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  return <article className="border border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${tones[tone]}`}><Icon size={20} /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-2xl font-extrabold text-[#102f55] dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div></div></article>;
}

function PanelTitle({ icon: Icon, title, subtitle, to }: { icon: LucideIcon; title: string; subtitle: string; to?: string }) {
  return <div className="flex items-start justify-between gap-4 border-t-4 border-[#123c6e] px-5 py-4"><div className="flex gap-3"><Icon size={19} className="mt-0.5 text-[#a6580d]" /><div><h2 className="font-extrabold text-[#102f55] dark:text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p></div></div>{to && <Link to={to} className="shrink-0 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">View all</Link>}</div>;
}

function ProjectRow({ project, profile, canReview, canGenerate }: { project: ProjectListItem; profile: DashboardRole; canReview: boolean; canGenerate: boolean }) {
  const progress = overallProjectProgress(project);
  const currentStep = workflowCompletion(project).find((step) => !step.done && !step.locked);
  const action = profile === "review" && canReview ? { to: `/projects/${project.id}/reviewer`, label: "Review" } : profile === "publishing" && canGenerate ? { to: `/projects/${project.id}/generate`, label: "Generate" } : { to: `/projects/${project.id}`, label: "Open" };
  return <div className="px-5 py-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><Link to={`/projects/${project.id}`} className="font-extrabold text-[#102f55] hover:underline dark:text-white">{project.title || project.projectName}</Link><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><MapPinned size={13} className="text-[#a6580d]" />{project.district || "Punjab"} <span>|</span> {project.year || "Financial year not set"}</p></div><div className="flex items-center gap-3"><span className={`border px-2 py-1 text-[10px] font-extrabold uppercase ${badgeClass(projectStatus(project))}`}>{projectStatus(project)}</span><Link to={action.to} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">{action.label}<ArrowRight size={14} /></Link></div></div><div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-800"><div className="h-full bg-[#123c6e]" style={{ width: `${progress}%` }} /></div><span className="w-9 text-right text-xs font-extrabold text-[#102f55] dark:text-white">{progress}%</span></div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{currentStep ? `Next deliverable: ${currentStep.label}` : "All workflow deliverables are complete"}</p></div>;
}

function WorkflowOverview({ projects, canReview }: { projects: ProjectListItem[]; canReview: boolean }) {
  const [preferredProjectId, setPreferredProjectId] = useState(
    () => window.localStorage.getItem(WORKFLOW_PROJECT_KEY) || ""
  );
  const selectedProjectId = projects.some((project) => String(project.id) === preferredProjectId)
    ? preferredProjectId
    : projects[0] ? String(projects[0].id) : "";
  const selectedListProject = projects.find((project) => String(project.id) === selectedProjectId);
  const {
    data: selectedProject,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: () => projectsApi.get(selectedProjectId),
    enabled: Boolean(selectedProjectId),
  });

  const project = selectedProject || selectedListProject;
  const steps = workflowCompletion(project);
  const progress = overallProjectProgress(project);
  const completedSteps = steps.filter((step) => step.done).length;
  const currentStep = steps.find((step) => !step.done && !step.locked);

  const selectProject = (projectId: string) => {
    setPreferredProjectId(projectId);
    window.localStorage.setItem(WORKFLOW_PROJECT_KEY, projectId);
  };

  return (
    <section className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-t-4 border-[#123c6e] px-5 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex gap-3">
            <ClipboardCheck size={19} className="mt-0.5 text-[#a6580d]" />
            <div>
              <h2 className="font-extrabold text-[#102f55] dark:text-white">DSR workflow progress</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Select an active project to review its live report completion stages.</p>
            </div>
          </div>
          <label className="block min-w-0 md:w-80">
            <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:text-slate-400">Active project</span>
            <span className="relative block">
              <select
                value={selectedProjectId}
                onChange={(event) => selectProject(event.target.value)}
                disabled={projects.length === 0}
                className="h-10 w-full appearance-none border border-slate-300 bg-white px-3 pr-9 text-sm font-bold text-[#102f55] outline-none focus:border-[#123c6e] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
              >
                {projects.length === 0 && <option value="">No active projects</option>}
                {projects.map((item) => <option key={item.id} value={String(item.id)}>{item.title || item.projectName}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </span>
          </label>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState text="No active project is available for workflow tracking." />
      ) : isError ? (
        <div className="border-t border-slate-200 px-5 py-10 text-center dark:border-slate-700">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">Project workflow could not be loaded.</p>
          <button type="button" onClick={() => void refetch()} className="mt-3 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Try again</button>
        </div>
      ) : (
        <div className="grid border-t border-slate-200 xl:grid-cols-[minmax(280px,.75fr)_minmax(0,1.25fr)] dark:border-slate-700">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 xl:border-b-0 xl:border-r dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold text-[#102f55] dark:text-white">{project?.title || project?.projectName}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {project?.district || "Punjab"} | {project?.year || "Financial year not set"} | Phase {project?.phaseNo || 1}
                </p>
              </div>
              <span className="shrink-0 text-2xl font-extrabold text-[#123c6e] dark:text-blue-300">{isLoading ? "--" : `${progress}%`}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div className="h-full bg-[#123c6e] transition-[width] duration-500" style={{ width: `${isLoading ? 0 : progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>{completedSteps} of {steps.length} stages complete</span>
              <span>{currentStep ? `Current: ${currentStep.label}` : "Workflow complete"}</span>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link to={`/projects/${project?.id}`} className="govt-button-secondary justify-center">Open project <ArrowRight size={15} /></Link>
              <Link to={canReview ? `/projects/${project?.id}/reviewer` : `/projects/${project?.id}/preview`} className="govt-button-primary justify-center">
                {canReview ? "Open workflow" : "Preview report"} <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="px-5 py-5">
            {steps.map((step, index) => {
              const active = step.key === currentStep?.key;
              return (
                <div key={step.key} className="relative flex gap-4 pb-5 last:pb-0">
                  {index !== steps.length - 1 && <div className={`absolute left-[15px] top-8 bottom-0 w-px ${step.done ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />}
                  <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-extrabold ${step.done ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-[#123c6e] bg-[#123c6e] text-white" : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900"}`}>
                    {step.done ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className={`text-sm font-extrabold ${active ? "text-[#123c6e] dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}>{step.label}</h3>
                      <span className="shrink-0 text-[11px] font-extrabold text-slate-500 dark:text-slate-400">{step.progress}%</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function ActionRow({ action }: { action: Action }) {
  const Icon = action.icon;
  return <Link to={action.to} className={`group flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${action.primary ? "bg-[#f5f8fc] dark:bg-blue-950/20" : ""}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#b9c9d9] bg-white text-[#123c6e] dark:border-slate-600 dark:bg-slate-800 dark:text-blue-300"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#102f55] dark:text-white">{action.label}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{action.detail}</span></span><ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#123c6e]" /></Link>;
}

function RoleBriefing({ profile, projects, canReview, canGenerate }: { profile: DashboardRole; projects: ProjectListItem[]; canReview: boolean; canGenerate: boolean }) {
  const message: Record<DashboardRole, { title: string; items: Array<{ label: string; value: string; to: string }> }> = {
    state: { title: "State operational controls", items: [{ label: "User and role governance", value: "Maintain authorised access", to: "/users" }, { label: "Portal configuration", value: "Review departmental settings", to: "/settings" }, { label: "Activity trail", value: "Inspect administrative audit logs", to: "/audit" }] },
    district: { title: "District coordination checklist", items: [{ label: "Project ownership", value: "Confirm district, year and mineral details", to: "/projects" }, { label: "District coverage", value: "Review mapped DSR information", to: "/districts" }, { label: "Reporting status", value: "Monitor current project movement", to: "/reports" }] },
    review: { title: "Review controls", items: [{ label: "Technical examination", value: canReview ? "Open reports awaiting action" : "Review access is not assigned", to: "/workflow" }, { label: "Observations", value: "Record clear, traceable review notes", to: "/workflow" }, { label: "Decision readiness", value: `${projects.filter((project) => overallProjectProgress(project) >= 85).length} high-completion report(s) visible`, to: "/projects" }] },
    publishing: { title: "Publication controls", items: [{ label: "Report readiness", value: `${projects.filter((project) => overallProjectProgress(project) >= 85).length} report(s) are high completion`, to: "/projects" }, { label: "Approved output", value: canGenerate ? "Generate only authorised versions" : "Generation permission is not assigned", to: "/reports" }, { label: "Document register", value: "Keep final report records traceable", to: "/reports" }] },
    preparation: { title: "Preparation checklist", items: [{ label: "Source information", value: "Complete district and mineral inputs", to: "/projects" }, { label: "Report components", value: "Save chapters, plates and annexures", to: "/projects" }, { label: "Quality check", value: "Use preview before requesting review", to: "/reports" }] },
  };
  const briefing = message[profile];
  return <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"><PanelTitle icon={Settings} title={briefing.title} subtitle="Controlled operational guidance for this workspace" /><div className="divide-y divide-slate-200 dark:divide-slate-700">{briefing.items.map((item) => <Link key={item.label} to={item.to} className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"><span><span className="block text-sm font-extrabold text-[#102f55] dark:text-white">{item.label}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.value}</span></span><ArrowRight size={16} className="shrink-0 text-[#123c6e] dark:text-blue-300" /></Link>)}</div></article>;
}

function EmptyState({ text, error }: { text: string; error?: boolean }) {
  return <div className={`px-5 py-12 text-center text-sm font-semibold ${error ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-400"}`}>{text}</div>;
}
