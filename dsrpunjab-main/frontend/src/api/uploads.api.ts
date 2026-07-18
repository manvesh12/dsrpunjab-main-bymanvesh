import { apiClient } from "./client";

export interface FileMetadata {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  downloadUrl?: string;
  createdAt?: string;
  uploadedAt?: string;
}

export function resolveUploadUrl(url?: string): string {
  if (!url) return "";
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;

  const apiBase = String(apiClient.defaults.baseURL || "").replace(/\/$/, "");
  const backendOrigin = apiBase.replace(/\/api$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;

  if (path.startsWith("/api/")) return `${backendOrigin}${path}`;
  return `${apiBase}${path}`;
}

export function uploadErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: string; message?: string } } }).response?.data;
    return data?.message || data?.error || "Upload failed";
  }
  return error instanceof Error ? error.message : "Upload failed";
}

export const uploadsApi = {
  /** Upload a file generically to the backend */
  upload: async (file: File, projectId?: string | number, moduleName?: string): Promise<FileMetadata> => {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) formData.append("projectId", String(projectId));
    if (moduleName) formData.append("module", moduleName);
    const { data } = await apiClient.post<FileMetadata>("/files/upload", formData, {
      params: { projectId, module: moduleName },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      ...data,
      url: resolveUploadUrl(data.url),
      downloadUrl: data.downloadUrl ? resolveUploadUrl(data.downloadUrl) : undefined,
    };
  },

  /** Get the download URL for a file */
  getDownloadUrl: (identifier: string): string => {
    return resolveUploadUrl(`/api/files/download/${identifier}`);
  },

  /** Delete an uploaded file */
  delete: async (identifier: string): Promise<void> => {
    await apiClient.delete(`/files/${identifier}`);
  },
};
