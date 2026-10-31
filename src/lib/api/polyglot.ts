/**
 * Polyglot AI API client.
 *
 * Talks to a Node.js backend that proxies a local Ollama instance running Gemma 4 E4B.
 * Set VITE_POLYGLOT_API_URL (e.g. http://localhost:3001) to enable live translation.
 * Without it every call throws BackendNotConfiguredError — the UI shows a labelled
 * demo state and never fabricates a translation.
 *
 * Expected backend contract:
 *   POST /api/translate/text   JSON { text, source, target }           -> { translation }
 *   POST /api/translate/voice  multipart { audio, source, target }     -> { transcript, translation }
 *   POST /api/translate/image  multipart { image, source, target }     -> { extractedText, translation }
 *   GET  /api/health                                                   -> { ok: true, model }
 */
import type { LanguageCode } from "@/lib/languages";

export const API_BASE_URL = (import.meta.env["VITE_POLYGLOT_API_URL"] as string | undefined)?.replace(/\/$/, "");
export const isBackendConfigured = Boolean(API_BASE_URL);

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("Translation backend is not connected yet.");
    this.name = "BackendNotConfiguredError";
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export interface TextResult { translation: string }
export interface VoiceResult { transcript: string; translation: string }
export interface ImageResult { extractedText: string; translation: string }

async function request<T>(path: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  if (!API_BASE_URL) throw new BackendNotConfiguredError();
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: signal ?? null });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* ignore */ }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export function translateText(text: string, source: LanguageCode, target: LanguageCode, signal?: AbortSignal) {
  return request<TextResult>("/api/translate/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, target }),
  }, signal);
}

export function translateVoice(audio: Blob, source: LanguageCode, target: LanguageCode, signal?: AbortSignal) {
  const form = new FormData();
  form.append("audio", audio, "recording.webm");
  form.append("source", source);
  form.append("target", target);
  return request<VoiceResult>("/api/translate/voice", { method: "POST", body: form }, signal);
}

export function translateImage(image: Blob, source: LanguageCode, target: LanguageCode, signal?: AbortSignal) {
  const form = new FormData();
  form.append("image", image, "capture.jpg");
  form.append("source", source);
  form.append("target", target);
  return request<ImageResult>("/api/translate/image", { method: "POST", body: form }, signal);
}

export function errorMessage(err: unknown): string {
  if (err instanceof BackendNotConfiguredError) return "Demo mode — connect the Ollama backend to translate.";
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
