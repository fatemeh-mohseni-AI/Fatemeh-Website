"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Feather, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_MESSAGE_LENGTH = 1500;

type SubmitState = "idle" | "sending" | "folding" | "sent" | "error";

export function InkAndQuillIcon({ className }: { className?: string }) {
  return (
    <span className={`ink-and-quill ${className ?? ""}`} aria-hidden="true">
      <Feather className="ink-quill" strokeWidth={1.4} />
      <svg className="ink-bottle" viewBox="0 0 24 24" fill="none">
        <path d="M8.6 6.7h6.8l-.7 3.1c1.65.75 2.8 2.4 2.8 4.3v4.3H6.5v-4.3c0-1.9 1.15-3.55 2.8-4.3l-.7-3.1Z" />
        <path d="M9.5 4.5h5M8 18.4h8" />
      </svg>
    </span>
  );
}

export function AnonymousLetterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const finishTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open && state === "sent") setState("idle");
  }, [open, state]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = message.trim();
    if (!body || body.length > MAX_MESSAGE_LENGTH || state === "sending" || state === "folding") return;

    setState("sending");
    setError("");

    try {
      const sourceRoute = `${window.location.pathname}${window.location.hash || "#entrance"}`.slice(0, 120);
      const response = await fetch("/api/anonymous-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body,
          sourceRoute,
          website: honeypotRef.current?.value ?? "",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "پیام فرستاده نشد. دوباره امتحان کن.");
      }

      setState("folding");
      finishTimerRef.current = window.setTimeout(() => {
        setMessage("");
        setState("sent");
      }, 900);
    } catch (cause) {
      setState("error");
      setError(cause instanceof Error ? cause.message : "پیام فرستاده نشد. دوباره امتحان کن.");
    }
  };

  const busy = state === "sending" || state === "folding";
  const remaining = MAX_MESSAGE_LENGTH - message.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="anonymous-letter-dialog" showCloseButton={!busy}>
        <div className="letter-stage" dir="rtl">
          {state === "sent" ? (
            <div className="letter-delivered" role="status">
              <span className="delivered-mark"><InkAndQuillIcon /></span>
              <p>رسید به باغ.</p>
              <span>ممنون که چیزی از خودت اینجا جا گذاشتی.</span>
            </div>
          ) : (
            <form className={`letter-paper ${state === "folding" ? "is-folding" : ""}`} onSubmit={submit}>
              <div className="letter-ornament" aria-hidden="true">✦</div>
              <DialogTitle className="letter-title">یک یادداشت برای فاطمه</DialogTitle>
              <DialogDescription className="letter-description">
                نامت لازم نیست. هر چیزی که دوست داری برایم بنویس.
              </DialogDescription>

              <label className="sr-only" htmlFor="anonymous-letter-message">متن یادداشت</label>
              <textarea
                id="anonymous-letter-message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (state === "error") {
                    setState("idle");
                    setError("");
                  }
                }}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={8}
                autoFocus
                disabled={busy}
                placeholder="اینجا بنویس…"
              />

              <input
                ref={honeypotRef}
                className="letter-honeypot"
                type="text"
                name="website"
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
              />

              <div className="letter-meta">
                <span className={remaining < 100 ? "near-limit" : ""}>{message.length} / {MAX_MESSAGE_LENGTH}</span>
                <span>برای جلوگیری از اسپم، حداقل اطلاعات فنی به‌صورت محدود پردازش می‌شود.</span>
              </div>

              <div className="letter-actions">
                <button
                  type="submit"
                  className="letter-send"
                  disabled={busy || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH}
                >
                  {state === "sending" ? "در حال فرستادن…" : state === "folding" ? "راهی شد…" : "بفرستش"}
                  <Send size={16} strokeWidth={1.5} />
                </button>
                <p className={`letter-error ${error ? "visible" : ""}`} role="alert">{error}</p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
