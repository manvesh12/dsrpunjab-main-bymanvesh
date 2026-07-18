import { useState } from "react";
import {
  UserCircle,
  Lock,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  Edit3,
  Save,
  X,
  CheckCircle,
  Key,
  Activity,
  Building2,
  BadgeCheck,
  Camera,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../security/auth.context";
import { toast } from "sonner";

type Tab = "overview" | "security" | "activity";

const activityLog = [
  { action: "Logged in", time: "Today, 2:14 PM", icon: "🔐", color: "blue" },
  { action: "Edited Annexure II — Jalandhar Project", time: "Today, 1:47 PM", icon: "📝", color: "emerald" },
  { action: "Downloaded PDF Report", time: "Today, 11:30 AM", icon: "📥", color: "purple" },
  { action: "Added cross-section graph", time: "Yesterday, 4:05 PM", icon: "📊", color: "amber" },
  { action: "Submitted review note", time: "Yesterday, 2:30 PM", icon: "✅", color: "emerald" },
  { action: "Updated profile details", time: "17 Jul 2026, 10:00 AM", icon: "👤", color: "blue" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
        toast.success("Profile photo updated! Click save to apply changes.");
        setEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.username || "",
    email: user?.email || "",
    mobile: "",
    designation: "",
    district: "",
    department: "Department of Mining & Geology, Punjab",
  });

  const handleSave = () => {
    setEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancel = () => {
    setEditing(false);
    setProfilePhotoPreview(null);
    setForm({
      fullName: user?.fullName || user?.username || "",
      email: user?.email || "",
      mobile: form.mobile,
      designation: form.designation,
      district: form.district,
      department: form.department,
    });
  };

  const initials = (user?.fullName || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <PageHeader
        title="My Profile"
        description="View and manage your account information, security settings, and activity."
        action={
          <div className="flex items-center gap-2 text-slate-500 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200">
            <UserCircle size={16} />
            <span className="text-sm font-semibold">{user?.uiRole || "User"}</span>
          </div>
        }
      />

      {/* Profile hero card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-6 pb-6 -mt-10 flex items-end justify-between">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="flex size-20 items-center justify-center rounded-2xl border-4 border-white bg-blue-600 text-white text-2xl font-black shadow-md overflow-hidden">
                {profilePhotoPreview || (user as any)?.profilePhoto ? (
                  <img 
                    src={profilePhotoPreview || (user as any)?.profilePhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <label title="Upload Profile Photo" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl border-4 border-transparent backdrop-blur-sm">
                <Camera size={20} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {user?.fullName || user?.username || "Unknown User"}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  <BadgeCheck size={11} />
                  {user?.uiRole || "User"}
                </span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </div>
            </div>
          </div>
          {!editing && activeTab === "overview" && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/40 border border-slate-200/60 rounded-xl mb-6 w-fit shadow-sm backdrop-blur-sm">
        {(
          [
            { id: "overview", label: "Overview", icon: <UserCircle size={16} /> },
            { id: "security", label: "Security", icon: <Lock size={16} /> },
            { id: "activity", label: "Activity", icon: <Activity size={16} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditing(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-white hover:text-blue-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
          {/* Left: editable fields */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCircle size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-800">Personal Information</h2>
              </div>
              {editing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Save size={13} /> Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              {[
                { key: "fullName", label: "Full Name", icon: <UserCircle size={15} />, type: "text" },
                { key: "email", label: "Email Address", icon: <Mail size={15} />, type: "email" },
                { key: "mobile", label: "Mobile Number", icon: <Phone size={15} />, type: "text", placeholder: "+91 98765 43210" },
                { key: "designation", label: "Designation", icon: <Building2 size={15} />, type: "text", placeholder: "e.g. District Officer" },
                { key: "district", label: "District", icon: <MapPin size={15} />, type: "text", placeholder: "e.g. Ludhiana" },
                { key: "department", label: "Department", icon: <Shield size={15} />, type: "text" },
              ].map(({ key, label, icon, type, placeholder }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {icon} {label}
                  </label>
                  {editing ? (
                    <input
                      type={type}
                      value={(form as any)[key]}
                      placeholder={placeholder}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-800 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                      {(form as any)[key] || <span className="text-slate-400 font-normal">Not set</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Account Info</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: "Username", value: user?.username, icon: <UserCircle size={14} /> },
                  { label: "Role", value: user?.uiRole, icon: <Shield size={14} /> },
                  { label: "Member Since", value: "Jan 2025", icon: <Clock size={14} /> },
                  { label: "Last Login", value: "Today, 2:14 PM", icon: <CheckCircle size={14} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      {icon} {label}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <BadgeCheck size={18} className="text-blue-600" />
                <span className="font-bold text-blue-800 text-sm">Verified Account</span>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Your account is verified and linked to the Punjab DSR Portal. Contact admin for role changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="max-w-2xl space-y-5">
          {/* Password */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
              <Key size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-800">Password</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                For security reasons, password changes are handled via a reset email sent to your registered address.
              </p>
              <button
                onClick={() => toast.info("Password reset email sent to " + (user?.email || "your email"))}
                className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Lock size={16} /> Request Password Reset
              </button>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
              <Shield size={18} className="text-emerald-600" />
              <h2 className="font-bold text-slate-800">Active Sessions</h2>
            </div>
            <div className="p-6 space-y-3">
              {[
                { device: "Chrome on Windows", location: "Chandigarh, Punjab", time: "Active now", current: true },
                { device: "Safari on iPhone", location: "Ludhiana, Punjab", time: "2 hours ago", current: false },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{session.device}</p>
                    <p className="text-xs text-slate-500">{session.location} · {session.time}</p>
                  </div>
                  {session.current ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5">
                      <CheckCircle size={10} /> Current
                    </span>
                  ) : (
                    <button
                      onClick={() => toast.success("Session revoked")}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Activity Tab ── */}
      {activeTab === "activity" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
              <Activity size={18} className="text-purple-600" />
              <h2 className="font-bold text-slate-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activityLog.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <span className="text-xl w-8 text-center">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 text-center border-t border-slate-100">
              <button className="text-xs font-bold text-blue-600 hover:underline">
                Load More
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
