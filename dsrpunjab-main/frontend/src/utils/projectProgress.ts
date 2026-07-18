import type { ProjectDetail, ProjectFile, ProjectListItem } from "../api/projects.api";

export type ProgressSource = Pick<ProjectListItem, "id" | "status"> & {
  projectState?: Record<string, unknown>;
  files?: ProjectFile[];
  generatedDsrs?: ProjectDetail["generatedDsrs"];
};

export type CompletionStep = { key: string; label: string; note: string; progress: number; done: boolean; locked: boolean };
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function collection(value: unknown, childKey?: string): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && childKey) {
    const nested = (value as Record<string, unknown>)[childKey];
    return Array.isArray(nested) ? nested : [];
  }
  return [];
}

function meaningful(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.some(meaningful);
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["savedAt", "updatedAt", "createdAt"].includes(key)).some(([, nested]) => meaningful(nested));
  return true;
}

function hasFile(files: ProjectFile[], matcher: RegExp) {
  return files.some((file) => matcher.test(String(file.annexureId || "")));
}

export function moduleProgress(path: string, project?: ProgressSource): number {
  if (!project) return 0;
  const state = project.projectState || {};
  const files = project.files || [];
  switch (path) {
    case "front-matter": {
      const section = state["front-matter"] as Record<string, unknown> | undefined;
      if (!section) return 0;
      const parts = [section.data, section.coverFile, section.certFile, section.contentFile, section.prefaceFile];
      return clamp((parts.filter(meaningful).length / parts.length) * 100);
    }
    case "chapters": {
      const items = collection(state.chapters, "chapters");
      return items.length ? clamp((items.filter(meaningful).length / Math.max(2, items.length)) * 100) : 0;
    }
    case "plates": return collection(state.plates, "plates").length || hasFile(files, /plate|map/i) ? 100 : 0;
    case "cross-sections": return collection(state["cross-sections"], "graphs").length || hasFile(files, /cross[-_ ]?section|graph/i) ? 100 : 0;
    case "annexures-primary": {
      const done = [1,2,3,4,5,6,7].filter((n) => meaningful(state[`annexure-${n}`]) || meaningful(state[`annexure${n}`]) || hasFile(files, new RegExp(`(?:annexure[-_ ]?)?${n}(?:\\D|$)`, "i"))).length;
      return clamp(done / 7 * 100);
    }
    case "annexures-additional": {
      const letters = "BCDEFGHIJK".split("");
      const done = letters.filter((letter) => meaningful(state[`annexure-${letter.toLowerCase()}`]) || meaningful(state[`annexure${letter}`]) || hasFile(files, new RegExp(`(?:annexure[-_ ]?)?${letter}(?:\\D|$)`, "i"))).length;
      return clamp(done / letters.length * 100);
    }
    case "annexures": return clamp((moduleProgress("annexures-primary", project) + moduleProgress("annexures-additional", project)) / 2);
    case "replenishment": return meaningful(state.replenishment) ? 100 : 0;
    case "model-dsr": return meaningful(state["model-dsr"]) || Boolean(project.generatedDsrs?.length) ? 100 : 0;
    case "reviewer": return ["Under Review", "Approved", "Completed", "COMPLETED"].includes(project.status) ? 100 : 0;
    case "preview":
    case "generate": return ["Approved", "Completed", "COMPLETED"].includes(project.status) ? 100 : 0;
    default: return 0;
  }
}

export function workflowCompletion(project?: ProgressSource): CompletionStep[] {
  const definitions = [
    ["setup", "Project Setup", "District, year and mineral details", 100],
    ["fm", "Front Matter", "Cover, certificate & table of contents", moduleProgress("front-matter", project)],
    ["chapters", "All Chapters", "Minimum 2 saved chapters required", moduleProgress("chapters", project)],
    ["plates", "Plate Section", "Add and save at least one plate", moduleProgress("plates", project)],
    ["graphs", "Cross Section Graphs", "Generate and save cross-section graphs", moduleProgress("cross-sections", project)],
    ["anx1", "Annexures I-VII", "Complete all seven primary annexures", moduleProgress("annexures-primary", project)],
    ["anxb", "Annexures B-K", "Complete all ten additional annexures", moduleProgress("annexures-additional", project)],
    ["pdf", "Final PDF Generation", "Approve and generate the final report", moduleProgress("generate", project)],
  ] as const;
  let previousDone = true;
  return definitions.map(([key, label, note, progress]) => {
    const done = progress === 100;
    const step = { key, label, note, progress, done, locked: !previousDone };
    previousDone = previousDone && done;
    return step;
  });
}

export function overallProjectProgress(project?: ProgressSource): number {
  const steps = workflowCompletion(project);
  return clamp(steps.reduce((sum, step) => sum + step.progress, 0) / steps.length);
}
