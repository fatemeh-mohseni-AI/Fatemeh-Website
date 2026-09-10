"use client";

import { useEffect, useRef } from "react";
import type { EntryPhase, SceneTransitionConfig } from "@/lib/garden/scene-transitions";

const baghFerdowsStory = [
  "Bagh-e Ferdows began as a Qajar-era garden and mansion in nineteenth-century Shemiran.",
  "Its sloping ground lets the historic building meet the garden at two different levels.",
  "Across the years, the estate passed through private hands and served civic and educational roles.",
  "The Cinema Museum of Iran moved here in 2002, giving the old mansion a new life.",
  "Today, garden paths, architecture and the memory of Iranian cinema meet beneath its trees.",
];

export function BaghFerdowsStory({ journey = false }: { journey?: boolean }) {
  return (
    <details className={`bagh-ferdows-story ${journey ? "bagh-ferdows-story--journey" : ""}`}>
      <summary>{journey ? "On the way to Bagh-e Ferdows, Tehran" : "Bagh-e Ferdows, Tehran"}</summary>
      <div className="bagh-ferdows-story__body">
        {baghFerdowsStory.map((line) => <p key={line}>{line}</p>)}
      </div>
    </details>
  );
}

export function SceneEnvironment({ image, className = "" }: { image: string; className?: string }) {
  return <div className={`scene-environment ${className}`} aria-hidden="true">
    <img src={image} alt="" width={1920} height={1280} decoding="async" />
    <div className="scene-environment__shade" />
  </div>;
}

export function SceneTransition({ config, image, phase, imageReady, reduced, onCancel }: {
  config: SceneTransitionConfig;
  image: string;
  phase: EntryPhase;
  imageReady: boolean;
  reduced: boolean;
  onCancel: () => void;
}) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelButton.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className={`scene-entry ${reduced ? "scene-entry--reduced" : ""}`} data-phase={phase}
      onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onCancel(); } }}>
      <div className="scene-entry__environment">
        {imageReady && <SceneEnvironment image={image} />}
      </div>
      <div className="scene-entry__vignette" aria-hidden="true" />
      <div className="scene-entry__caption" role="status" aria-live="polite">
        <span lang="fa" dir="rtl">{config.persianLabel}</span>
        <p>{phase === "preparing" ? `Preparing ${config.title}…` : `Entering ${config.title}`}</p>
        <small>{config.environmentName}</small>
      </div>
      {phase !== "preparing" && <BaghFerdowsStory journey />}
      <button ref={cancelButton} className="scene-entry__cancel" onClick={onCancel}>
        Back to the courtyard
      </button>
    </div>
  );
}
