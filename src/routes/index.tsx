import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, FlaskConical, Languages, Mic, Type } from "lucide-react";
import type { LanguageCode } from "@/lib/languages";
import { isBackendConfigured } from "@/lib/api/polyglot";
import { LanguageBar } from "@/components/polyglot/ui";
import { TextTranslator } from "@/components/polyglot/TextTranslator";
import { VoiceTranslator } from "@/components/polyglot/VoiceTranslator";
import { CameraTranslator } from "@/components/polyglot/CameraTranslator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Polyglot AI — Understand the world. Speak without barriers." },
      { name: "description", content: "Translate text, voice and images across English, French, Arabic, Spanish, German, Italian and Chinese." },
      { property: "og:title", content: "Polyglot AI — AI translation for text, voice and camera" },
      { property: "og:description", content: "Understand the world. Speak without barriers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MODES = [
  { id: "text", label: "Text", icon: Type },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "camera", label: "Camera", icon: Camera },
] as const;
type Mode = (typeof MODES)[number]["id"];

function Index() {
  const [mode, setMode] = useState<Mode>("text");
  const [source, setSource] = useState<LanguageCode>("en");
  const [target, setTarget] = useState<LanguageCode>("fr");

  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Languages className="size-5" /></span>
          <span className="text-lg font-bold tracking-tight">Polyglot AI</span>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
          isBackendConfigured ? "bg-primary-soft text-accent-foreground" : "bg-warning-soft text-warning")}>
          {isBackendConfigured ? <span className="size-1.5 rounded-full bg-primary" /> : <FlaskConical className="size-3.5" />}
          {isBackendConfigured ? "Gemma 4 E4B · Connected" : "Demo mode · Backend not connected"}
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="py-10 text-center sm:py-14 animate-rise">
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Understand the world.<br /><em className="text-primary">Speak without barriers.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Natural, context-aware translation for text, voice and images — powered by a private, local AI model.
          </p>
        </section>

        <div className="animate-rise [animation-delay:120ms]">
          <div role="tablist" className="mx-auto mb-6 flex w-fit gap-1 rounded-full border bg-card p-1 shadow-soft">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
                className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-6",
                  mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <div className="mb-4"><LanguageBar source={source} target={target} onSource={setSource} onTarget={setTarget} /></div>

          <div key={mode} className="animate-rise">
            {mode === "text" && <TextTranslator source={source} target={target} />}
            {mode === "voice" && <VoiceTranslator source={source} target={target} />}
            {mode === "camera" && <CameraTranslator source={source} target={target} />}
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Polyglot AI · English · Français · العربية · Español · Deutsch · Italiano · 简体中文
      </footer>
    </div>
  );
}
