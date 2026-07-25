import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck, Camera, CheckCircle2, KeyRound, LockKeyhole, Mail, MapPin,
  Pencil, Phone, Save, ShieldCheck, Sparkles, UserRound, X,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { usersApi } from "../../api/users.api";
import { useAuth } from "../../security/auth.context";
import { toast } from "sonner";

type FormState = {
  fullName: string;
  email: string;
  mobileNumber: string;
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    mobileNumber: "",
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: user?.fullName || "",
      email: user?.email || "",
    }));
  }, [user?.fullName, user?.email]);

  const initials = (user?.fullName || user?.username || "SA")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const resetEditor = () => {
    setEditing(false);
    setOtpSent(false);
    setOtp("");
    setPhotoPreview(null);
    setForm({
      fullName: user?.fullName || "",
      email: user?.email || "",
      mobileNumber: "",
    });
  };

  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile image must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result));
      setEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const requestOtp = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await usersApi.requestProfileUpdateOtp(form);
      setOtpSent(true);
      toast.success(response.message || "Verification code sent.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not send verification code.");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (otp.length < 4) {
      toast.error("Enter the verification code sent to your email.");
      return;
    }
    setSaving(true);
    try {
      const response = await usersApi.verifyProfileUpdateOtp({ ...form, otp });
      updateUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        ...(photoPreview ? { profilePhoto: photoPreview } : {}),
      });
      toast.success(response.message || "Profile updated successfully.");
      setEditing(false);
      setOtpSent(false);
      setOtp("");
      setPhotoPreview(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  const avatar = photoPreview || user?.profilePhoto;

  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      <PageHeader
        title="My Profile"
        description="Manage your State Administrator identity and account security."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 size={14} /> Active account
          </span>
        }
      />

      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl shadow-blue-950/15 sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 size-40 rounded-full bg-blue-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white/20 bg-white/10 text-3xl font-black shadow-2xl backdrop-blur">
                {avatar ? <img src={avatar} alt="State Admin" className="size-full object-cover" /> : initials}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-lg transition hover:scale-105"
                aria-label="Change profile photo"
              >
                <Camera size={17} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={selectPhoto} />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">Punjab DSR Portal</span>
                <BadgeCheck size={18} className="text-cyan-300" />
              </div>
              <h2 className="text-2xl font-black sm:text-3xl">{user?.fullName || "State Admin"}</h2>
              <p className="mt-1 text-sm text-blue-100">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            <Pencil size={15} /> Edit profile
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">Administrator details</h3>
              <p className="mt-1 text-xs text-slate-500">Verified identity used across portal activity and reports.</p>
            </div>
            <UserRound className="text-blue-600" size={22} />
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Detail icon={<UserRound />} label="Full name" value={user?.fullName || "State Admin"} />
            <Detail icon={<Mail />} label="Official email" value={user?.email || "—"} />
            <Detail icon={<ShieldCheck />} label="Access level" value="State Admin · Full access" />
            <Detail icon={<MapPin />} label="Jurisdiction" value={user?.accessLabel || "Punjab · All districts"} />
            <Detail icon={<Sparkles />} label="Username" value={user?.username || "state.admin"} />
            <Detail icon={<CheckCircle2 />} label="Account status" value="Active and verified" />
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white">Single administrator mode</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This account has statewide access. No additional portal roles are enabled.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <LockKeyhole size={19} />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Password security</p>
                <p className="text-xs text-slate-500">Use Forgot Password on login to reset securely.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Update profile</h3>
                <p className="text-xs text-slate-500">Changes are protected with email verification.</p>
              </div>
              <button onClick={resetEditor} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-6">
              <Field icon={<UserRound />} label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} disabled={otpSent} />
              <Field icon={<Mail />} label="Official email" value={form.email} type="email" onChange={(value) => setForm({ ...form, email: value })} disabled={otpSent} />
              <Field icon={<Phone />} label="Mobile number (optional)" value={form.mobileNumber} onChange={(value) => setForm({ ...form, mobileNumber: value })} disabled={otpSent} />
              {otpSent && <Field icon={<KeyRound />} label="Verification code" value={otp} onChange={setOtp} autoFocus />}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <button onClick={resetEditor} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button
                onClick={otpSent ? saveProfile : requestOtp}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
              >
                {otpSent ? <Save size={15} /> : <Mail size={15} />}
                {saving ? "Please wait…" : otpSent ? "Verify & save" : "Send verification code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-2 flex items-center gap-2 text-slate-400 [&>svg]:size-15">{icon}<span className="text-[11px] font-bold uppercase tracking-wider">{label}</span></div>
      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function Field({ icon, label, value, onChange, type = "text", disabled, autoFocus }: {
  icon: React.ReactNode; label: string; value: string; onChange: (value: string) => void;
  type?: string; disabled?: boolean; autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 [&>svg]:size-14">{icon}{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </label>
  );
}
