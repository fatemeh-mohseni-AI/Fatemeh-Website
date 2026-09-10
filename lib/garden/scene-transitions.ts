import type { RoomId } from "./content";

export type SceneTransitionConfig = {
  destination: RoomId;
  title: string;
  environmentName: string;
  persianLabel: string;
  images: readonly string[];
  hotspot: { x: number; y: number };
  timing: { focus: number; approach: number; environment: number; settle: number; reveal: number };
};

// Only courtyard → cinema opts in. Room navigation and history stay in Garden.
export const cinemaTransition: SceneTransitionConfig = {
  destination: "cinema",
  title: "Cinema & Culture",
  environmentName: "Bagh-e Ferdows · Tehran",
  persianLabel: "باغ فردوس",
  images: [
    "/images/cinema/1.webp",
    "/images/cinema/2.webp",
    "/images/cinema/3.webp",
    "/images/cinema/4.webp",
    "/images/cinema/5.webp",
  ],
  hotspot: { x: 0.16, y: 0.68 },
  timing: { focus: 2000, approach: 2200, environment: 1800, settle: 300, reveal: 1100 },
};

export const sceneTransitions: Partial<Record<RoomId, SceneTransitionConfig>> = {
  cinema: cinemaTransition,
};

export type EntryPhase = "preparing" | "focus" | "approach" | "environment" | "settle" | "reveal";

export function pickSceneImage(
  choices: readonly string[],
  previous?: string | null,
  random: () => number = Math.random,
) {
  if (!choices.length) throw new Error("A scene transition needs at least one image.");
  const available = choices.length > 1 ? choices.filter((image) => image !== previous) : [...choices];
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))];
}

/** Abortable waits: cancellation cannot commit a stale destination later. */
export function waitForEntry(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Cancelled", "AbortError"));
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function runSceneEntry({
  config, reduced, signal, onPhase, onCommit,
}: {
  config: SceneTransitionConfig;
  reduced: boolean;
  signal: AbortSignal;
  onPhase: (phase: EntryPhase) => void;
  onCommit: () => void;
}) {
  if (signal.aborted) return;
  if (!reduced) {
    onPhase("focus");
    await waitForEntry(config.timing.focus, signal);
    onPhase("approach");
    await waitForEntry(config.timing.approach, signal);
  }
  onPhase("environment");
  await waitForEntry(reduced ? 120 : config.timing.environment, signal);
  // Environment is opaque before the old scene is replaced.
  onPhase("settle");
  onCommit();
  await waitForEntry(reduced ? 40 : config.timing.settle, signal);
  onPhase("reveal");
  await waitForEntry(reduced ? 160 : config.timing.reveal, signal);
}
