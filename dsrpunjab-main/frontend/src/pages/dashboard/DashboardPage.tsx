import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FilePlus,
  FileText,
  FolderKanban,
  HardDrive,
  Landmark,
  MapPinned,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../../api/projects.api";
import { settingsApi } from "../../api/settings.api";
import { useAuth } from "../../security/auth.context";
import { isGlobalAdmin, Permission } from "../../security/access";
import { overallProjectProgress, workflowCompletion } from "../../utils/projectProgress";

const nonAdminStats = [
  { label: "Total Projects", value: "3", info: "Active DSR projects", icon: FolderKanban, tone: "blue" },
  { label: "Completed", value: "1", info: "Final reports generated", icon: CheckCircle2, tone: "green" },
  { label: "Pending Signatures", value: "4", info: "Awaiting authority action", icon: Clock3, tone: "amber" },
  { label: "PDFs Generated", value: "2", info: "Ready for download", icon: FileText, tone: "slate" },
];

const adminStats = [
  { label: "Total Users", value: "142", info: "Across 23 districts", icon: Users, tone: "blue" },
  { label: "Active DSRs", value: "18", info: "Under preparation", icon: Activity, tone: "green" },
  { label: "Pending Approvals", value: "9", info: "Requires review", icon: ShieldAlert, tone: "red" },
  { label: "Storage Used", value: "45.2 GB", info: "Out of 500 GB", icon: HardDrive, tone: "slate" },
];

const recentProjects = [
  { name: "Jalandhar DSR 2025-26", district: "Jalandhar", status: "In Progress", date: "Today", progress: 64 },
  { name: "Ludhiana DSR 2025-26", district: "Ludhiana", status: "Under Review", date: "Yesterday", progress: 82 },
  { name: "Bathinda DSR 2025-26", district: "Bathinda", status: "Completed", date: "2 days ago", progress: 100 },
];

const adminActivity = [
  { user: "SDM Jalandhar", action: "Approved DSR phase 2", time: "10 mins ago", tone: "green" },
  { user: "Consultant Ludhiana", action: "Generated Model DSR", time: "1 hour ago", tone: "blue" },
  { user: "State Admin", action: "Updated portal settings", time: "3 hours ago", tone: "slate" },
  { user: "DMO Bathinda", action: "Requested workflow rollback", time: "5 hours ago", tone: "amber" },
];

const districts = ["Jalandhar", "Ludhiana", "Bathinda", "Amritsar", "Patiala", "Rupnagar"];
const WORKFLOW_PROJECT_KEY = "dsr:dashboard:workflow-project";

