import { useState } from "react";
import { User, Mail, Phone, MapPin, X, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../security/auth.context";
import { usersApi } from "../../api/users.api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    mobileNumber: user?.username || "", 
  });
  
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    setIsEditing(false);
    setIsVerifying(false);
    setError("");
    setOtp("");
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.requestProfileUpdateOtp(formData);
      setIsVerifying(true);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to request profile update.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.verifyProfileUpdateOtp({ otp, ...formData });
      handleClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP or verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm dark:bg-black/80">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.uiRole || user.role}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!isEditing && !isVerifying && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Full Name</label>
                <p className="font-medium text-slate-900 dark:text-white">{user.fullName}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Username</label>
                <p className="font-medium text-slate-900 dark:text-white">{user.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Mail size={12}/> Email</label>
                <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Phone size={12}/> Mobile</label>
                <p className="font-medium text-slate-900 dark:text-white">{user.username || "N/A"}</p>
              </div>
            </div>

            {(user.scope?.districtId || user.scope?.blockName || user.scope?.sectionName) && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500"/>
                  Jurisdiction Scope
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  {user.scope.districtId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">District ID:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{user.scope.districtId}</span>
                    </div>
                  )}
                  {user.scope.blockName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Block:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{user.scope.blockName}</span>
                    </div>
                  )}
                  {user.scope.sectionName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Section:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{user.scope.sectionName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <Edit2 size={16} />
              Update Details
            </button>
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleRequestUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Requesting..." : "Continue"}
              </button>
            </div>
          </form>
        )}

        {isVerifying && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 mb-4">
              An OTP has been sent to your current email address. Please verify to apply changes.
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center tracking-widest text-lg font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="------"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setIsVerifying(false); setIsEditing(true); }}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                {loading ? "Verifying..." : "Verify & Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
