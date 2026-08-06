import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../../api/auth.api";
import PublicSiteFooter from "../../components/public/PublicSiteFooter";
import PublicSiteHeader from "../../components/public/PublicSiteHeader";

type RecoveryStep = "identify" | "verify" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<RecoveryStep>("identify");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const readError = (err: unknown, fallback: string) => {
    const response = (err as { response?: { data?: { message?: string; error?: string } } })?.response;
    return response?.data?.message || response?.data?.error || fallback;
  };

  const requestCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword({ identifier: identifier.trim() });
      setStep("verify");
      toast.success("A verification code has been sent to your registered contact.");
    } catch (err: unknown) {
      setError(readError(err, "We could not start password recovery. Check your username or email and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.verifyResetOtp({ identifier: identifier.trim(), otp: otp.trim() });
      if (!result.valid) throw new Error("invalid-code");
      setStep("reset");
    } catch (err: unknown) {
      setError(readError(err, "The verification code is invalid or has expired. Please request a new code."));
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The password confirmation does not match.");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetPassword({ identifier: identifier.trim(), otp: otp.trim(), newPassword });
      toast.success("Your password has been reset. You can now sign in.");
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      setError(readError(err, "We could not reset your password. Please request a new verification code."));
    } finally {
      setIsLoading(false);
    }
  };

  const formCopy = {
    identify: { eyebrow: "Account recovery", title: "Find your portal account", text: "Enter the username or official email linked to your account." },
    verify: { eyebrow: "Security verification", title: "Enter verification code", text: `Enter the code sent for ${identifier}.` },
    reset: { eyebrow: "Create new credential", title: "Reset your password", text: "Choose a strong password for your DSR Portal account." },
  }[step];

  return (
    <div className="min-h-screen bg-[#edf2f6] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <PublicSiteHeader />
      <main id="main-content" className="relative isolate overflow-hidden">
        <img src="/assets/sand_mining_scenery.png" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[#edf2f6]/94 dark:bg-slate-950/94" />
        <div className="govt-container flex min-h-[620px] items-center justify-center py-12">
          <section aria-labelledby="recovery-heading" className="w-full max-w-[520px] border border-slate-300 bg-white shadow-[0_18px_50px_rgba(15,35,60,.16)] dark:border-slate-700 dark:bg-slate-900">
            <div className="border-t-4 border-[#e49b17] p-6 sm:p-8">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#123c6e] hover:underline dark:text-blue-300"><ArrowLeft size={14} /> Back to sign in</Link>
              <div className="mt-6 flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a5708]">{formCopy.eyebrow}</p><h1 id="recovery-heading" className="mt-2 text-2xl font-extrabold text-[#103b67] dark:text-white">{formCopy.title}</h1><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{formCopy.text}</p></div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#eaf0f7] text-[#123c6e] dark:bg-slate-800 dark:text-blue-300">{step === "reset" ? <Lock size={20} /> : <ShieldCheck size={20} />}</span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Recovery progress">
                {["Account", "Verify", "Reset"].map((label, index) => {
                  const activeIndex = step === "identify" ? 0 : step === "verify" ? 1 : 2;
                  return <div key={label} className={`border-t-4 pt-2 text-center text-[10px] font-extrabold uppercase tracking-wider ${index <= activeIndex ? "border-[#e49b17] text-[#123c6e] dark:text-blue-300" : "border-slate-200 text-slate-400 dark:border-slate-700"}`}>{label}</div>;
                })}
              </div>

              {step === "identify" && (
                <form onSubmit={requestCode} className="mt-7 space-y-5">
                  <div><label htmlFor="recovery-identifier" className="login-label">Username or official email</label><div className="relative mt-2"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="recovery-identifier" required autoFocus autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="login-input pl-10 pr-4" placeholder="Enter your account identifier" /></div></div>
                  <SubmitButton loading={isLoading} label="Send verification code" />
                </form>
              )}

              {step === "verify" && (
                <form onSubmit={verifyCode} className="mt-7 space-y-5">
                  <div><label htmlFor="recovery-otp" className="login-label">Verification code</label><div className="relative mt-2"><KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="recovery-otp" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="login-input pl-10 pr-4 tracking-[.3em]" placeholder="6-digit code" /></div></div>
                  <SubmitButton loading={isLoading} label="Verify code" />
                  <button type="button" disabled={isLoading} onClick={() => { setStep("identify"); setOtp(""); setError(null); }} className="w-full text-xs font-extrabold text-[#123c6e] hover:underline disabled:opacity-50 dark:text-blue-300">Use a different account or resend</button>
                </form>
              )}

              {step === "reset" && (
                <form onSubmit={resetPassword} className="mt-7 space-y-5">
                  <div><label htmlFor="new-password" className="login-label">New password</label><div className="relative mt-2"><Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="new-password" required autoFocus type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="login-input pl-10 pr-4" placeholder="Minimum 8 characters" /></div></div>
                  <div><label htmlFor="confirm-password" className="login-label">Confirm new password</label><div className="relative mt-2"><CheckCircle2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input id="confirm-password" required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="login-input pl-10 pr-4" placeholder="Enter the same password again" /></div></div>
                  <SubmitButton loading={isLoading} label="Reset password" />
                </form>
              )}

              {error && <div role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-800 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
            </div>
          </section>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-[#123c6e] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#0b315d] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Please wait…</> : <>{label} <ArrowRight size={17} /></>}</button>;
}
