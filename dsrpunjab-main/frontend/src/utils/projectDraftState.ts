import { get } from "idb-keyval";
import { projectsApi } from "../api/projects.api";

type FrontMatterData = Record<string, unknown>;
type UploadRecord = { name: string; url?: string } | null;

async function readDraft<T>(key: string): Promise<T | undefined> {
  const storageKey = `dsr:${key}`;

  try {
    const localSaved = localStorage.getItem(storageKey);
    if (localSaved) return JSON.parse(localSaved) as T;
  } catch (error) {
    console.error(`Failed to read local draft ${key}:`, error);
  }

  try {
    const saved = await get(storageKey);
    return saved as T | undefined;
  } catch (error) {
    console.error(`Failed to read indexed draft ${key}:`, error);
    return undefined;
  }
}

export async function saveProjectBuilderDrafts(projectId: string | number) {
  const id = String(projectId);
  if (!/^\d+$/.test(id)) throw new Error("Project ID missing");

  const project = await projectsApi.get(id);
  const currentState = project.projectState || {};
  const savedAt = new Date().toISOString();

  const [
    frontMatterData,
    coverFile,
    certFile,
    contentFile,
    prefaceFile,
    chapters,
    plates,
    crossSections,
  ] = await Promise.all([
    readDraft<FrontMatterData>(`project-${id}:front-matter`),
    readDraft<UploadRecord>(`project-${id}:cover`),
    readDraft<UploadRecord>(`project-${id}:certificate`),
    readDraft<UploadRecord>(`project-${id}:contents`),
    readDraft<UploadRecord>(`project-${id}:preface`),
    readDraft<unknown[]>("chapters-exact"),
    readDraft<unknown[]>("plates-exact"),
    readDraft<unknown[]>("cross-sections-full"),
  ]);

  const nextState: Record<string, unknown> = { ...currentState };

  if (frontMatterData || coverFile || certFile || contentFile || prefaceFile) {
    nextState["front-matter"] = {
      ...((currentState["front-matter"] as Record<string, unknown> | undefined) || {}),
      data: frontMatterData,
      coverFile: coverFile || null,
      certFile: certFile || null,
      contentFile: contentFile || null,
      prefaceFile: prefaceFile || null,
      savedAt,
    };
  }

  if (Array.isArray(chapters)) {
    nextState.chapters = { chapters, savedAt };
  }

  if (Array.isArray(plates)) {
    nextState.plates = { plates, savedAt };
  }

  if (Array.isArray(crossSections)) {
    nextState["cross-sections"] = { graphs: crossSections, savedAt };
  }

  return projectsApi.updateState(id, { state: nextState });
}
