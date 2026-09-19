import { ArrowLeft, ArrowRight } from "lucide-react";
import { memoryCategories, type Memory, type MemoryCategory } from "@/lib/garden/memories";

export function HouseFilters({ category, select }: { category: MemoryCategory | null; select: (category: MemoryCategory | null) => void }) {
  return <div className="house-categories" role="group" aria-label="Bring memories into the light">
    {([null, ...memoryCategories] as const).map((entry) => <button key={entry || "all"} type="button" aria-pressed={category === entry} onClick={() => select(entry)}>{entry || "All memories"}</button>)}
  </div>;
}
export function HouseTrail({ items, trail, focused, follow }: { items: Memory[]; trail: string[]; focused: string | null; follow: (id: string) => void }) {
  return <nav className="house-trail" aria-label="Your memory trail">
    <span>A trail of remembering<br /> lives here.</span>
    <ol>{trail.map((id) => {
      const item = items.find((entry) => entry.id === id);
      return item && <li key={id}><button type="button" aria-label={`Return to ${item.title}`} aria-current={focused === id ? "step" : undefined} onClick={() => follow(id)}>{item.location || item.title}</button></li>;
    })}</ol>
  </nav>;
}
export function HouseWalk({ index, count, disabled, move }: { index: number; count: number; disabled: boolean; move: (index: number) => void }) {
  return <div className="house-walk" aria-label="Explore the rooms">
    <button type="button" aria-label="Explore previous room" disabled={disabled || index === 0} onClick={() => move(index - 1)}><ArrowLeft size={17} /></button>
    <span>{String(index + 1).padStart(2, "0")} <i /> {String(count).padStart(2, "0")}</span>
    <button type="button" aria-label="Explore next room" disabled={disabled || index === count - 1} onClick={() => move(index + 1)}><ArrowRight size={17} /></button>
  </div>;
}
