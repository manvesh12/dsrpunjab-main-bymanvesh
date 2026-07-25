import { useEffect, useState } from "react";
import { Clock3, Mail, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usersApi, type DelegatedSession } from "../../api/users.api";

export default function DelegatedSessionsPanel() {
  const [sessions, setSessions] = useState<DelegatedSession[]>([]);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [saving, setSaving] = useState(false);

  const load = () => usersApi.listDelegatedSessions().then(setSessions).catch(() => toast.error("Could not load delegated sessions."));
  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!email.trim()) return toast.error("Recipient email is required.");
    setSaving(true);
    try {
      await usersApi.createDelegatedSession({ recipientEmail: email.trim(), durationMinutes, label: label.trim() || undefined });
      toast.success("One-time session invitation and MFA code emailed.");
      setEmail(""); setLabel("");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create session.");
    } finally { setSaving(false); }
  };

  const revoke = async (id: string) => {
    await usersApi.revokeDelegatedSession(id);
    toast.success("Session revoked.");
    await load();
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3"><ShieldCheck className="text-blue-600" /><div>
          <h3 className="font-black text-slate-900 dark:text-white">Temporary delegated sessions</h3>
          <p className="text-xs text-slate-500">Give your dashboard access to one verified email for a limited time.</p>
        </div></div>
      </div>
      <div className="grid gap-3 p-6 md:grid-cols-[1fr_1fr_170px_auto]">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300"><span className="mb-2 block">Recipient email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@example.gov.in" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300"><span className="mb-2 block">Purpose (optional)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Review report" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300"><span className="mb-2 block">Access duration</span>
          <select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
            <option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={240}>4 hours</option><option value={1440}>1 day</option><option value={4320}>3 days</option><option value={10080}>7 days</option>
          </select>
        </label>
        <button onClick={create} disabled={saving} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Plus size={16}/>{saving ? "Sending…" : "Create"}</button>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800">
        {sessions.length === 0 ? <p className="p-6 text-sm text-slate-500">No delegated sessions created.</p> : sessions.map((session) => (
          <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 last:border-0 dark:border-slate-800">
            <div><p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><Mail size={15}/>{session.recipientEmail}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Clock3 size={13}/>{session.label || "Dashboard access"} · expires {new Date(session.expiresAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{session.status}</span>
              {!["REVOKED", "EXPIRED"].includes(session.status) && <button onClick={() => revoke(session.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Revoke session"><Trash2 size={16}/></button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
