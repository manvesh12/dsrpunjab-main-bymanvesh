import { apiClient } from "./client";

export interface BackendUserDto {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mobileNumber?: string;
  role: string;
  districtId?: number | null;
  district?: string;
  officeName?: string;
  designation?: string;
  blockName?: string;
  sectionName?: string;
  active: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  fullName: string;
  username: string;
  email: string;
  mobileNumber?: string;
  role: string;
  districtId?: number;
  officeName?: string;
  designation?: string;
  password?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {}

export interface InviteUserPayload {
  email: string;
  fullName?: string;
  role: string;
  district?: string;
  department?: string;
  designation?: string;
  mobileNumber?: string;
}

export interface BulkInviteResult {
  total: number;
  succeeded: number;
  failed: { email: string; reason: string }[];
}

export interface DelegatedSession {
  id: string;
  recipientEmail: string;
  label?: string | null;
  expiresAt: string;
  activatedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "REVOKED";
}

export const usersApi = {
  /** List all users (requires USER_VIEW permission) */
  list: async (): Promise<BackendUserDto[]> => {
    const { data } = await apiClient.get<BackendUserDto[]>("/users");
    return data;
  },

  /** Create a user directly (requires USER_CREATE permission) */
  create: async (payload: CreateUserPayload): Promise<BackendUserDto> => {
    const { data } = await apiClient.post<BackendUserDto>("/users", payload);
    return data;
  },

  /** Update a user (requires USER_EDIT permission) */
  update: async (id: string | number, payload: UpdateUserPayload): Promise<BackendUserDto> => {
    const { data } = await apiClient.put<BackendUserDto>(`/users/${id}`, payload);
    return data;
  },

  /** Activate or deactivate a user */
  setActive: async (id: string | number, active: boolean): Promise<BackendUserDto> => {
    const { data } = await apiClient.patch<BackendUserDto>(`/users/${id}/active`, { active });
    return data;
  },

  /** Delete a user permanently */
  delete: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  /** Send a single invitation email */
  invite: async (payload: InviteUserPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/users/invite", payload);
    return data;
  },

  /** Bulk invite via Excel/CSV file */
  bulkInvite: async (file: File): Promise<BulkInviteResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<BulkInviteResult>("/users/invite/bulk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /** Download the bulk invite Excel template */
  downloadTemplate: (): string => {
    return `${apiClient.defaults.baseURL}/users/invite-template`;
  },

  /** Export all user login roster as Excel */
  downloadRoster: (): string => {
    return `${apiClient.defaults.baseURL}/users/export`;
  },

  /** Download the authenticated user roster. */
  exportRoster: async (): Promise<void> => {
    const response = await apiClient.get("/users/export", { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "state-admin-roster.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  /** Request OTP to update own profile */
  requestProfileUpdateOtp: async (payload: { fullName: string; email: string; mobileNumber?: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/users/me/update-request", payload);
    return data;
  },

  /** Verify OTP to finalize profile update */
  verifyProfileUpdateOtp: async (payload: { otp: string; fullName: string; email: string; mobileNumber?: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/users/me/update-verify", payload);
    return data;
  },

  listDelegatedSessions: async (): Promise<DelegatedSession[]> => {
    const { data } = await apiClient.get<DelegatedSession[]>("/users/me/delegated-sessions");
    return data;
  },

  createDelegatedSession: async (payload: { recipientEmail: string; durationMinutes: number; label?: string }): Promise<DelegatedSession> => {
    const { data } = await apiClient.post<DelegatedSession>("/users/me/delegated-sessions", payload);
    return data;
  },

  revokeDelegatedSession: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/me/delegated-sessions/${id}`);
  },
};
