import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, ChevronRight, FileCheck2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationHref, notificationsApi, type PortalNotification } from "../../api/notifications.api";
import PageHeader from "../../components/layout/PageHeader";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => notificationsApi.list(100),
    refetchInterval: 30_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh });
  const clearRead = useMutation({ mutationFn: notificationsApi.clearRead, onSuccess: refresh });

  const notifications = (data?.items || []).filter((notification) => filter === "all" || !notification.read);
  const openNotification = (notification: PortalNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    navigate(notificationHref(notification));
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Notifications"
        description="Your role-specific portal alerts and workflow updates"
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => markAllRead.mutate()} disabled={!data?.unreadCount || markAllRead.isPending} className="module-btn-secondary disabled:opacity-50">
              <CheckCheck size={16} /> Mark all read
            </button>
            <button type="button" onClick={() => clearRead.mutate()} disabled={clearRead.isPending} className="module-btn-secondary">
              <Trash2 size={16} /> Clear read
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-1 border-b border-slate-300">
        {(["all", "unread"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={`border-b-2 px-4 py-2.5 text-sm font-bold capitalize ${filter === value ? "border-[#12396b] text-[#12396b]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {value} {value === "unread" && data?.unreadCount ? `(${data.unreadCount})` : ""}
          </button>
        ))}
      </div>

      <section className="overflow-hidden border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`flex w-full items-start gap-4 border-b border-slate-200 px-4 py-4 text-left last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${notification.read ? "" : "bg-blue-50/60 dark:bg-blue-950/20"}`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${notification.type.includes("APPROVE") ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#12396b]"}`}>
                {notification.type.includes("APPROVE") ? <Check size={18} /> : <FileCheck2 size={18} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{notification.message}</span>
                  {!notification.read && <span className="size-2 shrink-0 rounded-full bg-blue-600" />}
                </span>
                <span className="mt-1 block text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString("en-IN")}</span>
              </span>
              <ChevronRight size={17} className="mt-2 shrink-0 text-slate-400" />
            </button>
          ))
        ) : (
          <div className="p-14 text-center">
            <Bell size={38} className="mx-auto mb-3 text-slate-300" />
            <h2 className="font-bold text-slate-700 dark:text-slate-200">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</h2>
            <p className="mt-1 text-sm text-slate-500">Updates assigned to your user and role will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
