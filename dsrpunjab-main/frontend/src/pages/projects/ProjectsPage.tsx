import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, FolderKanban, Layers3, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import { projectsApi, type ProjectListItem } from "../../api/projects.api";
import { useAuth } from "../../security/auth.context";
import { isGlobalAdmin, Permission } from "../../security/access";
import { overallProjectProgress } from "../../utils/projectProgress";

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Completed: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const statusOptions = ["All", "Draft", "In Progress", "Under Review", "Approved", "Completed"];

function formatDate(value?: string) {
  if (!value) return "Not updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function districtLabel(project: ProjectListItem) {
  return project.district || (project.districtId ? `District #${project.districtId}` : "Punjab");
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyProjectId, setBusyProjectId] = useState<string | number | null>(null);

  const canDeleteProjects = hasPermission(Permission.ProjectDelete);
  const canStartNextPhase = hasPermission(Permission.ProjectEdit) && isGlobalAdmin(user);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await projectsApi.list();
      setProjects(result.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchValue = search.trim().toLowerCase();
      const name = project.projectName || project.title || "";
      const district = districtLabel(project);
      const matchesSearch =
        !searchValue ||
        name.toLowerCase().includes(searchValue) ||
        district.toLowerCase().includes(searchValue);
      const matchesStatus = status === "All" || project.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

  const openProject = (id: string | number) => {
    navigate(`/projects/${id}`);
  };

  const handleDeleteProject = async (event: React.MouseEvent, project: ProjectListItem) => {
    event.stopPropagation();
    if (!canDeleteProjects) {
      toast.error("Only administrators can delete projects.");
      return;
    }
    const name = project.title || project.projectName;
    if (!window.confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;

    setBusyProjectId(project.id);
    try {
      await projectsApi.delete(project.id);
      setProjects((current) => current.filter((item) => String(item.id) !== String(project.id)));
      toast.success("Project deleted successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to delete project.");
    } finally {
      setBusyProjectId(null);
    }
  };

  const handleNextPhase = async (event: React.MouseEvent, project: ProjectListItem) => {
    event.stopPropagation();
    if (!canStartNextPhase) {
      toast.error("Only administrators can initiate the next phase.");
      return;
    }

    const nextPhaseNo = Math.max(2, Number(project.phaseNo || 1) + 1);
    const defaultTitle = `${project.title || project.projectName} - Phase ${nextPhaseNo}`;
    const title = window.prompt("Next phase project title", defaultTitle);
    if (title === null) return;

    setBusyProjectId(project.id);
    try {
      const created = await projectsApi.nextPhase(project.id, {
        title: title.trim() || defaultTitle,
        uploadColor: "#34C759",
        phaseNo: nextPhaseNo,
      });
      setProjects((current) => [
        created,
        ...current.map((item) =>
          String(item.id) === String(project.id) ? { ...item, phaseLocked: true } : item
        ),
      ]);
      toast.success(`Phase ${created.phaseNo || nextPhaseNo} created. Source phase is locked.`);
      navigate(`/projects/${created.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to initiate next phase.");
    } finally {
      setBusyProjectId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="My DSR Projects"
        description={user?.scope?.districtId ? "Projects assigned to your district" : "All district survey reports across Punjab"}
        action={
          <Link
            to="/projects/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-blue-600/40"
          >
            <Plus size={18} />
            New Project
          </Link>
        }
      />

      <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project or district..."
            className="w-full rounded-xl border border-slate-200 bg-white/50 py-2.5 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option === "All" ? "All statuses" : option}</option>
          ))}
        </select>
      </section>

      <section className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => {
          const name = project.title || project.projectName;
          const district = districtLabel(project);
          const isBusy = String(busyProjectId) === String(project.id);
          const liveProgress = overallProjectProgress(project);

          return (
            <article
              key={project.id}
              onClick={() => openProject(project.id)}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${project.phaseLocked ? "bg-red-100 text-red-700" : Number(project.phaseNo || 1) > 1 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}>
                      Phase {project.phaseNo || 1}{project.phaseLocked ? " Locked" : ""}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-blue-700">
                    {name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {district} District · {project.year || "2025-26"}
                  </p>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {project.mineral || "Minor Minerals"}
                </span>
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${statusStyles[project.status] || "bg-blue-100 text-blue-700"}`}>
                  {project.status}
                </span>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-5">
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Last Updated: {formatDate(project.updatedAt)}
                  </span>
                  <span className={`text-sm font-black ${liveProgress === 100 ? "text-emerald-600" : "text-blue-700"}`}>
                    {liveProgress}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${liveProgress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                    style={{ width: `${liveProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openProject(project.id);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition-all hover:bg-blue-100"
                >
                  <ArrowUpRight size={16} />
                  Open
                </button>
                {canStartNextPhase && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={(event) => handleNextPhase(event, project)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                  >
                    <Layers3 size={16} />
                    Next Phase
                  </button>
                )}
                {canDeleteProjects && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={(event) => handleDeleteProject(event, project)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition-all hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {!loading && filteredProjects.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-16 text-center">
            <FolderKanban size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700">No projects found</h3>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}

        {loading && (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-16 text-center text-sm font-bold text-slate-500">
            Loading projects...
          </div>
        )}
      </section>
    </>
  );
}
