import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, MessageCircleQuestion, Send, Trash2, X } from "lucide-react";
import { findAnswer, quickQuestions } from "./knowledgeBase";

type Message = { id: number; role: "assistant" | "user"; text: string };

const welcomeMessage: Message = {
  id: 1,
  role: "assistant",
  text: "Namaste! Main DSR Help Assistant hoon. Portal, project, report, upload, workflow ya password se related sawal poochhiye.",
};

export default function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const endRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(2);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function ask(question: string) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    const match = findAnswer(cleanQuestion);
    const reply = match?.answer ?? "Mujhe is sawal ka verified jawab website help mein nahi mila. Aap project, report, upload, workflow, role, password ya support se related sawal pooch sakte hain. Technical issue ke liye coe@sensrs.com par contact karein.";
    const userMessageId = nextMessageId.current++;
    const assistantMessageId = nextMessageId.current++;
    setMessages((current) => [
      ...current,
      { id: userMessageId, role: "user", text: cleanQuestion },
      { id: assistantMessageId, role: "assistant", text: reply },
    ]);
    setInput("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="DSR Help Assistant"
          className="mb-3 flex h-[min(610px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <header className="flex items-center justify-between bg-[#12396b] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><Bot size={20} /></span>
              <div><h2 className="text-sm font-extrabold">DSR Help Assistant</h2><p className="text-[11px] text-blue-100">Website help · Free · No AI API</p></div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1.5 hover:bg-white/15"><X size={19} /></button>
          </header>

          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] px-3 py-2.5 text-sm leading-5 shadow-sm ${message.role === "user" ? "rounded-l-xl rounded-tr-xl bg-[#12396b] text-white" : "rounded-r-xl rounded-tl-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="grid gap-2 pt-1">
                {quickQuestions.map((question) => (
                  <button key={question} onClick={() => ask(question)} className="border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-[#12396b] hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                    {question}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <form onSubmit={submit} className="flex gap-2">
              <label className="sr-only" htmlFor="dsr-assistant-input">Ask a website question</label>
              <input id="dsr-assistant-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={300} placeholder="Website ke baare mein poochhiye..." className="min-w-0 flex-1 border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#12396b] focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
              <button type="submit" disabled={!input.trim()} aria-label="Send question" className="flex w-11 items-center justify-center bg-[#12396b] text-white hover:bg-[#0b315d] disabled:cursor-not-allowed disabled:opacity-40"><Send size={18} /></button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Website guidance only</span>
              <button onClick={() => setMessages([welcomeMessage])} className="flex items-center gap-1 hover:text-red-600"><Trash2 size={11} /> Clear chat</button>
            </div>
          </div>
        </section>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Minimize DSR Help Assistant" : "Open DSR Help Assistant"}
        className="ml-auto flex items-center gap-2 rounded-full border-2 border-white bg-[#12396b] px-4 py-3 text-sm font-extrabold text-white shadow-xl transition hover:bg-[#0b315d] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        {open ? <ChevronDown size={20} /> : <MessageCircleQuestion size={21} />}
        <span>{open ? "Minimize" : "DSR Help"}</span>
      </button>
    </div>
  );
}
