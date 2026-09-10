"use client";

import {
  Compass,
  ExternalLink,
  Home,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { earthLink, type Location } from "@/lib/garden/data";

const categoryCopy = {
  home: { label: "Home", Icon: Home },
  visited: { label: "Visited", Icon: MapPin },
  dream: { label: "Dream destination", Icon: Sparkles },
};

export function TravelPlaceButton({
  location,
  selected,
  onSelect,
}: {
  location: Location;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { Icon } = categoryCopy[location.type];
  return (
    <button
      type="button"
      className={`atlas-place atlas-place--${location.type} ${selected ? "is-selected" : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect(location.id)}
    >
      <span className="atlas-place__marker" aria-hidden="true">
        <Icon size={15} strokeWidth={1.5} />
      </span>
      <span className="atlas-place__copy">
        <strong>{location.name}</strong>
        <span>{location.label ?? location.country}</span>
      </span>
      <Compass className="atlas-place__compass" size={14} aria-hidden="true" />
    </button>
  );
}

export function TravelDetail({
  location,
  onClose,
}: {
  location: Location;
  onClose: () => void;
}) {
  const category = categoryCopy[location.type];
  const CategoryIcon = category.Icon;
  return (
    <article className="travel-detail" aria-live="polite">
      <button
        type="button"
        className="travel-detail__close"
        onClick={onClose}
        aria-label={`Close ${location.name} details`}
      >
        <X size={16} />
      </button>
      <div className="travel-detail__meta">
        <span>
          <CategoryIcon size={13} strokeWidth={1.5} /> {category.label}
        </span>
        <span>{location.country}</span>
      </div>
      <h2>{location.name}</h2>
      {location.label && <p className="travel-detail__label">{location.label}</p>}
      {location.shortNote && (
        <p className="travel-detail__note">{location.shortNote}</p>
      )}
      <p className="travel-detail__description">{location.description}</p>
      {location.images.length > 0 && (
        <div
          className="travel-gallery"
          aria-label={`${location.name} placeholder gallery`}
        >
          {location.images.slice(0, 3).map((image, index) => (
            <figure key={`${image}-${index}`}>
              <img
                src={image}
                alt="Placeholder awaiting a personal travel photograph"
                loading="lazy"
              />
              <figcaption>
                Placeholder {String(index + 1).padStart(2, "0")}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className="travel-detail__footer">
        <span className="coordinates">
          {Math.abs(location.latitude).toFixed(4)}°{" "}
          {location.latitude >= 0 ? "N" : "S"}
          <br />
          {Math.abs(location.longitude).toFixed(4)}°{" "}
          {location.longitude >= 0 ? "E" : "W"}
        </span>
        <a
          className="earth-action"
          href={earthLink(location)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Earth <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
