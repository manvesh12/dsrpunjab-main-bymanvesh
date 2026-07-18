import { useState } from "react";
import { ArrowRight, Lock, User, ShieldCheck, Home, FileCheck2, UsersRound, ScanSearch, Eye, EyeOff, Star, Shield, CheckCircle } from "lucide-react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const identifier = activeTab === "staff" ? email.trim() : nicId.trim();
    const credential = activeTab === "staff" ? password : pin;

    try {
      const data = await authApi.login({ username: identifier, password: credential });
      login(data);
      toast.success(`Welcome back, ${data.fullName || data.username}!`);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Invalid username or password. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans">
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div className="hidden lg:flex flex-col lg:w-[55%] relative overflow-hidden">
        {/* Deep government blue background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2455] via-[#1a3a6b] to-[#0d2a5c]"></div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Animated glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/15 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl animate-[pulse_7s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl animate-[pulse_5s_ease-in-out_infinite_2s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-[pulse_9s_ease-in-out_infinite_1s]"></div>

        {/* Back to Home */}
        <div className="absolute top-6 left-6 z-20">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/20">
            <Home size={15} /> Back to Home
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full p-16 pt-24">
          {/* Logo + Title */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <img src="/assets/Emblem_of_India.svg.png" alt="India Emblem" className="h-16 object-contain brightness-0 invert opacity-90" />
              <div className="h-12 w-px bg-white/20"></div>
              <img src="/assets/dsr-logo.png" alt="DSR Logo" className="h-12 object-contain brightness-0 invert opacity-90" />
            </div>
            <div className="text-amber-400/80 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
              Government of Punjab · Department of Mining & Geology
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              District Survey
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                Report Portal
              </span>
            </h1>
            <p className="text-white/60 font-medium mt-4 text-base leading-relaxed max-w-md">
              One secure workspace for preparing, reviewing and publishing compliant District Survey Reports for sand mining in Punjab.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-4 mb-10">
            {[
              {
                icon: FileCheck2,
                title: "Structured Reporting",
                desc: "Standardised chapters, annexures and front matter",
                color: "text-blue-400",
                bg: "bg-blue-400/15",
              },
              {
                icon: UsersRound,
                title: "Role-based Workflow",
                desc: "Coordinators, reviewers and authorities in one portal",
                color: "text-emerald-400",
                bg: "bg-emerald-400/15",
              },
              {
                icon: ScanSearch,
                title: "Live Validation",
                desc: "Preview and review report content before publishing",
                color: "text-amber-400",
                bg: "bg-amber-400/15",
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm hover:bg-white/10 transition-all group">
                <div className={`w-11 h-11 ${f.bg} ${f.color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm">{f.title}</h3>
                  <p className="text-white/50 text-xs font-medium mt-0.5">{f.desc}</p>
                </div>
                <CheckCircle size={16} className="ml-auto text-white/20 group-hover:text-emerald-400 transition-colors shrink-0" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-6 border-t border-white/10">
            {[
              { val: "22+", label: "Districts" },
              { val: "500+", label: "Reports" },
              { val: "5-Level", label: "E-Signatures" },
              { val: "2026", label: "Edition" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xl font-black text-amber-400">{s.val}</span>
                <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Technical support badge */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-fit">
            <img src="/assets/sensrs-final-logo.webp" alt="SEnSRS" className="h-7 object-contain brightness-200 opacity-80" />
            <div className="text-[10px] text-white/40 font-semibold leading-snug">
              Developed by <br />
              <span className="text-white/70 font-black">IIT Ropar · SEnSRS Research Cell</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT LOGIN PANEL ===== */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative transition-colors">
        {/* Dot grid bg */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:22px_22px] opacity-60"></div>
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-amber-50/30 dark:from-slate-950/80 dark:to-blue-950/30"></div>

        {/* Mobile back link */}
        <div className="lg:hidden absolute top-5 left-5 z-20">
          <Link to="/" className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#1a3a6b] dark:hover:text-blue-400 text-sm font-bold transition-colors">
            <Home size={15} /> Home
          </Link>
        </div>

        <div className="w-full max-w-md relative z-10 px-6 py-10 animate-[fadeInUp_0.5s_ease-out_forwards]">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/assets/dsr-logo.png" alt="Smart DSR Portal" className="h-14 object-contain mx-auto dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            <div className="text-sm font-black text-[#1a3a6b] dark:text-blue-400 mt-2">DSR Portal · Punjab</div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-4 h-0.5 bg-[#1a3a6b] dark:bg-blue-400"></div>
              <span className="text-[10px] font-black text-[#1a3a6b] dark:text-blue-400 uppercase tracking-widest">Secure Access</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Sign In</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Access the DSR Automation Portal</p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl p-1.5 gap-1.5 mb-6 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "staff"
                  ? "bg-[#1a3a6b] text-white shadow-lg shadow-[#1a3a6b]/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <User size={15} />
              Faculty / Staff
            </button>
            <button
              onClick={() => setActiveTab("authority")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "authority"
                  ? "bg-[#1a3a6b] text-white shadow-lg shadow-[#1a3a6b]/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <ShieldCheck size={15} />
              Govt. Authority
            </button>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
            <div className="p-8">
              {activeTab === "staff" ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="mb-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Staff Portal</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Sign in to your DSR Coordinator / Reviewer account</p>
                  </div>

                  {/* Username field */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Username</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1a3a6b]/10 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <User size={16} className="text-[#1a3a6b] dark:text-blue-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-[3.75rem] pr-4 py-3.5 focus:outline-none focus:border-[#1a3a6b] dark:focus:border-blue-500 font-semibold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm"
                        placeholder="e.g. super.admin"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Password</label>
                      <Link to="/auth/forgot-password" className="text-[10px] font-black text-[#1a3a6b] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wider">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1a3a6b]/10 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Lock size={16} className="text-[#1a3a6b] dark:text-blue-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-[3.75rem] pr-12 py-3.5 focus:outline-none focus:border-[#1a3a6b] dark:focus:border-blue-500 font-semibold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">!</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#1a3a6b] to-[#1e4a8a] hover:from-[#1e4a8a] hover:to-[#2055a0] text-white rounded-xl py-4 font-black text-base shadow-xl shadow-[#1a3a6b]/30 hover:shadow-[#1a3a6b]/50 transition-all flex justify-center items-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Authenticating…
                      </span>
                    ) : (
                      <>
                        <Shield size={18} />
                        Login to Portal
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="mb-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Govt. Authority Portal</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Sign in with your NIC credentials</p>
                  </div>

                  {/* NIC ID */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">NIC ID</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-emerald-500/10 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={nicId}
                        onChange={(e) => setNicId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-[3.75rem] pr-4 py-3.5 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-semibold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm"
                        placeholder="Enter NIC ID"
                      />
                    </div>
                  </div>

                  {/* PIN */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Security PIN</label>
                      <a href="#" className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 uppercase tracking-wider">Forgot PIN?</a>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-emerald-500/10 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <Lock size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <input
                        type={showPin ? "text" : "password"}
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-[3.75rem] pr-12 py-3.5 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-semibold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm"
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">!</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-4 font-black text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all flex justify-center items-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Verifying…
                      </span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Verify & Login
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Security badge inside card */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-8 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a3a6b]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Shield size={15} className="text-[#1a3a6b] dark:text-blue-400" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Secure access is restricted to authorized personnel only. All sessions are encrypted and logged.
              </p>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
              © 2026 Department of Mining & Geology, Government of Punjab
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 font-medium mt-1">
              Powered by <span className="font-bold text-[#1a3a6b] dark:text-blue-400">IIT Ropar · SEnSRS</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
