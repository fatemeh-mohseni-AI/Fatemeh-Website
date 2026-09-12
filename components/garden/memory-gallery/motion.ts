import { waitForEntry } from "@/lib/garden/scene-transitions";
export const pause = waitForEntry;

/** A bounded, cancellable camera move. There is no idle animation loop. */
export function travelTo(element: HTMLElement, left: number, reduced: boolean, signal: AbortSignal) {
  const target = Math.max(0, Math.min(left, element.scrollWidth - element.clientWidth));
  if (signal.aborted) return Promise.reject(new DOMException("Cancelled", "AbortError"));
  if (reduced || Math.abs(target - element.scrollLeft) < 2) {
    element.scrollLeft = target;
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const origin = element.scrollLeft;
    let frame = 0;
    let started: number | undefined;
    const abort = () => { cancelAnimationFrame(frame); signal.removeEventListener("abort", abort); reject(new DOMException("Cancelled", "AbortError")); };
    const tick = (time: number) => {
      started ??= time;
      const t = Math.min(1, (time - started) / 620);
      element.scrollLeft = origin + (target - origin) * (t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else { signal.removeEventListener("abort", abort); resolve(); }
    };
    signal.addEventListener("abort", abort, { once: true });
    frame = requestAnimationFrame(tick);
  });
}
