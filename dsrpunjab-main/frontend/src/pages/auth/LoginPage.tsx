import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Headphones,
  Lock,
  ShieldCheck,
  User,
  UsersRound,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../../api/auth.api";
import PublicSiteFooter from "../../components/public/PublicSiteFooter";
import PublicSiteHeader from "../../components/public/PublicSiteHeader";
import { useAuth } from "../../security/auth.context";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "authority">("staff");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [pin, setPin] = useState("");
  const [showCredential, setShowCredential] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const isStaff = activeTab === "staff";

  const selectCategory = (category: "staff" | "authority") => {
    setActiveTab(category);
    setError(null);
    setShowCredential(false);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const identifier = isStaff ? staffId.trim() : authorityId.trim();
    const credential = isStaff ? password : pin;

    try {
      const data = await authApi.login({ username: identifier, password: credential });
      login(data);
      toast.success(`Welcome back, ${data.fullName || data.username}!`);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; error?: string } } })?.response;
      setError(response?.data?.message || response?.data?.error || "The username or password is incorrect. Please check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-portal min-h-screen bg-[#edf2f6] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <PublicSiteHeader loginActive />

      <main id="main-content" className="relative isolate overflow-hidden">
        <img src="/assets/sand_mining_scenery.png" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#edf2f6] via-[#edf2f6]/96 to-[#dbe6ed]/82 dark:from-slate-950 dark:via-slate-950/96 dark:to-slate-900/88" />

        <div className="govt-container grid min-h-[680px] items-center gap-10 py-12 lg:grid-cols-[1fr_500px] xl:gap-20">
          <section className="hidden lg:block">
            <p className="inline-flex items-center gap-2 border-l-4 border-[#e49b17] bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[.13em] text-[#123c6e] shadow-sm dark:bg-slate-900/90 dark:text-blue-300"><ShieldCheck size={16} /> Secure departmental access</p>
            <h2 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-[#103b67] xl:text-5xl dark:text-white">One secure workspace for the complete DSR lifecycle</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">Prepare, review and approve district survey reports through an accountable workflow designed for authorised government teams.</p>

            <div className="mt-9 grid max-w-2xl gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-700">
              {[
                { icon: FileCheck2, title: "Structured reports", text: "Standard chapters and annexures" },
                { icon: UsersRound, title: "Defined roles", text: "Access aligned to responsibility" },
                { icon: ShieldCheck, title: "Audit ready", text: "Traceable review and approval" },
              ].map((item) => (
                <div key={item.title} className="bg-white/95 p-5 dark:bg-slate-900/95">
                  <item.icon size={23} className="text-[#0b6685] dark:text-blue-300" />
                  <h3 className="mt-4 text-sm font-extrabold text-[#103b67] dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-7 text-xs text-slate-500 dark:text-slate-400">Knowledge and technical support by IIT Ropar · SEnSRS</p>
          </section>

          <section aria-labelledby="login-heading" className="w-full overflow-hidden border border-slate-300 bg-white shadow-[0_18px_50px_rgba(15,35,60,.18)] dark:border-slate-700 dark:bg-slate-900">
            <div className="border-t-4 border-[#e49b17] px-6 pb-5 pt-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a5708]">Authorised access only</p>
                  <h2 id="login-heading" className="mt-2 text-2xl font-extrabold text-[#103b67] dark:text-white">Sign in to the DSR Portal</h2>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Choose your official user category.</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#eaf0f7] text-[#123c6e] dark:bg-slate-800 dark:text-blue-300"><Lock size={20} /></span>
              </div>
            </div>

            <div role="tablist" aria-label="User category" className="grid grid-cols-2 border-y border-slate-200 dark:border-slate-700">
              <button type="button" role="tab" aria-selected={isStaff} onClick={() => selectCategory("staff")} className={`login-tab ${isStaff ? "is-active" : ""}`}><User size={16} /> Department Staff</button>
              <button type="button" role="tab" aria-selected={!isStaff} onClick={() => selectCategory("authority")} className={`login-tab ${!isStaff ? "is-active" : ""}`}><ShieldCheck size={16} /> Government Authority</button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 p-6 sm:p-8">
              <div>
                <label htmlFor="login-id" className="login-label">{isStaff ? "Username or official email" : "Authority ID"}</label>
                <div className="relative mt-2">
                  <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-id"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={isStaff ? staffId : authorityId}
                    onChange={(event) => isStaff ? setStaffId(event.target.value) : setAuthorityId(event.target.value)}
                    className="login-input pl-10 pr-4"
                    placeholder={isStaff ? "Enter assigned username" : "Enter assigned authority ID"}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="login-label">Password</label>
                  <Link to="/forgot-password" className="text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Forgot password?</Link>
                </div>
                <div className="relative mt-2">
                  <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showCredential ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={isStaff ? password : pin}
                    onChange={(event) => isStaff ? setPassword(event.target.value) : setPin(event.target.value)}
                    className="login-input px-10"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowCredential((show) => !show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#123c6e]" aria-label={showCredential ? "Hide credential" : "Show credential"}>{showCredential ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>

              {error && <div role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

              <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 bg-[#123c6e] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#0b315d] disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Verifying credentials…</> : <>Secure Sign In <ArrowRight size={17} /></>}
              </button>

              <div className="flex gap-3 border-t border-slate-200 pt-5 text-[11px] leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <p>This is an official government system. Access is logged and limited to authorised users with assigned credentials.</p>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 bg-[#f4f7fa] px-6 py-4 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <Headphones size={15} /> Need access help?
              <a href="mailto:coe@sensrs.com" className="font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Contact portal support</a>
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
