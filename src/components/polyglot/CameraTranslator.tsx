import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Sparkles, X } from "lucide-react";
import type { LanguageCode } from "@/lib/languages";
import { errorMessage, translateImage } from "@/lib/api/polyglot";
import { CopyButton, Panel, PrimaryButton, ResultText, SpeakButton, StatusNote } from "./ui";

export function CameraTranslator({ source, target }: { source: LanguageCode; target: LanguageCode }) {
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [live, setLive] = useState(false);
  const [extracted, setExtracted] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const stopCamera = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setLive(false); };
  useEffect(() => stopCamera, []);

  const reset = () => { setExtracted(""); setTranslation(""); setNote(null); };

  const setFile = (blob: Blob) => {
    if (image) URL.revokeObjectURL(image.url);
    setImage({ blob, url: URL.createObjectURL(blob) }); reset();
  };

  const openCamera = async () => {
    reset();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.current = s; setLive(true); setImage(null);
      requestAnimationFrame(() => { if (video.current) { video.current.srcObject = s; video.current.play(); } });
    } catch { setNote("Camera access was blocked or no camera is available. Try uploading an image instead."); }
  };

  const capture = () => {
    const v = video.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) { setFile(b); stopCamera(); } }, "image/jpeg", 0.92);
  };

  const run = async () => {
    if (!image) return;
    setLoading(true); reset();
    try {
      const r = await translateImage(image.blob, source, target);
      setExtracted(r.extractedText); setTranslation(r.translation);
    } catch (e) { setNote(errorMessage(e)); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="relative grid aspect-[16/10] max-h-[420px] w-full place-items-center bg-muted">
          {live ? (
            <video ref={video} playsInline muted className="size-full object-cover" />
          ) : image ? (
            <>
              <img src={image.url} alt="Selected for translation" className="size-full object-contain" />
              <button type="button" aria-label="Remove image" onClick={() => { setImage(null); reset(); }}
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-soft hover:bg-card">
                <X className="size-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center px-6 text-center text-muted-foreground">
              <ImageUp className="mb-3 size-10 text-primary/60" />
              <p className="font-medium text-foreground">Capture or upload an image</p>
              <p className="text-sm">Signs, menus, documents — any text in a photo.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 border-t px-5 py-4">
          {live ? (
            <>
              <PrimaryButton onClick={capture}><Camera className="size-4" /> Capture</PrimaryButton>
              <button type="button" onClick={stopCamera} className="rounded-full px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
            </>
          ) : (
            <>
              <button type="button" onClick={openCamera} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold hover:border-ring hover:text-primary">
                <Camera className="size-4" /> Use camera
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold hover:border-ring hover:text-primary">
                <ImageUp className="size-4" /> Upload image
              </button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }} />
              {image && <PrimaryButton onClick={run} disabled={loading}><Sparkles className="size-4" /> Extract & translate</PrimaryButton>}
            </>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Extracted" lang={source} actions={<CopyButton text={extracted} />}>
          <ResultText text={extracted} lang={source} loading={loading} placeholder="Text found in the image appears here" />
        </Panel>
        <Panel title="Translated" lang={target} className="bg-primary-soft/40"
          actions={<><SpeakButton text={translation} lang={target} /><CopyButton text={translation} /></>}>
          <ResultText text={translation} lang={target} loading={loading} placeholder="Translation will appear here" />
        </Panel>
      </div>
      <StatusNote message={note} />
    </div>
  );
}
