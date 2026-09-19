"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  Compass,
  Expand,
  FlaskConical,
  Flower2,
  Globe2,
  Image as ImageIcon,
  Map,
  NotebookPen,
  Pause,
  Play,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Film,
  Code2,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { discoveries, rooms, type RoomId } from "@/lib/garden/content";
import { cinemaTransition, sceneTransitions } from "@/lib/garden/scene-transitions";
import { SceneEnvironment, SceneTransition } from "./scene-transition";
import { prepareSceneImage, useSceneTransition } from "./use-scene-transition";
import { CourtyardArtwork } from "./courtyard-artwork";
const loadRoom = () => import("./rooms");
const Room = lazy(loadRoom);
const SpatialGarden = lazy(() => import("./spatial-garden"));
const roomIcons = {
  courtyard: Flower2,
  library: BookOpen,
  travel: Globe2,
  gallery: ImageIcon,
  cinema: Film,
  lab: FlaskConical,
};
const validStamps = new Set(discoveries.map((d) => d.id));
type Modal = "about" | "journal" | "settings" | "map" | "contact" | null;
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function Garden() {
  const [entered, setEntered] = useState(false),
    [progress, setProgress] = useState(0),
    [room, setRoom] = useState<RoomId>("courtyard");
  const [modal, setModal] = useState<Modal>(null),
    [reduced, setReduced] = useState(false),
    [sound, setSound] = useState(false),
    [spatial, setSpatial] = useState(false);
  const [stamps, setStamps] = useState<string[]>([]),
    [journalReady, setJournalReady] = useState(false),
    [toast, setToast] = useState(""),
    [storageAvailable, setStorageAvailable] = useState(true);
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 }),
    [isDragging, setIsDragging] = useState(false);
  const [loaded, setLoaded] = useState(false),
    [imageError, setImageError] = useState(false);
  const progressRef = useRef(0),
    target = useRef(0),
    frame = useRef(0),
    drag = useRef<{ x: number; y: number } | null>(null),
    initialTouch = useRef(0);
  const audioRef = useRef<AudioContext | null>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    mainHeading = useRef<HTMLHeadingElement>(null);
  const current = rooms.find((r) => r.id === room)!;

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4000);
  }, []);
  const discover = useCallback((id: string) => {
    if (validStamps.has(id))
      setStamps((previous) =>
        previous.includes(id) ? previous : [...previous, id],
      );
  }, []);
  useEffect(() => {
    if (!journalReady) return;
    try {
      localStorage.setItem("fatemeh-garden-journal-v1", JSON.stringify(stamps));
    } catch {
      setStorageAvailable(false);
    }
  }, [stamps, journalReady]);
  const commitRoom = useCallback(
    (id: RoomId, history: "push" | "none" = "push") => {
      setRoom(id);
      setEntered(true);
      setModal(null);
      setCamera({ x: 0, y: 0, z: 1 });
      setSpatial(false);
      if (id === "courtyard") discover("garden");
      if (history === "push" && window.location.hash !== `#${id}`)
        window.history.pushState(null, "", `#${id}`);
      if (id === "courtyard")
        requestAnimationFrame(() => mainHeading.current?.focus());
    },
    [discover],
  );

  const entry = useSceneTransition({ commit: commitRoom, preload: loadRoom, notify });
  const warmCinema = () => {
    void loadRoom().catch(() => {});
    cinemaTransition.images.forEach((image) => { void prepareSceneImage(image); });
  };
  const goTo = (id: RoomId) => {
    if (entry.isLocked()) return;
    const config = sceneTransitions[id];
    if (entered && room === "courtyard" && config) {
      setModal(null);
      drag.current = null;
      setIsDragging(false);
      // The actual hotspot includes responsive offsets and the current view pan.
      const bounds = document.querySelector(`.hotspot-${id}`)?.getBoundingClientRect();
      const origin = bounds && !spatial ? {
        x: clamp((bounds.left + bounds.width / 2) / window.innerWidth, 0.05, 0.95),
        y: clamp((bounds.top + bounds.height / 2) / window.innerHeight, 0.05, 0.95),
      } : config.hotspot;
      entry.start(config, reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches, origin);
    } else {
      if (config) entry.selectImage(config);
      commitRoom(id);
    }
  };
  const cancelEntry = () => {
    entry.cancel();
    commitRoom("courtyard");
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("fatemeh-garden-motion");
      const raw = JSON.parse(
        localStorage.getItem("fatemeh-garden-journal-v1") || "[]",
      );
      if (Array.isArray(raw))
        setStamps([
          ...new Set(
            raw.filter(
              (v): v is string => typeof v === "string" && validStamps.has(v),
            ),
          ),
        ]);
    } catch {
      setStorageAvailable(false);
    }
    setJournalReady(true);
    setReduced(saved === null ? media.matches : saved === "reduced");
    const update = () => {
      if (saved === null) setReduced(media.matches);
    };
    media.addEventListener("change", update);
    const hash = window.location.hash.slice(1);
    if (rooms.some((r) => r.id === hash)) {
      if (hash === "cinema") entry.selectImage(cinemaTransition);
      commitRoom(hash as RoomId, "none");
    }
    const onHash = () => {
      const value = window.location.hash.slice(1);
      if (rooms.some((r) => r.id === value)) {
        entry.cancel();
        if (value === "cinema") entry.selectImage(cinemaTransition);
        commitRoom(value as RoomId, "none");
      } else if (!value) {
        entry.cancel();
        setEntered(false);
        setRoom("courtyard");
        target.current = 0;
        progressRef.current = 0;
        setProgress(0);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("hashchange", onHash);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [commitRoom, entry.cancel, entry.selectImage]);
  useEffect(() => {
    if (entered) discover("garden");
  }, [entered, discover]);
  useEffect(() => {
    if (entered || modal) return;
    let previous = 0;
    const animate = (time: number) => {
      const dt = previous ? Math.min(time - previous, 50) : 16;
      previous = time;
      const diff = target.current - progressRef.current;
      if (Math.abs(diff) > 0.0001) {
        progressRef.current += diff * (1 - Math.exp(-dt / 190));
        setProgress(progressRef.current);
      }
      if (target.current === 1 && progressRef.current > 0.995) {
        setProgress(1);
        setEntered(true);
        window.history.replaceState(null, "", "#courtyard");
        requestAnimationFrame(() => mainHeading.current?.focus());
        return;
      }
      frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      target.current = clamp(target.current + delta / 1400, 0, 1);
      if (reduced && target.current > 0.05) {
        target.current = 1;
        setEntered(true);
      }
    };
    window.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("wheel", wheel);
    };
  }, [entered, modal, reduced]);
  useEffect(() => {
    if (!entered || room !== "courtyard" || modal || spatial || entry.request) return;
    const down = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input,textarea,select,button,a,[role="dialog"]')
      )
        return;
      const key = e.key.toLowerCase();
      if (
        ![
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowleft",
          "arrowdown",
          "arrowright",
        ].includes(key)
      )
        return;
      e.preventDefault();
      setCamera((c) => ({
        x: clamp(
          c.x +
            (["a", "arrowleft"].includes(key)
              ? 18
              : ["d", "arrowright"].includes(key)
                ? -18
                : 0),
          -85,
          85,
        ),
        y: c.y,
        z: clamp(
          c.z +
            (["w", "arrowup"].includes(key)
              ? 0.018
              : ["s", "arrowdown"].includes(key)
                ? -0.018
                : 0),
          1,
          1.18,
        ),
      }));
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [entered, room, modal, spatial, entry.request]);
  useEffect(() => {
    if (!sound) return;
    const context = new AudioContext();
    audioRef.current = context;
    const buffer = context.createBuffer(
        1,
        context.sampleRate * 5,
        context.sampleRate,
      ),
      data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) {
      previous = (previous + 0.025 * (Math.random() * 2 - 1)) / 1.025;
      data[i] = previous * 2;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 650;
    const gain = context.createGain();
    gain.gain.value = 0.18;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
    void context.resume().catch(() => {
      setSound(false);
      notify("Sound could not start in this browser.");
    });
    const visibility = () => {
      if (document.hidden) void context.suspend();
      else void context.resume();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      source.stop();
      void context.close();
      audioRef.current = null;
    };
  }, [sound, notify]);
  const enter = () => {
    if (reduced) {
      setEntered(true);
      window.history.replaceState(null, "", "#courtyard");
    } else target.current = 1;
  };
  const setMotion = (value: boolean) => {
    setReduced(value);
    try {
      localStorage.setItem("fatemeh-garden-motion", value ? "reduced" : "full");
    } catch {
      setStorageAvailable(false);
    }
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else notify("Fullscreen is not available in this browser.");
    } catch {
      notify("Fullscreen is not available here.");
    }
  };
  const move = (direction: string) =>
    setCamera((c) => ({
      ...c,
      x: clamp(
        c.x + (direction === "left" ? 25 : direction === "right" ? -25 : 0),
        -85,
        85,
      ),
      z: clamp(
        c.z +
          (direction === "forward" ? 0.04 : direction === "back" ? -0.04 : 0),
        1,
        1.18,
      ),
    }));
  const discoverSecret = () => {
    discover("secret");
    notify("A moment of stillness — added to your journal.");
  };

  return (
    <main
      className={`garden-app ${entered ? "has-entered" : "at-gate"} ${reduced ? "reduced-motion" : ""} room-${room} ${entry.request ? "is-entering-scene" : ""}`}
      data-entry-phase={entry.request ? entry.phase : undefined}
      data-entry-destination={entry.request?.config.destination}
      data-entry-reduced={entry.request?.reduced || undefined}
      data-entry-spatial={entry.request && spatial ? true : undefined}
      style={entry.request ? {
        "--entry-x": `${(0.5 - entry.request.origin.x) * 100}vw`,
        "--entry-y": `${(0.5 - entry.request.origin.y) * 100}vh`,
      } as CSSProperties : undefined}
    >
      <div className="garden-content-shell" inert={!!entry.request} aria-busy={!!entry.request}>
      <a
        className="skip-link"
        href={room === "gallery" ? "#gallery-exploration" : "#room-navigation"}
        onClick={(event) => {
          setEntered(true);
          if (room === "gallery") {
            event.preventDefault();
            document.getElementById("gallery-exploration")?.focus();
          }
        }}
      >
        Skip to room navigation
      </a>
      <span className="sr-only" role="status">
        {entered ? current.name : "The entrance gate"}
      </span>
      <div className="world-underlay" aria-hidden="true" />
      {room === "cinema" &&
        <SceneEnvironment image={entry.sceneImage ?? cinemaTransition.images[0]} className="cinema-environment" />}
      <header className="world-header">
        <button
          className="brand"
          onClick={() => (entered ? goTo("courtyard") : setModal("about"))}
          aria-label="Fatemeh Mohseni — home"
        >
          <Flower2 strokeWidth={1.2} />
          <span>
            FATEMEH<span className="brand-second">MOHSENI</span>
          </span>
        </button>
        <div className="header-center">
          <span lang="fa" dir="rtl">
            باغی از دنیای من
          </span>
          <span>A PERSONAL DIGITAL GARDEN</span>
        </div>
        <div className="header-actions">
          <button
            className="text-button about-link"
            onClick={() => setModal("about")}
          >
            The person behind the garden
          </button>
          <button
            className="icon-button journal-button"
            onClick={() => setModal("journal")}
            aria-label={`Open discovery journal, ${stamps.length} of 7 discoveries`}
          >
            <NotebookPen size={19} />
            <span>
              {stamps.length}
              <span className="total-stamps"> / 7</span>
            </span>
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("settings")}
            aria-label="Experience settings"
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>

      <section
        className="courtyard-scene"
        aria-label="Persian courtyard"
        aria-hidden={!entered || room !== "courtyard"}
        inert={!entered || room !== "courtyard"}
        style={{ visibility: room === "courtyard" ? "visible" : "hidden" }}
      >
        {spatial ? (
          <Suspense
            fallback={
              <div className="scene-loading">Opening the walking garden…</div>
            }
          >
            <SpatialGarden
              reduced={reduced}
              enteringCinema={!!entry.request && !entry.request.reduced && entry.phase !== "preparing"}
              onRoom={goTo}
              onSecret={discoverSecret}
            />
          </Suspense>
        ) : (
          <div
            className={`camera-surface ${isDragging ? "dragging" : ""}`}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              drag.current = { x: e.clientX, y: e.clientY };
              setIsDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current || reduced) return;
              const dx = e.clientX - drag.current.x,
                dy = e.clientY - drag.current.y;
              drag.current = { x: e.clientX, y: e.clientY };
              setCamera((c) => ({
                ...c,
                x: clamp(c.x + dx * 0.35, -85, 85),
                y: clamp(c.y + dy * 0.2, -28, 28),
              }));
            }}
            onPointerUp={() => {
              drag.current = null;
              setIsDragging(false);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setIsDragging(false);
            }}
          >
            <div
              className="courtyard-plane"
              style={{
                transform: `translate3d(${camera.x}px,${camera.y}px,0) scale(${1.06 + camera.z - 1})`,
              }}
            >
              <CourtyardArtwork
                enabled={entered && room === "courtyard" && !modal && !entry.request}
                reduced={reduced}
                onDiscover={() => discover("secret")}
              />
              <div className="scene-shade" />
              <div className="hotspots">
                {(
                  [
                    ["library", 27, 49],
                    ["travel", 51, 39],
                    ["gallery", 75, 49],
                    ["cinema", 16, 68],
                    ["lab", 87, 65],
                  ] as [RoomId, number, number][]
                ).map(([id, x, y]) => {
                  const r = rooms.find((r) => r.id === id)!,
                    Icon = roomIcons[id];
                  return (
                    <button
                      key={id}
                      className={`hotspot hotspot-${id}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => goTo(id)}
                      onPointerEnter={id === "cinema" ? warmCinema : undefined}
                      onFocus={id === "cinema" ? warmCinema : undefined}
                    >
                      <span className="hotspot-icon">
                        <Icon size={18} strokeWidth={1.4} />
                      </span>
                      <span className="hotspot-label">
                        {r.name}
                        <span>{r.persian}</span>
                      </span>
                    </button>
                  );
                })}
                <button
                  className="water-secret"
                  style={{ left: "50%", top: "76%" }}
                  onClick={discoverSecret}
                  aria-label="Pause by the water"
                >
                  <Sparkles size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        {!spatial && (
          <div className="courtyard-welcome">
            <p className="eyebrow">ANCIENT ROOTS. OPEN HORIZONS.</p>
            <h1 ref={mainHeading} tabIndex={-1}>
              Welcome to
              <br />
              <em>my world.</em>
            </h1>
            <p>
              I’m Fatemeh. A maker, a wanderer,
              <br />
              and a forever-curious soul.
            </p>
            <button className="quiet-link" onClick={() => setModal("about")}>
              A little about me <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="scene-location">
          <span className="location-line" />
          <span>
            {spatial ? "THE WALKING GARDEN" : "THE CENTRAL COURTYARD"}
          </span>
          <span lang="fa">خوش آمدید</span>
        </div>
        <div className="exploration-tools">
          {!spatial && (
            <button
              className="icon-button"
              aria-label="Reset courtyard view"
              onClick={() => setCamera({ x: 0, y: 0, z: 1 })}
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
        {!spatial && (
          <div className="touch-pad" aria-label="Move around the courtyard">
            <button aria-label="Move forward" onClick={() => move("forward")}>
              <ArrowUp />
            </button>
            <button aria-label="Move left" onClick={() => move("left")}>
              <ArrowLeft />
            </button>
            <button aria-label="Move backward" onClick={() => move("back")}>
              <ArrowDown />
            </button>
            <button aria-label="Move right" onClick={() => move("right")}>
              <ArrowRight />
            </button>
          </div>
        )}
      </section>

      {entered && room !== "courtyard" && (
        <section key={room} className="room-content" aria-label={current.name}>
          {room !== "gallery" && <div className="room-topline">
            <button className="quiet-link" onClick={() => goTo("courtyard")}>
              <ArrowLeft size={17} /> Back to the courtyard
            </button>
            <span lang="fa">{current.persian}</span>
          </div>}
          <Suspense
            fallback={
              <div className="scene-loading">
                Opening {current.name.toLowerCase()}…
              </div>
            }
          >
            <Room
              id={room}
              onRoom={goTo}
              reduced={reduced}
              discover={discover}
              notify={notify}
              deferFocus={!!entry.request}
            />
          </Suspense>
        </section>
      )}

      {!entered && (
        <section
          className="entrance"
          aria-label="Entrance to Fatemeh’s digital garden. Scroll, swipe up, or press Enter to open the door."
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && ["Enter", " ", "ArrowDown"].includes(event.key)) {
              event.preventDefault();
              enter();
            }
          }}
          onTouchStart={(e) => {
            initialTouch.current = e.touches[0].clientY;
          }}
          onTouchMove={(e) => {
            const delta = initialTouch.current - e.touches[0].clientY;
            initialTouch.current = e.touches[0].clientY;
            target.current = clamp(target.current + delta / 700, 0, 1);
            if (reduced && target.current > 0.05) setEntered(true);
          }}
        >
          <div
            className="gate-perspective"
            style={{ "--open": progress } as CSSProperties}
          >
            <div className="gate-leaf gate-left">
              <img
                src="/images/door.webp"
                alt="Closed carved wooden Persian door with colored Orosi glass"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setLoaded(true);
                  setImageError(true);
                }}
                fetchPriority="high"
              />
            </div>
            <div className="gate-leaf gate-right" aria-hidden="true">
              <img src="/images/door.webp" alt="" />
            </div>
          </div>
          <div className="gate-vignette" style={{ opacity: 1 - progress }} />
          <div
            className="entrance-copy"
            style={{
              opacity: Math.max(0, 1 - progress * 2),
              transform: `translateY(${-progress * 30}px)`,
            }}
          >
            <p className="eyebrow">YOU ARE INVITED INTO</p>
            <h1>
              A little world
              <br />
              <em>of my own.</em>
            </h1>
            <p>Stories, faraway places, and things that make me curious.</p>
          </div>
          <div className="entrance-invitation">
            <span className="persian-welcome" lang="fa" dir="rtl">
              به دنیای من خوش آمدید
            </span>
            <span className="scroll-cue">
              <ArrowDown size={14} />{" "}
              Scroll or swipe up to open the door
            </span>
            <div
              className="door-progress"
              role="progressbar"
              aria-label="Door opening"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            {!loaded && (
              <span className="secondary-label">Letting the light in…</span>
            )}
            {imageError && (
              <span className="secondary-label">
                The entrance image couldn’t load. You can still enter.
              </span>
            )}
          </div>
          <div className="entrance-footer">
            <span>A JOURNEY BETWEEN ROOTS & POSSIBILITY</span>
            <button className="quiet-link" onClick={() => setModal("settings")}>
              Make yourself comfortable <Settings2 size={15} />
            </button>
          </div>
        </section>
      )}

      {entered && room !== "gallery" && (
        <>
          <nav
            className="room-dock"
            id="room-navigation"
            aria-label="Explore the garden"
          >
            {rooms.map((r) => {
              const Icon = roomIcons[r.id];
              return (
                <button
                  key={r.id}
                  onClick={() => goTo(r.id)}
                  onPointerEnter={r.id === "cinema" ? warmCinema : undefined}
                  onFocus={r.id === "cinema" ? warmCinema : undefined}
                  className={room === r.id ? "active" : ""}
                  aria-current={room === r.id ? "page" : undefined}
                >
                  <Icon size={19} strokeWidth={1.5} />
                  <span>
                    {r.id === "travel"
                      ? "Observatory"
                      : r.id === "lab"
                        ? "The Lab"
                        : r.id === "cinema"
                          ? "Cinema"
                          : r.name.replace("The ", "")}
                  </span>
                  {room === r.id && <span className="nav-indicator" />}
                </button>
              );
            })}
          </nav>
          <div className="world-footer">
            <button onClick={() => setModal("map")}>
              <Map size={16} /> Garden map
            </button>
            <span className="movement-hint">
              {room === "courtyard"
                ? "W A S D / arrow keys to explore · drag to look around"
                : "Take your time. There’s no wrong way to wander."}
            </span>
            <button onClick={() => setModal("contact")}>
              Say hello <ArrowDownLeft size={16} />
            </button>
          </div>
        </>
      )}
      <div className="ambient-controls">
        <button
          className="icon-button"
          aria-label={sound ? "Mute ambient wind" : "Enable ambient wind"}
          aria-pressed={sound}
          onClick={() => {
            if (typeof AudioContext === "undefined") {
              notify("Ambient audio is not supported in this browser.");
              return;
            }
            setSound((v) => !v);
          }}
        >
          {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <span>{sound ? "Sound on" : "Sound off"}</span>
        <button
          className="icon-button fullscreen-button"
          aria-label="Toggle fullscreen"
          onClick={fullscreen}
        >
          <Expand size={17} />
        </button>
      </div>
      <div
        className={`discovery-toast ${toast ? "visible" : ""}`}
        role="status"
      >
        <Sparkles size={16} />
        {toast}
      </div>

      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className={`garden-dialog modal-${modal}`}>
          <DialogTitle>
            {modal === "about"
              ? "The person behind the garden"
              : modal === "journal"
                ? "Your garden journal"
                : modal === "settings"
                  ? "Make yourself comfortable"
                  : modal === "map"
                    ? "Where will curiosity take you?"
                    : "A conversation starts with hello."}
          </DialogTitle>
          <DialogDescription>
            {modal === "about"
              ? "Fatemeh Mohseni · فاطمه محسنی"
              : modal === "journal"
                ? `${stamps.length} of ${discoveries.length} little discoveries`
                : modal === "settings"
                  ? "A few ways to make this world feel right for you."
                  : modal === "map"
                    ? "Every room opens onto a different part of this world."
                    : "Thank you for spending a little time in my world."}
          </DialogDescription>
          {modal === "about" && (
            <div className="about-body">
              <div className="monogram" aria-label="Fatemeh Mohseni monogram">
                fm<span>فاطمه</span>
              </div>
              <p className="serif-intro">
                A journey between ancient roots
                <br />
                and future worlds.
              </p>
              <p>
                I’m Fatemeh Mohseni — a software engineer and AI developer with
                a curiosity that reaches beyond the screen.
              </p>
              <p>
                This is a space for technology, art, travel, and life. A place
                to collect ideas, follow new paths, and stay connected to my
                Iranian roots.
              </p>
              <div className="identity-words">
                MAKER <span>·</span> TRAVELER <span>·</span> EXPLORER
              </div>
              <button
                className="solid-button"
                onClick={() => goTo("courtyard")}
              >
                Wander a little <ArrowRight size={16} />
              </button>
            </div>
          )}
          {modal === "journal" && (
            <>
              <div className="journal-progress">
                <span
                  style={{
                    width: `${(stamps.length / discoveries.length) * 100}%`,
                  }}
                />
              </div>
              <div className="journal-list">
                {discoveries.map((d) => (
                  <article
                    key={d.id}
                    className={stamps.includes(d.id) ? "discovered" : ""}
                  >
                    <span className="stamp-mark">
                      {stamps.includes(d.id) ? (
                        <Flower2 size={22} />
                      ) : (
                        <Compass size={20} />
                      )}
                    </span>
                    <div>
                      <h3>
                        {stamps.includes(d.id)
                          ? d.title
                          : "An undiscovered moment"}
                      </h3>
                      <p>
                        {stamps.includes(d.id)
                          ? d.text
                          : d.id === "secret"
                            ? "Linger by the courtyard water."
                            : `Explore ${d.place.toLowerCase()} to find this memory.`}
                      </p>
                    </div>
                    {stamps.includes(d.id) && <Check size={15} />}
                  </article>
                ))}
              </div>
              <p className="data-note">
                {storageAvailable
                  ? "Your discoveries stay in this browser, on this device."
                  : "Browser storage is unavailable. Your discoveries will last for this visit."}
              </p>
            </>
          )}
          {modal === "settings" && (
            <div className="settings-body">
              <label className="setting-row" htmlFor="reduce-motion">
                <div>
                  <strong>Reduced motion</strong>
                  <p>Still scenes and immediate transitions.</p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={reduced}
                  onCheckedChange={setMotion}
                />
              </label>
              <label className="setting-row" htmlFor="ambient-sound">
                <div>
                  <strong>Ambient sound</strong>
                  <p>A quiet, synthesized breeze.</p>
                </div>
                <Switch
                  id="ambient-sound"
                  checked={sound}
                  onCheckedChange={(v) => {
                    if (typeof AudioContext !== "undefined") setSound(v);
                    else notify("Audio is not supported in this browser.");
                  }}
                />
              </label>
              <div className="control-guide">
                <h3>A few ways to wander</h3>
                <p>
                  Scroll or swipe up to open the entrance. Choose any room from
                  the navigation. In the courtyard, use WASD or arrow keys and
                  drag to look around.
                </p>
                <p>
                  On touch screens, use the direction buttons. Every story and
                  destination is also available through buttons and lists.
                </p>
              </div>
              <button
                className="outline-button"
                onClick={() => {
                  setModal(null);
                  setEntered(false);
                  setRoom("courtyard");
                  setSpatial(false);
                  setProgress(0);
                  progressRef.current = 0;
                  target.current = 0;
                  window.history.replaceState(
                    null,
                    "",
                    window.location.pathname,
                  );
                }}
              >
                Revisit the entrance <RotateCcw size={15} />
              </button>
            </div>
          )}
          {modal === "map" && (
            <div className="map-rooms">
              {rooms.map((r) => {
                const Icon = roomIcons[r.id];
                return (
                  <button key={r.id} onClick={() => goTo(r.id)}>
                    <span className="map-number">{r.number}</span>
                    <Icon size={24} strokeWidth={1.3} />
                    <div>
                      <h3>{r.name}</h3>
                      <p>{r.subtitle}</p>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                );
              })}
            </div>
          )}
          {modal === "contact" && (
            <div className="contact-body">
              <p className="serif-intro">
                Good things often begin
                <br />
                with a little curiosity.
              </p>
              <p>
                For a shared idea, an interesting question, or a glimpse of what
                I’m making, find me on GitHub.
              </p>
              <a
                className="solid-button"
                href="https://github.com/fatemeh-mohseni-AI"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Code2 size={19} /> Find me on GitHub <ArrowRight size={17} />
              </a>
              <p className="data-note">
                This opens Fatemeh’s GitHub profile in a new tab.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
      {entry.request && <SceneTransition
        config={entry.request.config}
        image={entry.request.image}
        phase={entry.phase}
        imageReady={entry.imageReady}
        reduced={entry.request.reduced}
        onCancel={cancelEntry}
      />}
    </main>
  );
}
