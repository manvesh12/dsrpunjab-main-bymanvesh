import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, LoaderCircle, MessageCircleQuestion, Send, Sparkles, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { findAnswer, quickQuestions } from "./knowledgeBase";
import type { Language } from "./knowledgeBase";

type Message = { id: number; role: "assistant" | "user"; text: string };

const copy = {
  en: {
    title: "DSR Guide Assistant",
    subtitle: "English • Step-by-step portal help",
    welcome: "Hello! I’m your DSR Punjab guide. Ask me about projects, reports, uploads, workflow, passwords or portal roles. I’ll guide you step by step.",
    prompt: "Ask about the DSR Punjab portal…",
    ask: "Ask a portal question",
    thinking: "Finding the right steps…",
    guidance: "Guidance based on portal help",
    clear: "Clear chat",
    minimize: "Minimize",
    open: "Ask DSR Guide",
    fallback: "I could not find a verified answer for that question. Try asking about creating a project, uploading a report, the DSR workflow, portal roles, password reset or technical support.\n\nFor a technical issue, contact coe@sensrs.com and include the project name, page and a screenshot. Never share your password or OTP.",
  },
  pa: {
    title: "DSR ਮਾਰਗਦਰਸ਼ਕ ਸਹਾਇਕ",
    subtitle: "ਪੰਜਾਬੀ • ਕਦਮ-ਦਰ-ਕਦਮ ਪੋਰਟਲ ਸਹਾਇਤਾ",
    welcome: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ DSR ਪੰਜਾਬ ਮਾਰਗਦਰਸ਼ਕ ਹਾਂ। ਪ੍ਰੋਜੈਕਟ, ਰਿਪੋਰਟ, ਅੱਪਲੋਡ, ਵਰਕਫਲੋ, ਪਾਸਵਰਡ ਜਾਂ ਪੋਰਟਲ ਭੂਮਿਕਾਵਾਂ ਬਾਰੇ ਪੁੱਛੋ। ਮੈਂ ਤੁਹਾਨੂੰ ਕਦਮ-ਦਰ-ਕਦਮ ਮਦਦ ਕਰਾਂਗਾ।",
    prompt: "DSR ਪੰਜਾਬ ਪੋਰਟਲ ਬਾਰੇ ਪੁੱਛੋ…",
    ask: "ਪੋਰਟਲ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ",
    thinking: "ਸਹੀ ਕਦਮ ਲੱਭੇ ਜਾ ਰਹੇ ਹਨ…",
    guidance: "ਪੋਰਟਲ ਸਹਾਇਤਾ ਅਧਾਰਿਤ ਮਾਰਗਦਰਸ਼ਨ",
    clear: "ਚੈਟ ਸਾਫ਼ ਕਰੋ",
    minimize: "ਛੋਟਾ ਕਰੋ",
    open: "DSR ਮਦਦ ਪੁੱਛੋ",
    fallback: "ਇਸ ਸਵਾਲ ਦਾ ਪੱਕਾ ਜਵਾਬ ਪੋਰਟਲ ਸਹਾਇਤਾ ਵਿੱਚ ਨਹੀਂ ਮਿਲਿਆ। ਨਵਾਂ ਪ੍ਰੋਜੈਕਟ ਬਣਾਉਣ, ਰਿਪੋਰਟ ਅੱਪਲੋਡ ਕਰਨ, DSR ਵਰਕਫਲੋ, ਪੋਰਟਲ ਭੂਮਿਕਾਵਾਂ, ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਜਾਂ ਤਕਨੀਕੀ ਸਹਾਇਤਾ ਬਾਰੇ ਪੁੱਛੋ।\n\nਤਕਨੀਕੀ ਸਮੱਸਿਆ ਲਈ coe@sensrs.com ਉੱਤੇ ਪ੍ਰੋਜੈਕਟ ਦਾ ਨਾਮ, ਪੰਨਾ ਅਤੇ ਸਕ੍ਰੀਨਸ਼ਾਟ ਭੇਜੋ। ਆਪਣਾ ਪਾਸਵਰਡ ਜਾਂ OTP ਕਦੇ ਸਾਂਝਾ ਨਾ ਕਰੋ।",
  },
};

function welcomeMessage(language: Language): Message {
  return { id: 1, role: "assistant", text: copy[language].welcome };
}

