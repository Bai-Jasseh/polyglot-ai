import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { dirFor, type LanguageCode } from "@/lib/languages";
import { errorMessage, translateText } from "@/lib/api/polyglot";
import { ClearButton, CopyButton, Panel, PrimaryButton, ResultText, SpeakButton, StatusNote } from "./ui";

const MAX = 5000;

export function TextTranslator({ source, target }: { source: LanguageCode; target: LanguageCode }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    abort.current?.abort();
    const ctrl = new AbortController(); abort.current = ctrl;
    setLoading(true); setNote(null); setResult("");
    try {
      const r = await translateText(text, source, target, ctrl.signal);
      setResult(r.translation);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote(errorMessage(e));
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="From" lang={source} actions={<ClearButton disabled={!text} onClick={() => { setText(""); setResult(""); setNote(null); }} />}>
          <textarea
            dir={dirFor(source)} lang={source} value={text} maxLength={MAX}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
            placeholder="Type or paste text…"
            className="min-h-[200px] flex-1 resize-none bg-transparent px-5 py-4 text-lg leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <div className="flex items-center justify-between px-5 pb-3 text-xs text-muted-foreground">
            <span>{text.length.toLocaleString()} / {MAX.toLocaleString()}</span>
            <CopyButton text={text} />
          </div>
        </Panel>
        <Panel title="To" lang={target} className="bg-primary-soft/40"
          actions={<><SpeakButton text={result} lang={target} /><CopyButton text={result} /></>}>
          <ResultText text={result} lang={target} loading={loading} placeholder="Translation will appear here" />
        </Panel>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <PrimaryButton onClick={run} disabled={!text.trim() || loading}><Sparkles className="size-4" /> Translate</PrimaryButton>
        <span className="text-xs text-muted-foreground">⌘ / Ctrl + Enter</span>
      </div>
      <StatusNote message={note} />
    </div>
  );
}
