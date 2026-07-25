import React, { useState, useRef } from 'react';
import {
  Users, Plus, Upload, Search, Shield, ChevronDown,
  MapPin, CheckCircle, XCircle, Clock, AlertCircle, Download, X,
  Eye, UserCheck, RefreshCw, Lock, Send,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../security/auth.context';
import { usersApi, type BackendUserDto } from '../../../api/users.api';
import type { UserRole } from '../../../types/auth.types';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortalUser extends BackendUserDto {}

// ─── Constants ────────────────────────────────────────────────────────────────

const PUNJAB_DISTRICTS = [
  'All', 'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib',
  'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar',
  'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Pathankot',
  'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur',
  'Shaheed Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran',
];

const ALL_ROLES: UserRole[] = [
  'State Admin',
];

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  'State Admin':    { bg: 'bg-blue-55 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-700/50' },
};

const ROLE_TO_BACKEND: Record<UserRole, string> = {
  'State Admin': 'STATE_ADMIN',
};

function roleCode(role: UserRole | string) {
  return ROLE_TO_BACKEND[role as UserRole] || String(role).toUpperCase().replace(/\s+/g, "_");
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  active:    { label: 'Active',    icon: CheckCircle, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/40' },
  inactive:  { label: 'Inactive',  icon: XCircle,     color: 'text-rose-700 dark:text-rose-450',     bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700/40' },
};

// Removed mock data hook

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <Shield size={9} />
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const cfg = active ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600', 'bg-indigo-600'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} ${colors[colorIdx]} rounded-full flex items-center justify-center font-black text-white shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

export interface AddUserModalProps {
  onClose: () => void;
  onSuccess: (user: PortalUser) => void;
}

export function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', department: '', designation: '',
    district: 'All', role: 'State Admin' as UserRole, state: 'Punjab',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.district) errs.district = 'District is required';
    if (!form.role) errs.role = 'Role is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await usersApi.invite({
        email: form.email,
        fullName: form.name,
        role: roleCode(form.role),
        district: form.district,
        department: form.department,
        designation: form.designation,
        mobileNumber: form.mobile,
      });
      toast.success(`Invitation sent to ${form.email}`);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-600/20 border border-blue-100 dark:border-blue-600/30 rounded-xl flex items-center justify-center">
              <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Invite Single User</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">An invitation email will be sent</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input
                type="text" value={form.name} onChange={e => set('name', e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                placeholder="Officer's full name"
              />
              {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                placeholder="user@domain.gov.in"
              />
              {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
              <input
                type="text" value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Mines & Geology"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
              <input
                type="text" value={form.designation} onChange={e => set('designation', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="SDO / AXEN etc."
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">State</label>
              <input
                type="text" value={form.state} readOnly
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl px-4 py-2.5 text-sm font-medium cursor-not-allowed"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mobile (Optional)</label>
              <input
                type="text" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="10-digit number"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">District *</label>
              <select
                value={form.district} onChange={e => set('district', e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors.district ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium`}
              >
                <option value="">Select district</option>
                {PUNJAB_DISTRICTS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.district && <p className="text-red-550 dark:text-red-400 text-xs mt-1">{errors.district}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Role *</label>
              <select
                value={form.role} onChange={e => set('role', e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors.role ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium`}
              >
                <option value="">Select role</option>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-red-550 dark:text-red-400 text-xs mt-1">{errors.role}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-sm font-bold transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25"
          >
            {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Invite Modal ────────────────────────────────────────────────────────

export interface BulkInviteResult {
  success: number;
  failed: { row: number; email: string; reason: string }[];
}

export function BulkInviteModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkInviteResult | null>(null);

  const handleFile = (f: File) => {
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      setFile(f);
    } else {
      alert('Please upload a .csv or .xlsx file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await usersApi.bulkInvite(file);
      setResult({
        success: data.succeeded,
        failed: data.failed.map((f, i) => ({ row: i + 1, email: f.email, reason: f.reason })),
      });
      toast.success(`Successfully invited ${data.succeeded} users.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to process bulk invite');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const url = usersApi.downloadTemplate();
    const a = document.createElement('a');
    a.href = url; a.download = 'bulk-invite-template.xlsx'; a.click();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-600/20 border border-purple-100 dark:border-purple-600/30 rounded-xl flex items-center justify-center">
              <Upload size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Bulk Invite Users</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload Excel or CSV to invite multiple users</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        <div className="p-6">
          {!result ? (
            <>
              {/* Info banner */}
              <div className="flex gap-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-5">
                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                  Upload a file with headers: <strong>Email</strong>, <strong>Phone</strong> (or <strong>Mobile</strong>), <strong>Role</strong>, <strong>District</strong>, <strong>Department</strong>, <strong>Designation</strong>.
                  Invitations will be sent automatically via Email or SMS.
                </p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20' : file ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="sr-only"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                      <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">{file.name}</p>
                      <p className="text-xs text-slate-505 dark:text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-650 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Upload size={24} className="text-slate-450 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Drop file here or click to upload</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Supports .CSV and .XLSX formats</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Template download */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-305 font-semibold mt-4 transition-colors"
              >
                <Download size={14} /> Download Template CSV
              </button>
            </>
          ) : (
            /* Results */
            <div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700/40 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{result.success}</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mt-1">Invitations Sent</div>
                </div>
                <div className="bg-rose-50 dark:bg-red-900/30 border border-rose-100 dark:border-red-700/40 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-rose-650 dark:text-red-400">{result.failed.length}</div>
                  <div className="text-xs font-bold text-rose-600 dark:text-red-505 mt-1">Failed Rows</div>
                </div>
              </div>

              {result.failed.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider mb-3">Error Details</p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                    {result.failed.map((f) => (
                      <div key={f.row} className="flex items-start gap-3 px-4 py-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-8 shrink-0">#{f.row}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-350 truncate">{f.email}</p>
                          <p className="text-xs text-red-650 dark:text-red-400 mt-0.5">{f.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25"
            >
              {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              {isProcessing ? 'Processing...' : 'Upload & Process'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Role Dropdown ───────────────────────────────────────────────────────

function RoleDropdown({ currentRole, onUpdate, onClose }: {
  currentRole: UserRole;
  onUpdate: (role: UserRole) => void; onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
      {ALL_ROLES.map(role => (
        <button
          key={role}
          onClick={() => { onUpdate(role); onClose(); }}
          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors ${
            role === currentRole ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-350' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-705 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {role === currentRole && <CheckCircle size={12} className="text-blue-600 dark:text-blue-400" />}
          {role !== currentRole && <div className="w-3" />}
          {role}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserManagementPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: portalUsers = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDistrict, setFilterDistrict] = useState('All');

  const filtered = portalUsers.filter(u => {
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || (filterStatus === 'active' ? u.active : !u.active);
    const matchDistrict = filterDistrict === 'All' || u.district === filterDistrict;
    return matchSearch && matchStatus && matchDistrict;
  });

  const stats = {
    total: portalUsers.length,
    active: portalUsers.filter(u => u.active).length,
    inactive: portalUsers.filter(u => !u.active).length,
  };

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => usersApi.setActive(id, active),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update user status');
    }
  });

  const handleStatusToggle = (userId: string, active: boolean) => {
    if (portalUsers.length === 1 || String(currentUser?.username).toLowerCase() === 'state.admin') {
      toast.info('The primary State Admin account must remain active.');
      return;
    }
    toggleStatusMutation.mutate({ id: userId, active: !active });
  };

  const exportMutation = useMutation({
    mutationFn: usersApi.exportRoster,
    onSuccess: () => toast.success('Administrator roster downloaded.'),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not download the roster.'),
  });

  return (
    <div className="min-h-full text-slate-900 dark:text-white font-sans">

      <div className="p-6 max-w-full">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-600/20 border border-blue-100 dark:border-blue-600/30 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Administrator Account</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-13">
              Review the single State Administrator account and its statewide access.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            >
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending || portalUsers.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25"
            >
              <Download size={15} /> Export roster
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Users',  value: stats.total,    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-sm' },
            { label: 'Active',       value: stats.active,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-sm' },
            { label: 'Inactive',     value: stats.inactive, color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-sm' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-205 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-550 transition-all"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-805 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* District filter */}
            <select
              value={filterDistrict}
              onChange={e => setFilterDistrict(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-805 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              {PUNJAB_DISTRICTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing <span className="text-slate-800 dark:text-slate-200">{filtered.length}</span> of <span className="text-slate-800 dark:text-slate-200">{portalUsers.length}</span> users
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Logged in as: <span className="text-blue-600 dark:text-blue-400">{currentUser?.fullName} ({currentUser?.uiRole})</span>
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/55 dark:bg-slate-900/50">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">District</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Access</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-16 text-center text-sm font-semibold text-slate-500">Loading administrator account…</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="py-16 text-center text-sm font-semibold text-rose-600">Could not load the administrator account. Use Refresh to try again.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={32} className="opacity-30" />
                        <span>No users found matching your filters</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                          <p className="text-xs text-slate-505 dark:text-slate-400 font-medium truncate">{user.email}</p>
                          {user.mobileNumber && <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{user.mobileNumber}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <RoleBadge role="State Admin" />
                    </td>

                    {/* District */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <MapPin size={11} className="text-slate-400 dark:text-slate-600" />
                        {user.district || 'All'}
                      </div>
                    </td>

                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Shield size={11} /> Full statewide access
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge active={user.active} />
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleStatusToggle(user.id, user.active)}
                          title="Primary account is protected"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                        >
                          <Lock size={12} /> Protected
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
