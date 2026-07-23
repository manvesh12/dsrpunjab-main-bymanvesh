import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, ChevronRight, FileCheck2, Landmark, LogOut, Menu, Search, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationHref, notificationsApi, type PortalNotification } from "../../api/notifications.api";
import { useAuth } from "../../security/auth.context";
import ThemeToggle from "../ui/ThemeToggle";

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { data: notificationInbox, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications", "inbox"],
    queryFn: () => notificationsApi.list(8),
    enabled: Boolean(user),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (!notificationOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!notificationMenuRef.current?.contains(event.target as Node)) setNotificationOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openNotification = (notification: PortalNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    setNotificationOpen(false);
    navigate(notificationHref(notification));
  };

  const unreadCount = notificationInbox?.unreadCount || 0;

  return (
    <header className="gov-header sticky top-0 z-20 bg-white dark:bg-slate-900">
      <div className="gov-utility-bar">
        <div className="flex items-center gap-2"><Landmark size={13} /><span>Government of Punjab</span><span className="opacity-50">|</span><span>Department of Mines &amp; Geology</span></div>
        <div className="hidden items-center gap-3 sm:flex"><span>ਪੰਜਾਬ ਸਰਕਾਰ</span><span className="opacity-50">|</span><span>English</span></div>
      </div>
      <div className="flex h-[76px] items-center gap-4 border-b border-slate-300 px-4 md:px-6 dark:border-slate-700">
      <button
        type="button"
        onClick={onMenuClick}
          className="rounded-sm border border-slate-300 p-2 text-[#12396b] hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
      >
        <Menu size={22} />
      </button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />

        <input
          type="search"
          placeholder="Search projects, districts and reports..."
          className="w-full rounded-sm border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#12396b] focus:ring-2 focus:ring-[#12396b]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <div ref={notificationMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((open) => !open)}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notificationOpen}
            className="relative rounded-sm border border-slate-300 p-2.5 text-[#12396b] transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell size={21} />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-900">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="fixed inset-x-3 top-[112px] z-50 overflow-hidden border border-slate-300 bg-white shadow-xl sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[390px] dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</h2>
                  <p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button type="button" onClick={() => markAllRead.mutate()} title="Mark all as read" className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-[#12396b] dark:hover:bg-slate-800">
                      <CheckCheck size={17} />
                    </button>
                  )}
                  <button type="button" onClick={() => setNotificationOpen(false)} title="Close notifications" className="rounded p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notificationsLoading ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">Loading notifications...</div>
                ) : notificationInbox?.items.length ? (
                  notificationInbox.items.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${notification.read ? "" : "bg-blue-50/70 dark:bg-blue-950/20"}`}
                    >
                      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${notification.type.includes("APPROVE") ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#12396b]"}`}>
                        {notification.type.includes("APPROVE") ? <Check size={15} /> : <FileCheck2 size={15} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-5 text-slate-800 dark:text-slate-200">{notification.message}</span>
                        <span className="mt-1 block text-[11px] text-slate-500">{new Date(notification.createdAt).toLocaleString("en-IN")}</span>
                      </span>
                      <ChevronRight size={15} className="mt-2 shrink-0 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-12 text-center">
                    <Bell size={28} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No notifications yet</p>
                    <p className="mt-1 text-xs text-slate-400">Role-specific workflow updates will appear here.</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotificationOpen(false);
                  navigate("/notifications");
                }}
                className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-4 py-3 text-xs font-bold text-[#12396b] hover:bg-slate-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
              >
                View all notifications <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-sm border border-slate-300 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex size-8 items-center justify-center rounded-sm bg-[#12396b] text-white transition-colors overflow-hidden">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </span>

          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {user?.fullName || user?.username || "User"}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {user?.uiRole || "Guest"}
            </span>
          </span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1 dark:bg-slate-700 transition-colors"></div>

        <button
          type="button"
          onClick={handleLogout}
          className="relative flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          title="Logout"
        >
          <LogOut size={19} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
      </div>
    </header>
  );
}
