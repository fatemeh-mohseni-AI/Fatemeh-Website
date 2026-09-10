"use client";

import { useEffect, useRef } from "react";
import type { EntryPhase, SceneTransitionConfig } from "@/lib/garden/scene-transitions";

export function SceneEnvironment({ image, className = "" }: { image: string; className?: string }) {
  return <div className={`scene-environment ${className}`} aria-hidden="true">
    <img src={image} alt="" width={1920} height={1280} decoding="async" />
    <div className="scene-environment__shade" />
  </div>;
}

export function SceneTransition({ config, phase, imageReady, reduced, onCancel }: {
  config: SceneTransitionConfig;
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
        {imageReady && <SceneEnvironment image={config.image} />}
      </div>
      <div className="scene-entry__vignette" aria-hidden="true" />
      <div className="scene-entry__caption" role="status" aria-live="polite">
        <span lang="fa" dir="rtl">{config.persianLabel}</span>
        <p>{phase === "preparing" ? `Preparing ${config.title}…` : `Entering ${config.title}`}</p>
        <small>{config.environmentName}</small>
      </div>
      <button ref={cancelButton} className="scene-entry__cancel" onClick={onCancel}>
        Back to the courtyard
      </button>
    </div>
  );
}
