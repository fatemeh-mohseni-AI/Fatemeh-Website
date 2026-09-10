"use client";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileUp,
  Film,
  Flower2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { type RoomId } from "@/lib/garden/content";
import {
  gallerySchema,
  locationsSchema,
  parseKml,
  writingSchema,
  type GalleryItem,
  type Location,
  type Writing,
} from "@/lib/garden/data";
import { useData } from "./use-data";
import { TravelDetail, TravelPlaceButton } from "./travel-place-ui";
import { BaghFerdowsStory } from "./scene-transition";
const Globe = lazy(() => import("./globe"));
type Props = {
  id: RoomId;
  reduced: boolean;
  discover: (id: string) => void;
  notify: (message: string) => void;
  deferFocus?: boolean;
};
function CollectionStatus({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div className="collection-status" role="status">
      {error || "Opening the collection…"}
      {error && (
        <button className="outline-button" onClick={retry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
export default function Room(props: Props) {
  useEffect(() => {
    if (!props.deferFocus)
      document.querySelector<HTMLElement>(".room-content h1")?.focus({ preventScroll: true });
  }, [props.id, props.deferFocus]);
  switch (props.id) {
    case "library":
      return <Library {...props} />;
    case "travel":
      return <Travel {...props} />;
    case "gallery":
      return <Gallery {...props} />;
    case "cinema":
      return <Cinema {...props} />;
    case "lab":
      return <Lab {...props} />;
    default:
      return null;
  }
}

function Library({ discover }: Props) {
  const { data, error, retry } = useData("/data/writings.json", writingSchema);
  const [article, setArticle] = useState<Writing | null>(null);
  return (
    <div className="library-room">
      <div className="library-backdrop">
        <img
          src="/images/library.webp"
          alt="A Persian reading room filled with afternoon light"
        />
      </div>
      <div className="library-content">
        <p className="eyebrow">02 / THE LIBRARY</p>
        <h1 tabIndex={-1}>
          Thoughts,
          <br />
          <em>between the lines.</em>
        </h1>
        <p className="room-introduction">
          A quiet corner for stories, little observations,
          <br />
          and ideas still finding their shape.
        </p>
        <div className="writing-list">
          {!data ? (
            <CollectionStatus error={error} retry={retry} />
          ) : (
            data.map((a, i) => (
              <button
                key={a.id}
                onClick={() => {
                  setArticle(a);
                  discover("library");
                }}
                className="writing-item"
              >
                <span className="writing-index">0{i + 1}</span>
                <span className="writing-text">
                  <span className="eyebrow">{a.category}</span>
                  <h2>{a.title}</h2>
                  <p>{a.excerpt}</p>
                  <span className="writing-meta">
                    {a.status} <span>·</span> {a.minutes} min read
                  </span>
                </span>
                <ArrowRight size={21} />
              </button>
            ))
          )}
        </div>
        <p className="data-note">
          An opening collection of essays about this garden’s design.
        </p>
      </div>
      <Dialog
        open={!!article}
        onOpenChange={(open) => {
          if (!open) setArticle(null);
        }}
      >
        <DialogContent className="garden-dialog reading-dialog">
          <div className="eyebrow">
            {article?.category} / {article?.status}
          </div>
          <DialogTitle>{article?.title}</DialogTitle>
          <DialogDescription>
            {article?.minutes} minute read · The Library
          </DialogDescription>
          <div className="reading-body">
            {article?.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="reading-end">
            <Flower2 size={22} />
            <span>A thought to take with you.</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Travel({ reduced, discover, notify }: Props) {
  const { data, error, retry } = useData(
    "/data/locations.json",
    locationsSchema,
  );
  const [imported, setImported] = useState<Location[] | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const all = imported ?? data;
  const active = all?.find((p) => p.id === selected);
  const homeAndVisited =
    all?.filter((p) => p.type === "home" || p.type === "visited") ?? [];
  const dreams = all?.filter((p) => p.type === "dream") ?? [];
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("Please choose a file smaller than 2 MB.");
      if (!file.name.toLowerCase().endsWith(".kml"))
        throw new Error("Choose a .kml file. Unzip KMZ exports first.");
      const places = parseKml(await file.text());
      setImported(places);
      setSelected(null);
      setImportError("");
      notify(`${places.length} places opened for this visit.`);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "This file could not be imported.",
      );
    } finally {
      e.target.value = "";
    }
  };
  const choose = (id: string) => {
    setSelected(id);
    discover("travel");
  };
  return (
    <div className="travel-room">
      <div className="travel-heading">
        <p className="eyebrow">03 / TRAVEL OBSERVATORY</p>
        <h1 tabIndex={-1}>
          A private atlas of <em>near &amp; far.</em>
        </h1>
        <p>
          Places that shaped a story — and those still calling from the horizon.
        </p>
      </div>
      <div className="observatory-layout">
        <div className="earth-column">
          {all ? (
            <Suspense
              fallback={
                <div className="globe-stage scene-loading">
                  Bringing the world into view…
                </div>
              }
            >
              <Globe
                locations={all}
                selected={selected}
                onSelect={choose}
                reduced={reduced}
              />
            </Suspense>
          ) : (
            <CollectionStatus error={error} retry={retry} />
          )}
          <a
            className="earth-credit"
            href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Earth imagery: NASA Blue Marble <ExternalLink size={11} />
          </a>
          {active && (
            <TravelDetail location={active} onClose={() => setSelected(null)} />
          )}
        </div>
        <aside
          className="place-rail place-rail--visited"
          aria-label="Home and visited places"
        >
          <div className="place-rail__heading">
            <span>{imported ? "OPENED FROM KML" : "HOME & PLACES MET"}</span>
            <span>{homeAndVisited.length}</span>
          </div>
          <div className="place-rail__list">
            {homeAndVisited.map((place) => (
              <TravelPlaceButton
                key={place.id}
                location={place}
                selected={selected === place.id}
                onSelect={choose}
              />
            ))}
          </div>
          {!active && (
            <div className="atlas-note">
              <span lang="fa">سفر</span>
              <p>Select a place to bring it into view.</p>
            </div>
          )}
        </aside>
        <aside
          className="place-rail place-rail--dreams"
          aria-label="Dream destinations"
        >
          <div className="place-rail__heading">
            <span>{imported ? "TEMPORARY ATLAS" : "ON THE HORIZON"}</span>
            <span>{dreams.length}</span>
          </div>
          <div className="place-rail__list">
            {dreams.map((place) => (
              <TravelPlaceButton
                key={place.id}
                location={place}
                selected={selected === place.id}
                onSelect={choose}
              />
            ))}
            {!imported && all && !dreams.length && (
              <p className="empty-places">No dream destinations yet.</p>
            )}
          </div>
          <div className="import-section">
            <input
              ref={fileRef}
              type="file"
              accept=".kml,application/vnd.google-earth.kml+xml"
              className="sr-only"
              onChange={importFile}
            />
            <button
              className="quiet-link"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp size={16} /> Open a Google Earth KML
            </button>
            {imported && (
              <button
                className="quiet-link"
                onClick={() => {
                  setImported(null);
                  setSelected(null);
                }}
              >
                Return to the garden atlas
              </button>
            )}
            <p className="data-note">
              {imported
                ? "Imported places stay in this tab and are not uploaded."
                : "KML imports stay private to this browser tab."}
            </p>
            {importError && (
              <p role="alert" className="form-error">
                {importError}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Gallery({ discover }: Props) {
  const { data, error, retry } = useData("/data/gallery.json", gallerySchema);
  const [selected, setSelected] = useState<number | null>(null);
  const item = selected !== null ? data?.[selected] : null;
  return (
    <div className="gallery-room">
      <div className="section-title">
        <p className="eyebrow">04 / THE GALLERY</p>
        <h1 tabIndex={-1}>
          Learning <em>to look.</em>
        </h1>
        <p>Fragments of light. A feeling worth keeping.</p>
      </div>
      <div className="gallery-wall">
        {!data ? (
          <CollectionStatus error={error} retry={retry} />
        ) : (
          data.map((image, i) => (
            <button
              key={image.id}
              className={`gallery-frame frame-${i}`}
              onClick={() => {
                setSelected(i);
                discover("gallery");
              }}
            >
              <span className="picture-mat">
                <img src={image.src} alt={image.alt} loading="lazy" />
              </span>
              <span className="picture-label">
                <span>0{i + 1}</span>
                <span>
                  <strong>{image.title}</strong>
                  <span>{image.credit}</span>
                </span>
                <span className="frame-open">↗</span>
              </span>
            </button>
          ))
        )}
      </div>
      <div className="gallery-footnote">
        <span lang="fa">تماشا</span>
        <p>
          Architectural studies for this world.
          <br />
          An opening collection of imagined spaces.
        </p>
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="garden-dialog gallery-lightbox">
          <DialogTitle>{item?.title}</DialogTitle>
          <DialogDescription>{item?.caption}</DialogDescription>
          {item && <img src={item.src} alt={item.alt} />}
          <div className="lightbox-controls">
            <span>{item?.credit}</span>
            <div>
              <button
                aria-label="Previous image"
                onClick={() =>
                  setSelected((i) =>
                    i !== null && data
                      ? (i - 1 + data.length) % data.length
                      : i,
                  )
                }
              >
                <ChevronLeft size={21} />
              </button>
              <span>
                {selected !== null ? selected + 1 : 0} / {data?.length}
              </span>
              <button
                aria-label="Next image"
                onClick={() =>
                  setSelected((i) =>
                    i !== null && data ? (i + 1) % data.length : i,
                  )
                }
              >
                <ChevronRight size={21} />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
const films = [
  {
    title: "The art of noticing",
    eyebrow: "A SILENT VISUAL ESSAY",
    image: "/images/courtyard.webp",
    text: "Slow down. There is a whole world in the space between things.",
    theme: "Light & stillness",
  },
  {
    title: "A different kind of window",
    eyebrow: "A STUDY IN COLOR",
    image: "/images/door.webp",
    text: "The same light. A hundred different ways of seeing it.",
    theme: "Craft & perspective",
  },
  {
    title: "Rooms we return to",
    eyebrow: "AN ODE TO QUIET PLACES",
    image: "/images/library.webp",
    text: "Some places make a little more room for who we are becoming.",
    theme: "Memory & belonging",
  },
];
function Cinema({ reduced, discover }: Props) {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  const film = films[index];
  useEffect(() => {
    if (!playing || reduced) return;
    const interval = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % films.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [playing, reduced]);
  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);
  return (
    <div className="cinema-room">
      <div className="section-title">
        <p className="eyebrow">05 / CINEMA & CULTURE</p>
        <h1 tabIndex={-1}>
          Through <em>another lens.</em>
        </h1>
        <p>A small programme of light, place, and perspective.</p>
      </div>
      <BaghFerdowsStory />
      <div className="cinema-screen">
        <img key={film.image} src={film.image} alt={film.theme} />
        <div className="projection-shade" />
        <div className="film-caption">
          <p className="eyebrow">{film.eyebrow}</p>
          <h2>{film.title}</h2>
          <p>{film.text}</p>
        </div>
        <button
          className="projection-play"
          aria-label={
            playing ? "Pause visual programme" : "Play visual programme"
          }
          onClick={() => {
            if (reduced) {
              setIndex((i) => (i + 1) % films.length);
            } else setPlaying((v) => !v);
            discover("cinema");
          }}
        >
          {playing ? <Pause size={23} /> : <Play size={23} />}
        </button>
        <span className="screen-meta">
          {reduced
            ? "MANUAL PROJECTION"
            : playing
              ? "NOW PLAYING"
              : "THE OPENING PROGRAMME"}{" "}
          <span>0{index + 1} / 03</span>
        </span>
      </div>
      <div className="film-programme">
        {films.map((f, i) => (
          <button
            key={f.title}
            className={i === index ? "active" : ""}
            onClick={() => {
              setIndex(i);
              discover("cinema");
            }}
          >
            <span>0{i + 1}</span>
            <div>
              <h3>{f.title}</h3>
              <p>{f.theme}</p>
            </div>
            <Film size={18} />
          </button>
        ))}
      </div>
      <p className="data-note cinema-note">
        Three original visual essays using the garden’s concept imagery.
      </p>
    </div>
  );
}
function Lab({ reduced, discover }: Props) {
  const [symmetry, setSymmetry] = useState(8),
    [layers, setLayers] = useState(4),
    [palette, setPalette] = useState("turquoise");
  const palettes: Record<string, string[]> = {
    turquoise: ["#7fbcba", "#d1b17a", "#476e70"],
    lapis: ["#8096d0", "#d1b17a", "#777191"],
    rose: ["#c69482", "#dfbd89", "#9dada4"],
  };
  const colors = palettes[palette];
  return (
    <div className="lab-room">
      <div className="section-title">
        <p className="eyebrow">06 / THE CURIOSITY LAB</p>
        <h1 tabIndex={-1}>
          What happens <em>if…</em>
        </h1>
        <p>A space for technology, small experiments, and playful questions.</p>
      </div>
      <div className="experiment-layout">
        <div className="pattern-stage">
          <span className="experiment-badge">
            <span /> LIVE EXPERIMENT 001
          </span>
          <svg
            viewBox="-220 -220 440 440"
            role="img"
            aria-label={`Generative Persian geometric pattern with ${symmetry}-fold symmetry and ${layers} layers`}
          >
            <circle
              r="198"
              fill="none"
              stroke="#cdb987"
              strokeWidth=".5"
              opacity=".35"
            />
            {Array.from({ length: layers }, (_, layer) => (
              <g
                key={layer}
                fill="none"
                stroke={colors[layer % 3]}
                strokeWidth={1.25 - layer * 0.09}
                opacity={0.9 - layer * 0.08}
              >
                {Array.from({ length: symmetry }, (_, i) => {
                  const rotation =
                    (i * 360) / symmetry + (layer * 180) / symmetry;
                  const radius = 170 - layer * 24;
                  return (
                    <polygon
                      key={i}
                      transform={`rotate(${rotation})`}
                      points={`0,${-radius} ${radius * 0.39},${-radius * 0.3} 0,${radius * 0.23} ${-radius * 0.39},${-radius * 0.3}`}
                    />
                  );
                })}
              </g>
            ))}
            <circle r="7" fill={colors[0]} />
          </svg>
          <span className="pattern-caption">
            ORDER, REPETITION, POSSIBILITY
          </span>
        </div>
        <div className="experiment-controls">
          <span className="eyebrow">GEOMETRY PLAYGROUND</span>
          <h2>
            Old patterns.
            <br />
            New possibilities.
          </h2>
          <p>
            Change a rule and see what emerges. This little generative study
            starts with the radial geometry that gives Orosi windows their
            rhythm.
          </p>
          <div className="slider-label">
            <label id="symmetry-label">Symmetry</label>
            <span>{symmetry} folds</span>
          </div>
          <Slider
            aria-labelledby="symmetry-label"
            min={4}
            max={16}
            step={1}
            value={[symmetry]}
            onValueChange={(v) => {
              setSymmetry(v[0]);
              discover("lab");
            }}
          />
          <div className="slider-label">
            <label id="layers-label">Layers</label>
            <span>{layers}</span>
          </div>
          <Slider
            aria-labelledby="layers-label"
            min={1}
            max={6}
            step={1}
            value={[layers]}
            onValueChange={(v) => {
              setLayers(v[0]);
              discover("lab");
            }}
          />
          <div className="palette-label">A little color</div>
          <div
            className="palette-options"
            role="group"
            aria-label="Pattern palette"
          >
            {Object.keys(palettes).map((p) => (
              <button
                key={p}
                aria-pressed={palette === p}
                onClick={() => {
                  setPalette(p);
                  discover("lab");
                }}
              >
                <span style={{ background: palettes[p][0] }} />
                {p === "lapis"
                  ? "Lapis blue"
                  : p === "rose"
                    ? "Rose & stone"
                    : "Persian turquoise"}
              </button>
            ))}
          </div>
          <button
            className="outline-button"
            onClick={() => {
              setSymmetry(4 + Math.floor(Math.random() * 13));
              setLayers(2 + Math.floor(Math.random() * 5));
              discover("lab");
            }}
          >
            <Sparkles size={16} /> Follow a different pattern
          </button>
          <p className="data-note">
            A browser-based generative art experiment. The pattern is
            mathematical; no AI service is involved.
          </p>
        </div>
      </div>
    </div>
  );
}
