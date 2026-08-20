import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Headphones,
  KeyRound,
  Lock,
  MapPin,
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

type RupnagarAuthorityRole = "DMO" | "COE_SENSRS" | "REVIEWER" | "HEAD_OFFICE";

const RUPNAGAR_AUTHORITY_ACCOUNTS: Array<{ role: RupnagarAuthorityRole; label: string; id: string }> = [
  { role: "DMO", label: "District Mining Officer", id: "dmo.rupnagar" },
  { role: "COE_SENSRS", label: "COE SEnSRS", id: "coe.rupnagar" },
  { role: "REVIEWER", label: "Government Reviewer", id: "reviewer.rupnagar" },
  { role: "HEAD_OFFICE", label: "Head Office Authority", id: "head.office.rupnagar" },
];

const DEMO_AUTHORITY_PASSWORD = "Gov@2026!Secure";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "authority">("staff");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [authorityRole, setAuthorityRole] = useState<RupnagarAuthorityRole>("DMO");
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
    if (category === "authority" && !authorityId) setAuthorityId(RUPNAGAR_AUTHORITY_ACCOUNTS[0].id);
    setError(null);
    setShowCredential(false);
  };

  const selectAuthorityRole = (role: RupnagarAuthorityRole) => {
    setAuthorityRole(role);
    setAuthorityId(RUPNAGAR_AUTHORITY_ACCOUNTS.find((account) => account.role === role)!.id);
    setError(null);
  };

  const selectAuthorityAccount = (account: (typeof RUPNAGAR_AUTHORITY_ACCOUNTS)[number]) => {
    setAuthorityRole(account.role);
    setAuthorityId(account.id);
    setError(null);
  };

  const loadDemoAuthorityCredentials = () => {
    setAuthorityId(RUPNAGAR_AUTHORITY_ACCOUNTS.find((account) => account.role === authorityRole)!.id);
    setPin(DEMO_AUTHORITY_PASSWORD);
    setError(null);
    toast.success("Rupnagar demo credentials loaded.");
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
              {!isStaff && (
                <div className="space-y-4 border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between gap-3 border-b border-emerald-200 pb-3 dark:border-emerald-900">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#103b67] dark:text-emerald-200">
                      <MapPin size={17} className="text-emerald-700 dark:text-emerald-400" /> Rupnagar District, Punjab
                    </div>
                    <span className="bg-emerald-700 px-2 py-1 text-[10px] font-extrabold tracking-wider text-white">RPN</span>
                  </div>

                  <div>
                    <label htmlFor="authority-role" className="login-label">Authority role</label>
                    <select
                      id="authority-role"
                      value={authorityRole}
                      onChange={(event) => selectAuthorityRole(event.target.value as RupnagarAuthorityRole)}
                      className="login-input mt-2 px-3 font-semibold"
                    >
                      {RUPNAGAR_AUTHORITY_ACCOUNTS.map((account) => (
                        <option key={account.role} value={account.role}>{account.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="login-label">Available Rupnagar IDs</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {RUPNAGAR_AUTHORITY_ACCOUNTS.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => selectAuthorityAccount(account)}
                          className={`border px-2.5 py-1.5 font-mono text-[11px] font-bold transition ${authorityId === account.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
                        >
                          {account.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="login-id" className="login-label">{isStaff ? "Username or official email" : "Official Authority ID / NIC ID"}</label>
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
                    placeholder={isStaff ? "Enter assigned username" : "e.g. dmo.rupnagar"}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="login-label">{isStaff ? "Password" : "Password / Security PIN"}</label>
                  <Link to="/forgot-password" className="text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300">Forgot {isStaff ? "password" : "PIN"}?</Link>
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
                    placeholder={isStaff ? "Enter your password" : "Enter your security PIN"}
                  />
                  <button type="button" onClick={() => setShowCredential((show) => !show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#123c6e]" aria-label={showCredential ? "Hide credential" : "Show credential"}>{showCredential ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>

              {!isStaff && (
                <div className="flex items-center justify-between gap-3 border border-dashed border-blue-300 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                  <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-1.5 font-extrabold text-[#123c6e] dark:text-blue-300"><KeyRound size={14} /> Demo access</p>
                    <p className="mt-1 truncate font-mono">{RUPNAGAR_AUTHORITY_ACCOUNTS.find((account) => account.role === authorityRole)!.id}</p>
                    <p className="font-mono">{DEMO_AUTHORITY_PASSWORD}</p>
                  </div>
                  <button type="button" onClick={loadDemoAuthorityCredentials} className="shrink-0 bg-[#123c6e] px-3 py-2 text-[11px] font-extrabold text-white hover:bg-[#0b315d]">Use credentials</button>
                </div>
              )}

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
