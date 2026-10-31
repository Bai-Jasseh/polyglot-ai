import { ArrowLeftRight, Check, ChevronDown, Copy, FlaskConical, Loader2, Volume2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LANGUAGES, dirFor, getLanguage, type LanguageCode } from "@/lib/languages";
import { isBackendConfigured } from "@/lib/api/polyglot";
import { cn } from "@/lib/utils";

export function LanguageSelect({ value, onChange, label }: { value: LanguageCode; onChange: (c: LanguageCode) => void; label: string }) {
  return (
    <label className="relative block flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="w-full appearance-none rounded-xl border bg-card px-4 py-3 pr-10 text-sm font-semibold text-foreground transition hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.name} · {l.native}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </label>
  );
}

export function LanguageBar({ source, target, onSource, onTarget }: {
  source: LanguageCode; target: LanguageCode; onSource: (c: LanguageCode) => void; onTarget: (c: LanguageCode) => void;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <LanguageSelect label="Source language" value={source} onChange={onSource} />
      <button
        type="button"
        aria-label="Swap languages"
        onClick={() => { onSource(target); onTarget(source); }}
        className="grid size-11 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground transition hover:rotate-180 hover:text-primary hover:border-ring duration-500"
      >
        <ArrowLeftRight className="size-4" />
      </button>
      <LanguageSelect label="Target language" value={target} onChange={onTarget} />
    </div>
  );
}

export function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean | undefined; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
      {children}
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <IconButton label="Copy" disabled={!text} onClick={async () => {
      await navigator.clipboard.writeText(text);
      setDone(true); setTimeout(() => setDone(false), 1400);
    }}>
      {done ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
    </IconButton>
  );
}

export function ClearButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean | undefined }) {
  return <IconButton label="Clear" onClick={onClick} disabled={disabled}><X className="size-4" /></IconButton>;
}

export function SpeakButton({ text, lang }: { text: string; lang: LanguageCode }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  return (
    <IconButton label="Play translation" disabled={!text || !supported} onClick={() => {
      const synth = window.speechSynthesis;
      if (speaking) { synth.cancel(); setSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = getLanguage(lang).bcp47;
      u.onend = u.onerror = () => setSpeaking(false);
      setSpeaking(true); synth.speak(u);
    }}>
      <Volume2 className={cn("size-4", speaking && "text-primary animate-pulse")} />
    </IconButton>
  );
}

export function Panel({ title, lang, children, actions, className }: {
  title: string; lang?: LanguageCode; children: ReactNode; actions?: ReactNode; className?: string;
}) {
  return (
    <section className={cn("flex min-h-[220px] flex-col rounded-2xl border bg-card shadow-soft", className)}>
      <header className="flex items-center justify-between border-b px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}{lang && <span className="ml-2 text-foreground normal-case tracking-normal">{getLanguage(lang).name}</span>}
        </span>
        <div className="flex items-center gap-0.5">{actions}</div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

export function ResultText({ text, lang, placeholder, loading }: { text: string; lang: LanguageCode; placeholder: string; loading?: boolean }) {
  if (loading) return (
    <div className="flex flex-1 items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Translating…
    </div>
  );
  return (
    <p dir={dirFor(lang)} lang={lang} className={cn("flex-1 whitespace-pre-wrap px-5 py-4 text-lg leading-relaxed", !text && "text-muted-foreground/70")}>
      {text || placeholder}
    </p>
  );
}

export function StatusNote({ message }: { message: string | null }) {
  if (!message) return null;
  const demo = !isBackendConfigured;
  return (
    <div role="status" className={cn("mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm animate-rise",
      demo ? "bg-warning-soft text-warning" : "bg-destructive/10 text-destructive")}>
      {demo && <FlaskConical className="mt-0.5 size-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
      {children}
    </button>
  );
}
