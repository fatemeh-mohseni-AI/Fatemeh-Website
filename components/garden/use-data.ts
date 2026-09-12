"use client";
import { useEffect, useState } from "react";
import type { z } from "zod";
export function useData<S extends z.ZodTypeAny>(path: string, schema: S) {
  type T = z.output<S>;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ path: string; attempt: number; data: T | null; error: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        return schema.parse(await response.json());
      })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ path, attempt, data, error: "" });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !(error instanceof DOMException && error.name === "AbortError"))
          setResult({ path, attempt, data: null, error: "This collection could not be loaded. Please try again." });
      });
    return () => controller.abort();
  }, [path, schema, attempt]);
  const current = result?.path === path && result.attempt === attempt ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? "", retry: () => setAttempt((value) => value + 1) };
}
