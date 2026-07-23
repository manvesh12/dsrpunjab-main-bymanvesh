import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  MessageSquareDiff,
  Send,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { notificationsApi } from "../../api/notifications.api";
import { saveReviewerNote } from "../../api/workflow.api";

const DSR_SECTIONS = [
  { id: "front-matter", label: "Front Matter" },
  { id: "chapters", label: "Chapters" },
  { id: "plates", label: "Plates & Maps" },
  { id: "cross-sections", label: "Cross Section Graphs" },
  { id: "annexures", label: "Annexures I-VII" },
  { id: "annexures-btok", label: "Annexures B-K" },
  { id: "replenishment", label: "Replenishment Report" },
  { id: "model-dsr", label: "Model DSR" },
  { id: "preview", label: "Report Preview" },
  { id: "generate", label: "Final PDF Generation" },
] as const;

const RECIPIENTS = [
  { id: "OFFICER_1", name: "Survey Officer", role: "Officer 1" },
  { id: "OFFICER_2", name: "District Officer", role: "Officer 2" },
  { id: "GEOLOGIST", name: "Geologist", role: "Technical Review" },
  { id: "REVIEWER", name: "Reviewer", role: "Review Team" },
  { id: "DISTRICT_ADMIN", name: "District Admin", role: "District Administration" },
  { id: "STATE_ADMIN", name: "State Admin", role: "State Administration" },
  { id: "REPORT_GENERATOR", name: "Report Generator", role: "Final Publishing" },
] as const;

type ReviewNotification = {
  id: string;
  projectId: string;
  sectionId: string;
  sectionLabel: string;
  note: string;
  recipientId: string;
  recipientName: string;
  sentAt: string;
  read: boolean;
};

function detectSectionId(pathname: string) {
  if (pathname.includes("/annexures/additional/")) return "annexures-btok";
  return DSR_SECTIONS.find(({ id }) => pathname.split("/").includes(id))?.id ?? "chapters";
}

function appendNotifications(projectId: string, notifications: ReviewNotification[]) {
  try {
    const key = `dsr:review-notifs:${projectId}`;
    const existing: ReviewNotification[] = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...notifications, ...existing]));
  } catch {
    // Review delivery must not fail because local history cannot be persisted.
  }
}

type ReviewFormProps = {
  pathname: string;
  projectId: string;
};

