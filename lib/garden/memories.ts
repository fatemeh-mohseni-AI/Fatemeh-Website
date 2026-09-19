import { z } from "zod";

const localImage = z.string().regex(/^\/(?:images|gallery)\/(?!.*(?:\.\.|[?#\\])).+\.(?:webp|avif|jpe?g|png)$/i);
export const memoryCategories = ["Places", "People", "Moments", "Details"] as const;
export const memorySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(80),
  src: localImage,
  title: z.string().max(150).default("An untitled memory"),
  alt: z.string().max(400).default(""),
  caption: z.string().max(600).default(""),
  memory: z.string().max(1600).default(""),
  location: z.string().max(120).default(""),
  year: z.union([z.string().max(30), z.number().int()]).transform(String).optional(),
  category: z.enum(memoryCategories).default("Moments"),
  mood: z.string().max(80).default(""),
  tags: z.array(z.string().max(60)).max(20).default([]),
  connections: z.array(z.string().max(80)).max(20).default([]),
  orientation: z.enum(["landscape", "portrait", "square"]).default("landscape"),
  featured: z.boolean().default(false),
  credit: z.string().max(500).default(""),
  source: z.string().url().startsWith("https://").optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#b8a58a"),
  position: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).default([50, 50]),
  variants: z.array(z.object({ src: localImage, width: z.number().int().min(100).max(8000) })).max(6).default([]),
  onward: z.object({ room: z.enum(["travel", "cinema", "library"]), label: z.string().min(1).max(150) }).optional(),
});
export const memoriesSchema = z.array(memorySchema).max(120).refine(
  (items) => new Set(items.map((item) => item.id)).size === items.length,
  "Memory IDs must be unique",
);
export type Memory = z.infer<typeof memorySchema>;
export type MemoryCategory = typeof memoryCategories[number];
export type ConnectionKind = "place" | "year" | "feeling" | "thread";

export function relatedMemory(items: Memory[], current: Memory, kind: ConnectionKind, trail: string[] = []) {
  const same = (a?: string, b?: string) => !!a?.trim() && a.trim().toLocaleLowerCase() === b?.trim().toLocaleLowerCase();
  const candidates = items.filter((item) => item.id !== current.id && (
    kind === "place" ? same(item.location, current.location) :
    kind === "year" ? same(item.year, current.year) :
    kind === "feeling" ? same(item.mood, current.mood) :
    current.connections.includes(item.id) || item.tags.some((tag) => current.tags.includes(tag))
  ));
  // Prefer explicit connections, then a memory not yet explored. A dead link is never offered.
  return candidates.sort((a, b) =>
    Number(trail.includes(a.id)) - Number(trail.includes(b.id)) ||
    Number(current.connections.includes(b.id)) - Number(current.connections.includes(a.id)),
  )[0] ?? null;
}

/** Stable wall groups; changing attention never changes their order or membership. */
export type MemoryBay = { id: string; kind: "hero" | "alcove" | "doorway"; items: Memory[] };
export function curateBays(items: Memory[]): MemoryBay[] {
  if (!items.length) return [];
  const hero = items.find((item) => item.featured) ?? items[0];
  const ordered = [hero, ...items.filter((item) => item.id !== hero.id)];
  const kinds = ["hero", "alcove", "doorway"] as const;
  const result: MemoryBay[] = [];
  for (let i = 0; i < ordered.length; i += 4) {
    result.push({ id: `room-${i / 4}`, kind: kinds[(i / 4) % kinds.length], items: ordered.slice(i, i + 4) });
  }
  return result;
}

export type GalleryPhase = "idle" | "travelling" | "opening" | "open" | "closing";
export type MemoryState = { focusedId: string | null; phase: GalleryPhase; category: MemoryCategory | null; trail: string[]; bay: number };
export const initialMemoryState: MemoryState = { focusedId: null, phase: "idle", category: null, trail: [], bay: 0 };
export type MemoryAction =
  | { type: "focus"; id: string }
  | { type: "phase"; phase: GalleryPhase }
  | { type: "rest" }
  | { type: "category"; category: MemoryCategory | null }
  | { type: "bay"; bay: number };
export function memoryReducer(state: MemoryState, action: MemoryAction): MemoryState {
  switch (action.type) {
    case "focus": return { ...state, focusedId: action.id, phase: "opening", trail: [...state.trail.filter((id) => id !== action.id), action.id].slice(-12) };
    case "phase": return { ...state, phase: action.phase };
    case "rest": return { ...state, phase: "idle", focusedId: null };
    case "category": return { ...state, category: state.category === action.category ? null : action.category };
    case "bay": return state.bay === action.bay ? state : { ...state, bay: action.bay };
  }
}

export type FrameBounds = { left: number; top: number; width: number; height: number };
/** Project the original physical frame into the viewing area; never replace its DOM node. */
export function focusFrame(source: FrameBounds, viewport: FrameBounds, mobile: boolean) {
  const area = mobile
    ? { left: viewport.left + 24, top: viewport.top + 88, width: viewport.width - 48, height: viewport.height * .39 }
    : { left: viewport.left + viewport.width * .07, top: viewport.top + viewport.height * .16, width: viewport.width * .57, height: viewport.height * .67 };
  const scale = Math.max(.05, Math.min(area.width / Math.max(source.width, 1), area.height / Math.max(source.height, 1)));
  return `translate3d(${area.left + (area.width - source.width * scale) / 2 - source.left}px, ${area.top + (area.height - source.height * scale) / 2 - source.top}px, 0) scale(${scale})`;
}
