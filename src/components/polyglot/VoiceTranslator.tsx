import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import type { LanguageCode } from "@/lib/languages";
import { errorMessage, translateVoice } from "@/lib/api/polyglot";
import { CopyButton, Panel, ResultText, SpeakButton, StatusNote } from "./ui";
import { cn } from "@/lib/utils";

const BARS = 40;

export function VoiceTranslator({ source, target }: { source: LanguageCode; target: LanguageCode }) {
  const [recording, setRecording] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.08));
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const raf = useRef<number>(0);
  const timer = useRef<number>(0);

  const cleanup = () => {
    cancelAnimationFrame(raf.current); clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    ctx.current?.close().catch(() => {});
    stream.current = null; ctx.current = null;
  };
  useEffect(() => cleanup, []);

  const send = async (blob: Blob) => {
    setLoading(true);
    try {
      const r = await translateVoice(blob, source, target);
      setTranscript(r.transcript); setTranslation(r.translation);
    } catch (e) { setNote(errorMessage(e)); }
    finally { setLoading(false); }
  };

  const start = async () => {
    setNote(null); setTranscript(""); setTranslation(""); setAudioUrl(null); setSeconds(0);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const ac = new AudioContext(); ctx.current = ac;
      const analyser = ac.createAnalyser(); analyser.fftSize = 128;
      ac.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setLevels(Array.from({ length: BARS }, (_, i) => Math.max(0.08, (data[Math.floor((i / BARS) * data.length)] ?? 0) / 255)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
      const chunks: Blob[] = [];
      const mr = new MediaRecorder(s);
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setLevels(Array(BARS).fill(0.08));
        if (blob.size) send(blob);
      };
      mr.start(); recorder.current = mr;
      timer.current = window.setInterval(() => setSeconds((x) => x + 1), 1000);
      setRecording(true);
    } catch {
      setNote("Microphone access was blocked. Allow it in your browser settings and try again.");
      cleanup();
    }
  };

  const stop = () => { recorder.current?.stop(); cleanup(); setRecording(false); };

  return (
    <div>
      <div className="flex flex-col items-center rounded-2xl border bg-card px-6 py-10 shadow-soft">
        <div className="relative">
          {recording && <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />}
          <button type="button" onClick={recording ? stop : start} aria-label={recording ? "Stop recording" : "Start recording"}
            className={cn("relative grid size-20 place-items-center rounded-full text-primary-foreground shadow-soft transition hover:scale-105",
              recording ? "bg-destructive" : "bg-primary")}>
            {recording ? <Square className="size-7 fill-current" /> : <Mic className="size-8" />}
          </button>
        </div>
        <div className="mt-8 flex h-16 w-full max-w-md items-center justify-center gap-[3px]" aria-hidden>
          {levels.map((l, i) => (
            <span key={i} className={cn("w-1.5 rounded-full transition-[height] duration-75", recording ? "bg-primary" : "bg-border")}
              style={{ height: `${l * 100}%` }} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {recording ? `Listening… 0:${String(seconds).padStart(2, "0")}` : loading ? "Processing speech…" : "Tap the microphone and start speaking"}
        </p>
        {audioUrl && !recording && (
          <div className="mt-4 flex items-center gap-3">
            <audio src={audioUrl} controls className="h-9" />
            <button type="button" onClick={start} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <RotateCcw className="size-3.5" /> Retake
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Recognized" lang={source} actions={<CopyButton text={transcript} />}>
          <ResultText text={transcript} lang={source} loading={loading} placeholder="Your speech will be transcribed here" />
        </Panel>
        <Panel title="Translated" lang={target} className="bg-primary-soft/40"
          actions={<><SpeakButton text={translation} lang={target} /><CopyButton text={translation} /></>}>
          <ResultText text={translation} lang={target} loading={loading} placeholder="Translated speech will appear here" />
        </Panel>
      </div>
      <StatusNote message={note} />
    </div>
  );
}
