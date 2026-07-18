import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Headphones,
  Landmark,
  Lock,
  ShieldCheck,
  User,
  UsersRound,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../security/auth.context";
import { authApi } from "../../api/auth.api";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "authority">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nicId, setNicId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const identifier = activeTab === "staff" ? email.trim() : nicId.trim();
    const credential = activeTab === "staff" ? password : pin;

    try {
      const data = await authApi.login({ username: identifier, password: credential });
      login(data);
      toast.success(`Welcome back, ${data.fullName || data.username}!`);
      navigate((location.state as any)?.from?.pathname || "/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isStaff = activeTab === "staff";

  return (
    <div className="login-portal min-h-screen bg-[#eef3f7] dark:bg-slate-950">
      <div className="border-t-[3px] border-[#e9a319] bg-[#0b315d] text-white">
        <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between px-4 text-[11px] md:px-8">
          <span className="flex items-center gap-2 font-semibold"><Landmark size={13} /> Government of Punjab <span className="text-white/40">|</span> ਪੰਜਾਬ ਸਰਕਾਰ</span>
          <span className="hidden sm:inline">Official departmental system</span>
        </div>
      </div>

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/assets/Emblem_of_India.svg.png" alt="State Emblem of India" className="h-14 w-auto" />
            <div className="min-w-0 border-l border-slate-200 pl-3 dark:border-slate-700">
              <p className="truncate text-[10px] font-bold uppercase tracking-[.12em] text-[#b45309]">Department of Mines &amp; Geology</p>
              <h1 className="truncate text-base font-extrabold text-[#102f55] sm:text-xl dark:text-white">District Survey Report Portal</h1>
            </div>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#123c6e] hover:underline dark:text-blue-300"><ArrowLeft size={15} /> Back to website</Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-165px)] max-w-[1440px] items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-[1fr_500px] xl:gap-20">
        <section className="hidden lg:block">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 border-l-4 border-[#e9a319] bg-white px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-[#123c6e] shadow-sm dark:bg-slate-900 dark:text-blue-300">Secure departmental access</span>
            <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-[#102f55] xl:text-5xl dark:text-white">A single workspace for the complete DSR lifecycle</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">Prepare, review and approve district survey reports through a controlled, traceable workflow designed for government teams.</p>
          </div>

          <div className="mt-10 grid max-w-2xl gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-700">
            {[
              { icon: FileCheck2, title: "Structured reports", text: "Standardised chapters and annexures" },
              { icon: UsersRound, title: "Defined roles", text: "Access aligned to official responsibility" },
              { icon: ShieldCheck, title: "Audit ready", text: "Traceable review and approval actions" },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5 dark:bg-slate-900">
                <item.icon size={23} className="text-[#123c6e] dark:text-blue-300" />
                <h3 className="mt-4 text-sm font-extrabold text-[#102f55] dark:text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <img src="/assets/sensrs-final-logo.webp" alt="SEnSRS" className="h-8 w-auto object-contain" />
            <span>Knowledge and technical support by IIT Ropar · SEnSRS</span>
          </div>
        </section>

        <section aria-labelledby="login-heading" className="w-full overflow-hidden border border-slate-300 bg-white shadow-[0_12px_36px_rgba(15,35,60,.12)] dark:border-slate-700 dark:bg-slate-900">
          <div className="border-t-4 border-[#e9a319] px-6 pb-5 pt-6 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#b45309]">Authorised access only</p>
                <h2 id="login-heading" className="mt-2 text-2xl font-extrabold text-[#102f55] dark:text-white">Sign in to your account</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select your user category to continue.</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#eaf0f7] text-[#123c6e] dark:bg-slate-800 dark:text-blue-300"><Lock size={20} /></span>
            </div>
          </div>

          <div className="grid grid-cols-2 border-y border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => { setActiveTab("staff"); setError(null); }} className={`login-tab ${isStaff ? "is-active" : ""}`}><User size={16} /> Department Staff</button>
            <button type="button" onClick={() => { setActiveTab("authority"); setError(null); }} className={`login-tab ${!isStaff ? "is-active" : ""}`}><ShieldCheck size={16} /> Government Authority</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 p-6 sm:p-8">
            <div>
              <label htmlFor="login-id" className="login-label">{isStaff ? "Username" : "NIC / Authority ID"}</label>
              <div className="relative mt-2">
                <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="login-id" type="text" required autoComplete="username" value={isStaff ? email : nicId} onChange={(event) => isStaff ? setEmail(event.target.value) : setNicId(event.target.value)} className="login-input pl-10" placeholder={isStaff ? "Enter assigned username" : "Enter assigned authority ID"} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="login-label">{isStaff ? "Password" : "Security PIN"}</label>
                <Link to="/auth/forgot-password" className="text-xs font-bold text-[#123c6e] hover:underline dark:text-blue-300">Forgot {isStaff ? "password" : "PIN"}?</Link>
              </div>
              <div className="relative mt-2">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="login-password" type={(isStaff ? showPassword : showPin) ? "text" : "password"} required autoComplete="current-password" value={isStaff ? password : pin} onChange={(event) => isStaff ? setPassword(event.target.value) : setPin(event.target.value)} className="login-input px-10" placeholder="Enter your secure credential" />
                <button type="button" onClick={() => isStaff ? setShowPassword(!showPassword) : setShowPin(!showPin)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#123c6e]" aria-label="Show or hide credential">{(isStaff ? showPassword : showPin) ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            {error && <div role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#123c6e] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#0b315d] disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Verifying credentials…</> : <>Secure Sign In <ArrowRight size={17} /></>}
            </button>

            <div className="flex gap-3 border-t border-slate-200 pt-5 text-[11px] leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <p>By signing in, you acknowledge that this is an official system. Unauthorised access or misuse may be subject to administrative action.</p>
            </div>
          </form>

          <div className="flex items-center justify-center gap-2 bg-[#f4f7fa] px-6 py-4 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400"><Headphones size={15} /> Need help? <a href="mailto:coe@sensrs.com" className="font-bold text-[#123c6e] hover:underline dark:text-blue-300">Contact portal support</a></div>
        </section>
      </main>
    </div>
  );
}
