import { Bell, Menu, Search, User, LogOut, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../security/auth.context";
import ThemeToggle from "../ui/ThemeToggle";

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

        <button
          type="button"
          className="relative rounded-sm border border-slate-300 p-2.5 text-[#12396b] hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell size={21} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
        </button>

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