export default function SiteAssistant() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextMessageId = useRef(2);
  const replyTimer = useRef<number | null>(null);
  const activeLanguage: Language = language ?? "en";
  const hiddenOnAuthPage = pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, thinking]);

  useEffect(() => () => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
  }, []);

  function switchLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setMessages([welcomeMessage(nextLanguage)]);
    setInput("");
    setThinking(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function ask(question: string) {
    const cleanQuestion = question.trim();
    if (!language || !cleanQuestion || thinking) return;
    const match = findAnswer(cleanQuestion, language);
    const userMessageId = nextMessageId.current++;
    setMessages((current) => [...current, { id: userMessageId, role: "user", text: cleanQuestion }]);
    setInput("");
    setThinking(true);
    replyTimer.current = window.setTimeout(() => {
      setMessages((current) => [...current, { id: nextMessageId.current++, role: "assistant", text: match?.answer ?? copy[language].fallback }]);
      setThinking(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }, 450);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  function clearChat() {
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    setThinking(false);
    setLanguage(null);
    setMessages([]);
    setInput("");
  }

  if (hiddenOnAuthPage) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] sm:bottom-6 sm:right-6">
      {open && (
        <section aria-label={copy[activeLanguage].title} className="mb-3 flex h-[min(650px,calc(100vh-7rem))] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="bg-[#12396b] px-4 pb-3 pt-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15"><Bot size={21} /></span>
                <div><h2 className="text-sm font-extrabold">{copy[activeLanguage].title}</h2><p className="mt-0.5 text-[11px] text-blue-100">{copy[activeLanguage].subtitle}</p></div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-lg p-1.5 hover:bg-white/15"><X size={19} /></button>
            </div>
            {language && <div className="mt-3 flex w-fit rounded-lg bg-[#0b2f59] p-1" role="group" aria-label="Chat language">
              {(["en", "pa"] as Language[]).map((item) => (
                <button key={item} type="button" onClick={() => switchLanguage(item)} aria-pressed={language === item} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${language === item ? "bg-white text-[#12396b] shadow" : "text-blue-100 hover:bg-white/10"}`}>
                  {item === "en" ? "English" : "ਪੰਜਾਬੀ"}
                </button>
              ))}
            </div>}
          </header>

          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
            {!language && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-[#12396b]"><MessageCircleQuestion size={27} /></span>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Choose your language</h3>
                <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">Select a language to continue, then ask your question.</p>
                <div className="mt-6 grid w-full max-w-xs gap-3">
                  <button type="button" onClick={() => switchLanguage("en")} className="rounded-xl bg-[#12396b] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0b315d]">English</button>
                  <button type="button" onClick={() => switchLanguage("pa")} className="rounded-xl border-2 border-[#12396b] bg-white px-4 py-3 text-sm font-bold text-[#12396b] hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-200">Punjabi / ਪੰਜਾਬੀ</button>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] whitespace-pre-line px-3.5 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "rounded-2xl rounded-br-sm bg-[#12396b] text-white" : "rounded-2xl rounded-bl-sm border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800"><LoaderCircle size={15} className="animate-spin" />{copy[activeLanguage].thinking}</div></div>
            )}
            {messages.length === 1 && !thinking && (
              <div className="pt-1">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500"><Sparkles size={13} />{language === "en" ? "Try a guided question" : "ਮਾਰਗਦਰਸ਼ਿਤ ਸਵਾਲ ਚੁਣੋ"}</div>
                <div className="grid gap-2">
                  {quickQuestions[activeLanguage].map((question) => (
                    <button key={question} type="button" onClick={() => ask(question)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-left text-xs font-semibold leading-5 text-[#12396b] transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {language && <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <form onSubmit={submit} className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-1.5 focus-within:border-[#12396b] focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-600 dark:bg-slate-950">
              <label className="sr-only" htmlFor="dsr-assistant-input">{copy[activeLanguage].ask}</label>
              <input ref={inputRef} id="dsr-assistant-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} autoComplete="off" placeholder={copy[activeLanguage].prompt} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none dark:text-white" />
              <button type="submit" disabled={!input.trim() || thinking} aria-label="Send question" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#12396b] text-white hover:bg-[#0b315d] disabled:cursor-not-allowed disabled:opacity-40"><Send size={18} /></button>
            </form>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400">
              <span>{copy[activeLanguage].guidance}</span>
              <button type="button" onClick={clearChat} className="flex shrink-0 items-center gap-1 hover:text-red-600"><Trash2 size={11} /> {copy[activeLanguage].clear}</button>
            </div>
          </div>}
        </section>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? copy[activeLanguage].minimize : copy[activeLanguage].open} className="ml-auto flex items-center gap-2 rounded-full border-2 border-white bg-[#12396b] px-4 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#0b315d] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400">
        {open ? <ChevronDown size={20} /> : <MessageCircleQuestion size={21} />}
        <span>{open ? copy[activeLanguage].minimize : copy[activeLanguage].open}</span>
      </button>
    </div>
  );
}