const toneClasses: Record<string, { box: string; icon: string; badge: string }> = {
  blue: { box: "bg-[#eaf0f7] border-[#b9c9d9]", icon: "text-[#123c6e]", badge: "bg-blue-50 text-[#123c6e] border-blue-200" },
  green: { box: "bg-emerald-50 border-emerald-200", icon: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  amber: { box: "bg-amber-50 border-amber-200", icon: "text-[#b36a0d]", badge: "bg-amber-50 text-[#9a5a08] border-amber-200" },
  red: { box: "bg-red-50 border-red-200", icon: "text-red-700", badge: "bg-red-50 text-red-700 border-red-200" },
  slate: { box: "bg-slate-50 border-slate-200", icon: "text-slate-700", badge: "bg-slate-50 text-slate-700 border-slate-200" },
};

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = isGlobalAdmin(user);
  const stats = isAdmin ? adminStats : nonAdminStats;
  const canReview = hasPermission(Permission.ReportApprove) || hasPermission(Permission.SectionReviewOnly);

  const { data: noticeSetting } = useQuery({
    queryKey: ["settings", "notice_text"],
    queryFn: () => settingsApi.get("notice_text"),
  });
  const noticeText = noticeSetting?.value || "District Survey Report portal is available for authorised departmental users.";

  return (
    <div className="space-y-6">
      <section className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-t-4 border-[#e9a319] px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#b45309]">
                <Landmark size={14} /> {isAdmin ? "State administration console" : "Departmental DSR workspace"}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#102f55] sm:text-3xl dark:text-white">District Survey Report Dashboard</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {isAdmin
                  ? "Monitor statewide DSR preparation, approvals, users, audit activity and operational readiness from one official workspace."
                  : "Prepare, review and submit District Survey Reports through a controlled workflow aligned with departmental responsibilities."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={isAdmin ? "/users" : "/projects/create"} className="govt-button-primary">
                {isAdmin ? <Users size={16} /> : <FilePlus size={16} />}
                {isAdmin ? "Manage users" : "Create DSR project"}
              </Link>
              <Link to="/projects" className="govt-button-secondary">
                View projects <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center overflow-hidden border-t border-slate-200 bg-[#fff9ed] dark:border-slate-700 dark:bg-amber-950/20">
          <div className="flex min-h-11 shrink-0 items-center gap-2 border-r border-amber-200 bg-[#e9a319] px-4 text-xs font-extrabold text-[#102f55] dark:border-amber-800">
            <Bell size={16} /> Notice
          </div>
          <div className="min-w-0 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span className="line-clamp-1">{noticeText}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const tone = toneClasses[stat.tone];
          return (
            <article key={stat.label} className="border border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${tone.box} dark:border-slate-700 dark:bg-slate-800`}>
                  <stat.icon size={21} className={`${tone.icon} dark:text-blue-300`} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#102f55] dark:text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.info}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <PanelHeader title={isAdmin ? "Statewide Recent Projects" : "Recent Projects"} subtitle="Current project movement and report progress" to="/projects" />
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {recentProjects.map((project) => (
              <Link key={project.name} to="/projects" className="block p-5 transition hover:bg-[#f4f7fa] dark:hover:bg-slate-800/70">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[#102f55] dark:text-white">{project.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPinned size={13} className="text-[#b36a0d]" /> {project.district} | Last updated {project.date}
                    </p>
                  </div>
                  <div className="flex min-w-[220px] items-center gap-3">
                    <StatusBadge status={project.status} />
                    <ArrowRight size={17} className="text-slate-400" />
                  </div>
                </div>
                <div className="mt-4 h-2 border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <div className={`h-full ${project.progress === 100 ? "bg-emerald-600" : project.status === "Under Review" ? "bg-[#e9a319]" : "bg-[#123c6e]"}`} style={{ width: `${project.progress}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </article>

        {isAdmin ? <AdminPanel /> : <WorkflowPanel canReview={canReview} />}
      </section>

      <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <PanelHeader title="District Snapshot" subtitle="Priority districts currently visible in the workspace" to="/districts" />
          <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-3 dark:border-slate-700">
            {districts.map((district) => (
              <div key={district} className="flex items-center gap-2 border-b border-r border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <MapPinned size={14} className="text-[#b36a0d]" /> {district}
              </div>
            ))}
          </div>
        </article>

        <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <PanelHeader title="Quick Actions" subtitle="Common tasks for daily DSR operations" />
          <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-700">
            {[
              { icon: FilePlus, label: isAdmin ? "Create user" : "New project", to: isAdmin ? "/users" : "/projects/create" },
              { icon: FileCheck2, label: "Generate report", to: "/reports" },
              { icon: Activity, label: isAdmin ? "Audit logs" : "Workflow", to: isAdmin ? "/audit" : "/workflow" },
            ].map((action) => (
              <Link key={action.label} to={action.to} className="flex min-h-24 items-center gap-3 bg-white p-4 text-sm font-extrabold text-[#123c6e] transition hover:bg-[#f4f7fa] dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800">
                <span className="flex h-10 w-10 items-center justify-center border border-[#b9c9d9] bg-[#eaf0f7] dark:border-slate-700 dark:bg-slate-800">
                  <action.icon size={18} />
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function PanelHeader({ title, subtitle, to }: { title: string; subtitle: string; to?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t-4 border-[#123c6e] px-5 py-4">
      <div>
        <h2 className="text-lg font-extrabold text-[#102f55] dark:text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {to && <Link to={to} className="shrink-0 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">View all</Link>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Completed" ? toneClasses.green : status === "Under Review" ? toneClasses.amber : toneClasses.blue;
  return <span className={`border px-2.5 py-1 text-[11px] font-extrabold ${tone.badge} dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200`}>{status}</span>;
}

function WorkflowPanel({ canReview }: { canReview: boolean }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const {
    data: projectResponse,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects", "dashboard-workflow"],
    queryFn: () => projectsApi.list({ limit: 100 }),
  });

  const activeProjects = useMemo(
    () => (projectResponse?.data || []).filter((project) => {
      const status = String(project.status).toUpperCase().replace(/\s+/g, "_");
      return !project.phaseLocked && !["COMPLETED", "APPROVED", "ARCHIVED"].includes(status);
    }),
    [projectResponse]
  );

  useEffect(() => {
    if (activeProjects.length === 0) {
      setSelectedProjectId("");
      return;
    }
    const storedId = window.localStorage.getItem(WORKFLOW_PROJECT_KEY) || "";
    const selectedExists = activeProjects.some((project) => String(project.id) === selectedProjectId);
    const storedExists = activeProjects.some((project) => String(project.id) === storedId);
    if (!selectedExists) setSelectedProjectId(storedExists ? storedId : String(activeProjects[0].id));
  }, [activeProjects, selectedProjectId]);

  const selectedListProject = activeProjects.find((project) => String(project.id) === selectedProjectId);
  const {
    data: selectedProject,
    isLoading: projectLoading,
    isError: projectError,
    refetch: refetchProject,
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
  const projectName = project?.title || project?.projectName || "Selected project";
  const projectDistrict = project?.district || (project?.districtId ? `District #${project.districtId}` : "Punjab");
  const hasError = projectsError || projectError;

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    window.localStorage.setItem(WORKFLOW_PROJECT_KEY, projectId);
  };

  return (
    <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-t-4 border-[#123c6e] px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#102f55] dark:text-white">DSR Workflow Overview</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Live completion status for an active project</p>
          </div>
          <label className="block min-w-0 sm:w-64">
            <span className="mb-1.5 block text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Active project</span>
            <span className="relative block">
              <select value={selectedProjectId} onChange={(event) => selectProject(event.target.value)} disabled={projectsLoading || activeProjects.length === 0} className="h-10 w-full appearance-none border border-slate-300 bg-white px-3 pr-9 text-sm font-bold text-[#102f55] outline-none transition focus:border-[#123c6e] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950">
                {activeProjects.length === 0 && <option value="">{projectsLoading ? "Loading projects..." : "No active projects"}</option>}
                {activeProjects.map((item) => <option key={item.id} value={String(item.id)}>{item.title || item.projectName}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </span>
          </label>
        </div>
      </div>

      {projectsLoading ? (
        <PanelMessage>Loading active projects...</PanelMessage>
      ) : hasError ? (
        <div className="border-t border-slate-200 px-5 py-10 text-center dark:border-slate-700">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">Workflow progress could not be loaded.</p>
          <button type="button" onClick={() => { void refetchProjects(); if (selectedProjectId) void refetchProject(); }} className="mt-3 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Try again</button>
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="border-t border-slate-200 px-5 py-12 text-center dark:border-slate-700">
          <FolderKanban size={34} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-extrabold text-slate-700 dark:text-slate-200">No active projects available</p>
          <Link to="/projects" className="mt-2 inline-block text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">View all projects</Link>
        </div>
      ) : (
        <>
          <div className="border-y border-slate-200 bg-[#f7f9fb] px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold text-[#102f55] dark:text-white">{projectName}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{projectDistrict} | {project?.year || "Financial year not set"} | Phase {project?.phaseNo || 1}</p>
              </div>
              <span className={`shrink-0 text-2xl font-extrabold ${progress === 100 ? "text-emerald-700" : "text-[#123c6e] dark:text-blue-300"}`}>{projectLoading ? "--" : `${progress}%`}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden bg-slate-200 dark:bg-slate-700"><div className={`h-full transition-[width] duration-500 ${progress === 100 ? "bg-emerald-600" : "bg-[#123c6e]"}`} style={{ width: `${projectLoading ? 0 : progress}%` }} /></div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400"><span>{completedSteps} of {steps.length} stages complete</span><span className="truncate">{currentStep ? `Current: ${currentStep.label}` : "Workflow complete"}</span></div>
          </div>
          <div className="px-5 py-5">
            {steps.map((step, index) => {
              const active = step.key === currentStep?.key;
              return <div key={step.key} className="relative flex gap-4 pb-5 last:pb-0">
                {index !== steps.length - 1 && <div className={`absolute left-[15px] top-8 bottom-0 w-px ${step.done ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />}
                <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-extrabold ${step.done ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-[#123c6e] bg-[#123c6e] text-white" : "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900"}`}>{step.done ? <Check size={14} strokeWidth={3} /> : index + 1}</span>
                <div className="min-w-0 flex-1 pt-1"><div className="flex items-center justify-between gap-3"><h3 className={`text-sm font-extrabold ${active ? "text-[#123c6e] dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}>{step.label}</h3><span className="shrink-0 text-[11px] font-extrabold text-slate-500 dark:text-slate-400">{step.progress}%</span></div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.note}</p></div>
              </div>;
            })}
          </div>
          <div className="grid gap-2 border-t border-slate-200 p-5 sm:grid-cols-2 dark:border-slate-700">
            <Link to={`/projects/${project?.id}`} className="govt-button-secondary justify-center">Open project <ArrowRight size={16} /></Link>
            <Link to={canReview ? `/projects/${project?.id}/reviewer` : `/projects/${project?.id}/preview`} className="govt-button-primary justify-center">{canReview ? "Open workflow" : "Preview report"} <ArrowRight size={16} /></Link>
          </div>
        </>
      )}
    </article>
  );
}

function PanelMessage({ children }: { children: string }) {
  return <div className="border-t border-slate-200 px-5 py-12 text-center text-sm font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">{children}</div>;
}

function AdminPanel() {
  return (
    <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <PanelHeader title="Recent System Activity" subtitle="Latest platform audit entries" to="/audit" />
      <div className="divide-y divide-slate-200 px-5 pb-5 dark:divide-slate-700">
        {adminActivity.map((log) => {
          const tone = toneClasses[log.tone];
          return (
            <div key={`${log.user}-${log.time}`} className="flex items-center gap-4 py-4">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${tone.box} dark:border-slate-700 dark:bg-slate-800`}>
                <Activity size={16} className={`${tone.icon} dark:text-blue-300`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-800 dark:text-white">{log.user}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{log.action}</p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-slate-400">{log.time}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