function SectionReviewForm({ pathname, projectId }: ReviewFormProps) {
  const routeSectionId = detectSectionId(pathname);

  const [expanded, setExpanded] = useState(false);
  const [sectionId, setSectionId] = useState(routeSectionId);
  const [note, setNote] = useState("");
  const [showRecipients, setShowRecipients] = useState(false);
  const [selected, setSelected] = useState<string[]>(["REVIEWER"]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const section = DSR_SECTIONS.find((item) => item.id === sectionId) ?? DSR_SECTIONS[1];

  useEffect(() => {
    if (expanded && !sent) {
      const timer = window.setTimeout(() => textareaRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
  }, [expanded, sent]);

  const toggleRecipient = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((role) => role !== id) : [...current, id],
    );
  };

  const handleSend = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      toast.error("Please write a review note.");
      return;
    }
    if (!selected.length) {
      toast.error("Select at least one recipient.");
      return;
    }

    setSending(true);
    try {
      await saveReviewerNote(projectId, section.label, trimmedNote);
      const result = await notificationsApi.sendReview({
        projectId,
        sectionId: section.id,
        sectionLabel: section.label,
        note: trimmedNote,
        recipientRoles: selected,
      });

      const sentAt = new Date().toISOString();
      appendNotifications(
        projectId,
        selected.map((role) => {
          const recipient = RECIPIENTS.find((item) => item.id === role)!;
          return {
            id: `${Date.now()}-${role}`,
            projectId,
            sectionId: section.id,
            sectionLabel: section.label,
            note: trimmedNote,
            recipientId: role,
            recipientName: recipient.name,
            sentAt,
            read: false,
          };
        }),
      );

      setDeliveredCount(result.recipients);
      setSent(true);
      toast.success(
        result.recipients
          ? `Review sent to ${result.recipients} user(s).`
          : "Review saved, but no active users matched the selected roles.",
      );
    } catch {
      toast.error("Review could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setNote("");
    setSent(false);
    setDeliveredCount(0);
    setShowRecipients(false);
  };

  const close = () => {
    setExpanded(false);
    reset();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {expanded && (
        <div
          className="mb-3 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-600 px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-indigo-200">
                <MessageSquareDiff size={11} />
                Section Review
              </div>
              <div className="mt-0.5 text-sm font-extrabold text-white">{section.label}</div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close review"
              className="rounded-lg p-1 text-indigo-200 hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center px-5 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCheck size={26} className="text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">Review sent</p>
              <p className="mt-1 text-xs text-slate-500">
                {deliveredCount
                  ? `${deliveredCount} user(s) notified for ${section.label}.`
                  : `Review saved for ${section.label}; no matching active user was found.`}
              </p>
              <div className="mt-4 flex w-full gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Send Another
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Continue Working
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-[min(610px,calc(100vh-10rem))] overflow-y-auto p-4">
              <label
                htmlFor="review-section"
                className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400"
              >
                Review section
              </label>
              <select
                id="review-section"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
                className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {DSR_SECTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label
                htmlFor="review-feedback"
                className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400"
              >
                Your review feedback
              </label>
              <textarea
                id="review-feedback"
                ref={textareaRef}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") handleSend();
                }}
                placeholder={`What changes are needed in ${section.label}?`}
                rows={4}
                maxLength={4000}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-1.5 text-right text-[10px] text-slate-400">
                {note.length}/4000
              </div>

              <button
                type="button"
                onClick={() => setShowRecipients((current) => !current)}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <span className="flex items-center gap-1.5">
                  <User size={12} />
                  {selected.length
                    ? `${selected.length} recipient role${selected.length > 1 ? "s" : ""} selected`
                    : "Select recipients"}
                </span>
                {showRecipients ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showRecipients && (
                <div className="mt-2 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {RECIPIENTS.map((recipient) => {
                    const checked = selected.includes(recipient.id);
                    return (
                      <button
                        type="button"
                        key={recipient.id}
                        onClick={() => toggleRecipient(recipient.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                          checked ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {checked && <Check size={10} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold leading-tight">
                            {recipient.name}
                          </span>
                          <span className="block text-[9px] text-slate-400">{recipient.role}</span>
                        </span>
                      </button>
                    );
                  })}
                  <div className="flex gap-1.5 border-t border-slate-200 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setSelected(RECIPIENTS.map((recipient) => recipient.id))}
                      className="flex-1 rounded-lg py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected([])}
                      className="flex-1 rounded-lg py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      None
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !note.trim() || !selected.length}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition-transform hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send Review
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        title={`Review: ${section.label}`}
        className={`group flex items-center gap-2 rounded-2xl px-4 py-3 text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
          expanded ? "bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
        style={{ boxShadow: "0 4px 20px rgba(79,70,229,0.4)" }}
      >
        {expanded ? (
          <>
            <X size={16} />
            <span className="text-xs font-bold">Close</span>
          </>
        ) : (
          <>
            <MessageSquareDiff size={18} />
            <span className="text-left">
              <span className="block text-[9px] font-semibold uppercase opacity-80">Review</span>
              <span className="block max-w-[130px] truncate text-xs font-bold leading-tight">
                {section.label}
              </span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}

export default function SectionReviewWidget() {
  const { projectId = "1" } = useParams();
  const { pathname } = useLocation();

  if (pathname.includes("/reviewer")) return null;
  return <SectionReviewForm key={`${projectId}:${pathname}`} pathname={pathname} projectId={projectId} />;
}
