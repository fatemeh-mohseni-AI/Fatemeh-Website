"use client";
import { useSyncExternalStore } from "react";
import { memoriesSchema } from "@/lib/garden/memories";
import type { RoomId } from "@/lib/garden/content";
import { useData } from "../use-data";
import { useTehranLight } from "../use-tehran-light";
import { HouseEnvironment } from "./house-environment";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;

export function MemoryGallery({ reduced, discover, onRoom }: {
  reduced: boolean; discover: (id: string) => void; onRoom: (id: RoomId) => void;
}) {
  const { data, error, retry } = useData("/data/gallery.json", memoriesSchema);
  const lighting = useTehranLight();
  const systemReduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return <div className="house-gallery" data-light={lighting} data-reduced={reduced || systemReduced || undefined}>
    {data?.length ? <HouseEnvironment items={data} reduced={reduced || systemReduced} onDiscover={() => discover("gallery")} onRoom={onRoom} /> : <div className="house-waiting">
      <img src="/gallery/room.webp" alt="" />
      <div role="status"><h1 tabIndex={-1}>The things <em>we keep.</em></h1>
        <p>{error || (data ? "The room is ready for its first memories." : "A little light, beyond the doorway…")}</p>
        {error && <button onClick={retry}>Open the door again</button>}
        <button onClick={() => onRoom("courtyard")}>Back to the courtyard</button>
      </div>
    </div>}
  </div>;
}
