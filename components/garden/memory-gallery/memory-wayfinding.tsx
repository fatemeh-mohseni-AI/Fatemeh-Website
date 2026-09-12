"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { memoryCategories, type Memory, type MemoryCategory } from "@/lib/garden/memories";
export function MemoryFilters({ active, onSelect, disabled }: { active: MemoryCategory | null; onSelect: (value: MemoryCategory | null) => void; disabled: boolean }) {
  return <div className="memory-categories" role="group" aria-label="Bring memories into the light">
    <button type="button" aria-pressed={active === null} onClick={() => onSelect(null)} disabled={disabled}>All memories</button>
    {memoryCategories.map((category) => <button key={category} type="button" aria-pressed={active === category} disabled={disabled} onClick={() => onSelect(category)}>{category}</button>)}
  </div>;
}
export function MemoryTrail({ trail, items, selected, onFollow }: { trail: string[]; items: Memory[]; selected: string | null; onFollow: (id: string) => void }) {
  return <nav className="memory-trail" aria-label="Your memory trail">
    <span className="memory-trail-title">A thread of remembering</span>
    <ol>{trail.map((id) => {
      const item = items.find((entry) => entry.id === id);
      return item && <li key={id}><button type="button" aria-label={`Return to ${item.title}`} aria-current={selected === id ? "step" : undefined} onClick={() => onFollow(id)}><i aria-hidden="true" /><span>{item.location || item.title}</span></button></li>;
    })}</ol>
    {!trail.length && <span className="memory-trail-empty">Your first memory begins with a closer look.</span>}
  </nav>;
}
export function MemoryNavigation({ index, count, disabled, onMove }: { index: number; count: number; disabled: boolean; onMove: (index: number) => void }) {
  return <div className="memory-navigation" aria-label="Explore the gallery">
    <button type="button" aria-label="Explore previous wall" disabled={disabled || index === 0} onClick={() => onMove(index - 1)}><ArrowLeft size={18} /></button>
    <span aria-live="polite">{String(index + 1).padStart(2, "0")} <i /> {String(count).padStart(2, "0")}</span>
    <button type="button" aria-label="Explore next wall" disabled={disabled || index === count - 1} onClick={() => onMove(index + 1)}><ArrowRight size={18} /></button>
  </div>;
}
