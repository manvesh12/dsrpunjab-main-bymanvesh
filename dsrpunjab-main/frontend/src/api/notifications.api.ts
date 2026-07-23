import { apiClient } from "./client";

export interface PortalNotification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationInbox {
  items: PortalNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  list: async (limit = 30): Promise<NotificationInbox> => {
    const { data } = await apiClient.get<NotificationInbox>("/notifications", { params: { limit } });
    return data;
  },

  markRead: async (id: number) => {
    const { data } = await apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await apiClient.patch<{ success: boolean; updated: number }>("/notifications/read-all");
    return data;
  },

  clearRead: async () => {
    const { data } = await apiClient.delete<{ success: boolean; deleted: number }>("/notifications/read");
    return data;
  },

  streamJobProgress: (jobId: string, onMessage: (data: unknown) => void): EventSource => {
    const baseUrl = apiClient.defaults.baseURL || "http://localhost:8080/api";
    const token = localStorage.getItem("dsr:auth_token") || "";
    const eventSource = new EventSource(`${baseUrl}/stream/job/${jobId}?token=${token}`);
    eventSource.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage(event.data);
      }
    };
    return eventSource;
  },
};

export function notificationHref(notification: PortalNotification) {
  const projectId = notification.type.match(/PROJECT_(\d+)/)?.[1];
  return projectId ? `/projects/${projectId}` : "/notifications";
}
