import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../../api/auth.api";
import { useAuth } from "../../security/auth.context";

export default function DelegatedSessionLoginPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { login, isAuthenticated } = useAuth();
  const [details, setDetails] = useState<{ ownerName: string; recipientEmailMasked: string; expiresAt: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setError("Session link is missing."); return; }
    authApi.getDelegatedSession(token).then(setDetails).catch((e) => setError(e?.response?.data?.message || "This session link is invalid or expired."));
  }, [token]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await authApi.verifyDelegatedSession(token, otp);
      login(response);
      toast.success("Temporary session verified.");
    } catch (e: any) { setError(e?.response?.data?.message || "Invalid MFA code."); }
    finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><ShieldCheck /></div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Secure session login</h1>
      {details && <p className="mt-2 text-sm leading-6 text-slate-500">{details.ownerName} shared temporary access with {details.recipientEmailMasked}. It expires {new Date(details.expiresAt).toLocaleString()}.</p>}
      <form onSubmit={verify} className="mt-6 space-y-4">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300"><span className="mb-2 block">6-digit MFA code</span>
          <div className="relative"><KeyRound className="absolute left-3 top-3 text-slate-400" size={18}/><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-lg tracking-[.35em] dark:border-slate-700 dark:bg-slate-800" /></div>
        </label>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={loading || otp.length !== 6 || !details} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{loading ? "Verifying…" : "Verify and open dashboard"}</button>
      </form>
      <p className="mt-5 text-xs leading-5 text-slate-500">The invitation and code work only once. This session automatically ends at the configured expiry time.</p>
    </section>
  </main>;
}
