"use client";
import { useSyncExternalStore } from "react";
import { tehranLighting, type TehranLighting } from "@/lib/garden/courtyard";

let current: TehranLighting = "day";
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
const update = () => {
  const next = tehranLighting();
  if (next !== current) { current = next; listeners.forEach((listener) => listener()); }
};
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = setInterval(update, 15_000);
    document.addEventListener("visibilitychange", update);
  }
  update();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { clearInterval(timer); document.removeEventListener("visibilitychange", update); }
  };
}
export function useTehranLight() {
  return useSyncExternalStore(subscribe, () => current, () => "day" as TehranLighting);
}
