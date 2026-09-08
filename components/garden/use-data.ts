"use client";
import { useEffect, useState } from "react";
import type { z } from "zod";
export function useData<S extends z.ZodTypeAny>(path: string, schema: S) {
  type T = z.output<S>;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(path, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unavailable");
        return schema.parse(await r.json());
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("This collection could not be loaded. Please try again.");
      });
    return () => controller.abort();
  }, [path, schema, attempt]);
  return { data, error, retry: () => setAttempt((v) => v + 1) };
}
