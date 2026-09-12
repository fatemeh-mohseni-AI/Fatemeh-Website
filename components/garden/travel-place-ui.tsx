"use client";

import { useState } from "react";
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

function TravelPhoto({ src, credit, name, index }: {
  src: string;
  credit: Location["photoCredits"][number] | undefined;
  name: string;
  index: number;
}) {
  const [failed, setFailed] = useState(false);
  const caption = credit?.caption ?? `${name} · photograph ${index + 1}`;
  return (
    <figure>
      {failed ? <p className="photo-unavailable">This photograph could not be loaded.</p> : (
        <a className="travel-photo-link" href={src} target="_blank" rel="noopener noreferrer" aria-label={`View photograph: ${caption}`}>
          <img src={src} alt={caption} width={credit?.width ?? 1200} height={credit?.height ?? 800}
            loading={index === 0 ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />
        </a>
      )}
      <figcaption>
        <span>{caption}</span>
        {credit && <span className="photo-credit">
          <a href={credit.source} target="_blank" rel="noopener noreferrer">{credit.author}</a>
          {" · "}<a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.license}</a>
          {" · resized to WebP"}
        </span>}
      </figcaption>
    </figure>
  );
}

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
          aria-label={`${location.name} photographs`}
        >
          {location.images.slice(0, 3).map((image, index) => (
            <TravelPhoto key={image} src={image} name={location.name} index={index}
              credit={location.photoCredits.find((photo) => photo.src === image)} />
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
