import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, BarChart3, CheckCircle2, Clock3, FolderKanban, MapPinned, PieChart, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import { projectsApi, type ProjectListItem } from "../../api/projects.api";
import { overallProjectProgress } from "../../utils/projectProgress";

type StatusBucket = "approved" | "review" | "active" | "draft" | "archived";

const statusLabels: Record<StatusBucket, string> = {
  approved: "Approved / completed",
  review: "Under review",
  active: "In progress",
  draft: "Draft",
  archived: "Archived",
};

const statusColors: Record<StatusBucket, string> = {
  approved: "bg-emerald-600",
  review: "bg-amber-500",
  active: "bg-[#123c6e]",
  draft: "bg-slate-400",
  archived: "bg-slate-700",
};

function bucketProject(project: ProjectListItem): StatusBucket {
  const status = String(project.status || "").toUpperCase();
  if (status.includes("APPROVED") || status.includes("COMPLETED")) return "approved";
  if (status.includes("REVIEW")) return "review";
  if (status.includes("ARCHIVED")) return "archived";
  if (status.includes("DRAFT")) return "draft";
  return "active";
}

function monthKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Undated";
  return date.toLocaleString("en-IN", { month: "short" });
}

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default function AnalyticsPage() {
  const {
    data: projectResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["analytics", "projects"],
    queryFn: () => projectsApi.list({ limit: 500 }),
  });

  const projects = projectResponse?.data || [];
  const analytics = useMemo(() => buildAnalytics(projects), [projects]);
  const hasProjects = projects.length > 0;

  return (
    <>
      <PageHeader
        title="Analytics Dashboard"
        description="Operational indicators generated from authorised DSR project records."
      />

      {isError ? (
        <section className="border border-red-200 bg-red-50 px-5 py-8 text-center dark:border-red-900 dark:bg-red-950/20">
          <AlertCircle className="mx-auto text-red-600 dark:text-red-300" />
          <h2 className="mt-3 text-base font-extrabold text-red-800 dark:text-red-200">Analytics could not be loaded</h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">Please refresh once the project register service is available.</p>
          <button type="button" onClick={() => void refetch()} className="mt-4 inline-flex items-center gap-2 border border-red-300 bg-white px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100 dark:bg-red-950/30">
            <RefreshCw size={14} /> Retry
          </button>
        </section>
      ) : (
        <main className="space-y-5 pb-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total DSRs" value={isLoading ? "--" : analytics.total} detail="Accessible project records" icon={FolderKanban} tone="blue" />
            <KpiCard title="Approved" value={isLoading ? "--" : analytics.status.approved} detail={`${analytics.approvedRate}% of available records`} icon={CheckCircle2} tone="green" />
            <KpiCard title="In Progress" value={isLoading ? "--" : analytics.activeWork} detail="Preparation or review active" icon={Activity} tone="amber" />
            <KpiCard title="Districts Covered" value={isLoading ? "--" : analytics.districts.length} detail="Districts represented in records" icon={MapPinned} tone="teal" />
          </section>

          {!isLoading && !hasProjects ? (
            <section className="border border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
              <BarChart3 className="mx-auto text-[#123c6e] dark:text-blue-300" size={34} />
              <h2 className="mt-3 text-lg font-extrabold text-[#102f55] dark:text-white">No analytics available yet</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Analytics will appear automatically after authorised DSR projects are created or imported.
              </p>
              <Link to="/projects" className="mt-5 inline-flex items-center gap-2 border border-[#123c6e] bg-[#123c6e] px-4 py-2 text-xs font-extrabold text-white">
                Open project register
              </Link>
            </section>
          ) : (
            <>
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
                <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <PanelHeader icon={BarChart3} title="Monthly project activity" subtitle="Records grouped by latest project update month" />
                  <div className="h-72 px-5 pb-5 pt-2">
                    <div className="flex h-full items-end gap-3">
                      {analytics.months.map((month) => (
                        <div key={month.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="flex h-56 w-full items-end bg-slate-100 dark:bg-slate-800">
                            <div className="w-full bg-[#123c6e] transition-[height]" style={{ height: `${month.height}%` }} title={`${month.count} updated project(s)`} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{month.label}</span>
                          <span className="text-xs font-extrabold text-[#102f55] dark:text-white">{isLoading ? "--" : month.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <PanelHeader icon={PieChart} title="Status distribution" subtitle="Current workflow state of available records" />
                  <div className="space-y-4 px-5 pb-5">
                    {(Object.keys(statusLabels) as StatusBucket[]).map((key) => (
                      <div key={key}>
                        <div className="mb-1.5 flex justify-between gap-3 text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{statusLabels[key]}</span>
                          <span className="font-extrabold text-[#102f55] dark:text-white">{isLoading ? "--" : `${analytics.status[key]} (${pct(analytics.status[key], analytics.total)}%)`}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full ${statusColors[key]}`} style={{ width: `${pct(analytics.status[key], analytics.total)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
                <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <PanelHeader icon={MapPinned} title="District coverage" subtitle="Records currently visible by district" />
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {analytics.districts.slice(0, 8).map((district) => (
                      <div key={district.name} className="flex items-center justify-between gap-3 px-5 py-3.5">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{district.name}</span>
                        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-extrabold text-[#102f55] dark:border-slate-700 dark:bg-slate-800 dark:text-white">{district.count}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <PanelHeader icon={Clock3} title="Latest project movement" subtitle="Most recently updated DSR records" />
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-y border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                        <tr><th className="px-5 py-3">Report</th><th className="px-4 py-3">District</th><th className="px-4 py-3">Progress</th><th className="px-5 py-3 text-right">Action</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {analytics.latest.map((project) => (
                          <tr key={project.id} className="text-slate-700 dark:text-slate-200">
                            <td className="px-5 py-3.5 font-bold text-[#102f55] dark:text-white">{project.title || project.projectName}</td>
                            <td className="px-4 py-3.5 text-xs">{project.district || "Unassigned"}</td>
                            <td className="px-4 py-3.5"><Progress value={overallProjectProgress(project)} /></td>
                            <td className="px-5 py-3.5 text-right"><Link to={`/projects/${project.id}`} className="text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Open</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>
            </>
          )}
        </main>
      )}
    </>
  );
}

function buildAnalytics(projects: ProjectListItem[]) {
  const status = { approved: 0, review: 0, active: 0, draft: 0, archived: 0 } satisfies Record<StatusBucket, number>;
  const districtCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  projects.forEach((project) => {
    status[bucketProject(project)] += 1;
    districtCounts.set(project.district || "Unassigned", (districtCounts.get(project.district || "Unassigned") || 0) + 1);
    const month = monthKey(project.updatedAt || project.createdAt);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  });

  const months = Array.from(monthCounts.entries()).slice(-6);
  const maxMonthCount = Math.max(1, ...months.map(([, count]) => count));

  return {
    total: projects.length,
    status,
    approvedRate: pct(status.approved, projects.length),
    activeWork: status.active + status.review + status.draft,
    districts: Array.from(districtCounts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    months: (months.length ? months : [["--", 0]]).map(([label, count]) => ({ label, count, height: count > 0 ? Math.max(8, pct(count, maxMonthCount)) : 0 })),
    latest: [...projects].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 6),
  };
}

function KpiCard({ title, value, detail, icon: Icon, tone }: { title: string; value: number | string; detail: string; icon: typeof FolderKanban; tone: "blue" | "green" | "amber" | "teal" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
  };
  return <article className="border border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${tones[tone]}`}><Icon size={20} /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:text-slate-400">{title}</p><p className="mt-1 text-2xl font-extrabold text-[#102f55] dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div></div></article>;
}

function PanelHeader({ icon: Icon, title, subtitle }: { icon: typeof FolderKanban; title: string; subtitle: string }) {
  return <div className="flex gap-3 border-t-4 border-[#123c6e] px-5 py-4"><Icon size={19} className="mt-0.5 text-[#a6580d]" /><div><h2 className="font-extrabold text-[#102f55] dark:text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p></div></div>;
}

function Progress({ value }: { value: number }) {
  return <div className="flex min-w-[130px] items-center gap-2"><div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800"><div className="h-full bg-[#123c6e]" style={{ width: `${value}%` }} /></div><span className="w-9 text-right text-xs font-extrabold text-[#102f55] dark:text-white">{value}%</span></div>;
}
