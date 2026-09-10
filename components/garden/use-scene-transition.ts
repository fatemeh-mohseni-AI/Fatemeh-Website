"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pickSceneImage,
  runSceneEntry,
  type EntryPhase,
  type SceneTransitionConfig,
} from "@/lib/garden/scene-transitions";
import type { RoomId } from "@/lib/garden/content";

type EntryRequest = {
  config: SceneTransitionConfig;
  image: string;
  reduced: boolean;
  origin: { x: number; y: number };
};

const images = new Map<string, Promise<boolean>>();
export function prepareSceneImage(src: string): Promise<boolean> {
  const existing = images.get(src);
  if (existing) return existing;
  const result = new Promise<boolean>((resolve) => {
    const image = new Image();
    const timer = setTimeout(() => done(false), 2500);
    function done(ok: boolean) {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (!ok) images.delete(src);
      resolve(ok);
    }
    image.onload = () => { void image.decode().then(() => done(true), () => done(false)); };
    image.onerror = () => done(false);
    image.src = src;
  });
  images.set(src, result);
  return result;
}

export function useSceneTransition({ commit, preload, notify }: {
  commit: (id: RoomId) => void;
  preload: () => Promise<unknown>;
  notify: (message: string) => void;
}) {
  const [request, setRequest] = useState<EntryRequest | null>(null);
  const [phase, setPhase] = useState<EntryPhase>("preparing");
  const [imageReady, setImageReady] = useState(false);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const locked = useRef(false);
  const lastImage = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    locked.current = false;
    setRequest(null);
  }, []);
  const selectImage = useCallback((config: SceneTransitionConfig) => {
    const image = pickSceneImage(config.images, lastImage.current);
    lastImage.current = image;
    setSceneImage(image);
    return image;
  }, []);
  const start = useCallback((config: SceneTransitionConfig, reduced: boolean, origin = config.hotspot) => {
    if (locked.current) return false;
    locked.current = true; // synchronous: two clicks before React renders still start once.
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const image = selectImage(config);
    setPhase("preparing");
    setImageReady(false);
    setRequest({ config, image, reduced, origin });
    return true;
  }, [selectImage]);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    abortRef.current = controller;
    let timeout: ReturnType<typeof setTimeout>;
    const prepare = Promise.race([
      Promise.all([preload(), prepareSceneImage(request.image)]),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("Loading timed out")), 8000); }),
    ]);
    void (async () => {
      try {
        const [, loaded] = await prepare;
        if (controller.signal.aborted) return;
        setImageReady(loaded);
        await runSceneEntry({
          config: request.config,
          reduced: request.reduced,
          signal: controller.signal,
          onPhase: setPhase,
          onCommit: () => commit(request.config.destination),
        });
        if (!controller.signal.aborted) {
          locked.current = false;
          setRequest(null);
          // Inert is removed in the same update, so defer focus until that commit.
          requestAnimationFrame(() => {
            if (!controller.signal.aborted)
              document.querySelector<HTMLElement>(".room-content h1")?.focus({ preventScroll: true });
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          locked.current = false;
          setRequest(null);
          notify("The cinema could not open. Please try again.");
          requestAnimationFrame(() => {
            if (!controller.signal.aborted) trigger.current?.focus({ preventScroll: true });
          });
        }
      } finally { clearTimeout(timeout!); }
    })();
    return () => { controller.abort(); clearTimeout(timeout!); };
  }, [request, commit, preload, notify]);

  return { request, phase, imageReady, sceneImage, selectImage, start, cancel, isLocked: () => locked.current };
}
