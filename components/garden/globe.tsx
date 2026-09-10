"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import type { Location } from "@/lib/garden/data";

const position = (lat: number, lon: number, radius = 1) =>
  new THREE.Vector3(
    Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180) * radius,
    Math.sin((lat * Math.PI) / 180) * radius,
    -Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180) * radius,
  );

const markerPalette = {
  home: { fill: "#f3e7cd", line: "#24463c", glow: "rgba(239, 213, 159, .55)" },
  visited: { fill: "#79bbae", line: "#102d27", glow: "rgba(91, 190, 170, .48)" },
  dream: { fill: "#d5af6d", line: "#21372f", glow: "rgba(225, 186, 111, .5)" },
} satisfies Record<Location["type"], { fill: string; line: string; glow: string }>;

function drawMarkerIcon(
  context: CanvasRenderingContext2D,
  type: Location["type"],
) {
  context.lineWidth = 7;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (type === "home") {
    context.beginPath();
    context.moveTo(54, 82);
    context.lineTo(80, 59);
    context.lineTo(106, 82);
    context.moveTo(61, 78);
    context.lineTo(61, 106);
    context.lineTo(99, 106);
    context.lineTo(99, 78);
    context.moveTo(76, 106);
    context.lineTo(76, 91);
    context.stroke();
    return;
  }
  if (type === "visited") {
    context.beginPath();
    context.moveTo(80, 49);
    context.lineTo(91, 78);
    context.lineTo(80, 111);
    context.lineTo(69, 78);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(80, 80, 5, 0, Math.PI * 2);
    context.fill();
    return;
  }
  const points = 8;
  context.beginPath();
  for (let index = 0; index < points * 2; index++) {
    const radius = index % 2 === 0 ? 31 : 12;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const x = 80 + Math.cos(angle) * radius;
    const y = 80 + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.stroke();
}

function createMarkerTexture(type: Location["type"], selected: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  const color = markerPalette[type];
  const glow = context.createRadialGradient(80, 80, 18, 80, 80, 76);
  glow.addColorStop(0, color.glow);
  glow.addColorStop(0.5, selected ? color.glow : "rgba(0,0,0,0)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 160, 160);
  context.shadowBlur = selected ? 24 : 13;
  context.shadowColor = color.glow;
  context.fillStyle = color.fill;
  context.strokeStyle = selected ? "#fff5df" : "rgba(255, 244, 217, .78)";
  context.lineWidth = selected ? 6 : 4;
  context.beginPath();
  context.arc(80, 80, selected ? 43 : 38, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  if (selected) {
    context.strokeStyle = "rgba(240, 205, 140, .55)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(80, 80, 53, 0, Math.PI * 2);
    context.stroke();
  }
  context.strokeStyle = color.line;
  context.fillStyle = color.line;
  drawMarkerIcon(context, type);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

type GlobeApi = {
  zoom: (distance: number) => void;
  focus: (location: Location) => void;
  select: (id: string | null) => void;
  reset: () => void;
  pause: (paused: boolean) => void;
};

type MarkerRecord = {
  location: Location;
  material: THREE.SpriteMaterial;
  sprite: THREE.Sprite;
};

export default function Globe({
  locations,
  selected,
  onSelect,
  reduced,
}: {
  locations: Location[];
  selected: string | null;
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onSelect);
  const api = useRef<GlobeApi | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [textureError, setTextureError] = useState(false);
  const [paused, setPaused] = useState(reduced);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!host.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      queueMicrotask(() => setUnavailable(true));
      return;
    }

    let alive = true;
    let rotating = !reduced;
    let selectedId: string | null = null;
    let hoveredId: string | null = null;
    let raf = 0;
    let previous = 0;
    let flight:
      | {
          startDirection: THREE.Vector3;
          endDirection: THREE.Vector3;
          startRadius: number;
          endRadius: number;
          startTime: number;
          duration: number;
        }
      | null = null;

    const element = host.current;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive Earth. Drag to rotate, scroll or pinch to zoom, or choose a destination from the lists beside the globe.",
    );
    renderer.domElement.setAttribute("aria-describedby", "globe-instructions");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.copy(position(25, 60, 3.2));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.72;
    controls.maxDistance = 4.7;
    controls.enableDamping = false;
    controls.autoRotateSpeed = 0.24;
    controls.autoRotate = !reduced;

    scene.add(new THREE.AmbientLight(0xb9d8d2, 1.3));
    const light = new THREE.DirectionalLight(0xffefd4, 2.35);
    light.position.set(4, 3, 5);
    scene.add(light);
    const rimLight = new THREE.DirectionalLight(0x5ca69c, 0.65);
    rimLight.position.set(-4, 0, -3);
    scene.add(rimLight);

    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.02,
    });
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 72, 48),
      earthMaterial,
    );
    scene.add(earth);

    const render = () => {
      if (alive && !document.hidden) renderer.render(scene, camera);
    };
    const earthTexture = new THREE.TextureLoader().load(
      "/images/earth.webp",
      () => {
        if (alive) {
          setReady(true);
          render();
        }
      },
      undefined,
      () => {
        if (alive) {
          setTextureError(true);
          setReady(true);
          render();
        }
      },
    );
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = earthTexture;

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.025, 56, 36),
      new THREE.MeshBasicMaterial({
        color: 0x83c2b8,
        transparent: true,
        opacity: 0.11,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.075, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x9fd3c9,
        transparent: true,
        opacity: 0.035,
        side: THREE.BackSide,
      }),
    );
    scene.add(halo);

    const markerTextures = {
      home: {
        idle: createMarkerTexture("home", false),
        selected: createMarkerTexture("home", true),
      },
      visited: {
        idle: createMarkerTexture("visited", false),
        selected: createMarkerTexture("visited", true),
      },
      dream: {
        idle: createMarkerTexture("dream", false),
        selected: createMarkerTexture("dream", true),
      },
    };
    const markers: MarkerRecord[] = locations.map((location) => {
      const material = new THREE.SpriteMaterial({
        map: markerTextures[location.type].idle,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position(location.latitude, location.longitude, 1.045));
      sprite.scale.set(0.145, 0.145, 1);
      sprite.userData.id = location.id;
      scene.add(sprite);
      return { location, material, sprite };
    });
    const markerObjects = markers.map((marker) => marker.sprite);

    const updateMarkerAppearance = () => {
      for (const marker of markers) {
        const isSelected = marker.location.id === selectedId;
        const isHovered = marker.location.id === hoveredId;
        marker.material.map =
          markerTextures[marker.location.type][isSelected ? "selected" : "idle"];
        marker.material.opacity = isSelected || isHovered ? 1 : 0.92;
        const size = isSelected ? 0.19 : isHovered ? 0.165 : 0.145;
        marker.sprite.scale.set(size, size, 1);
        marker.material.needsUpdate = true;
      }
      render();
    };

    const updateFlight = (time: number) => {
      if (!flight) return false;
      const progress = THREE.MathUtils.clamp(
        (time - flight.startTime) / flight.duration,
        0,
        1,
      );
      const eased = 1 - Math.pow(1 - progress, 4);
      const rotation = new THREE.Quaternion().setFromUnitVectors(
        flight.startDirection,
        flight.endDirection,
      );
      const step = new THREE.Quaternion().slerpQuaternions(
        new THREE.Quaternion(),
        rotation,
        eased,
      );
      const direction = flight.startDirection.clone().applyQuaternion(step);
      const radius = THREE.MathUtils.lerp(
        flight.startRadius,
        flight.endRadius,
        eased,
      );
      camera.position.copy(direction.multiplyScalar(radius));
      controls.update();
      if (progress >= 1) flight = null;
      return true;
    };

    const tick = (time: number) => {
      raf = 0;
      if (!alive || document.hidden) return;
      const movingToPlace = updateFlight(time);
      if (!movingToPlace && rotating) {
        controls.update(previous ? Math.min((time - previous) / 1000, 0.05) : 0.016);
      }
      previous = time;
      render();
      if (flight || rotating) raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
      controls.autoRotate = rotating && !flight;
      if ((rotating || flight) && !document.hidden)
        raf = requestAnimationFrame(tick);
      else render();
    };
    const flyTo = (destination: THREE.Vector3, endRadius = 2.55) => {
      rotating = false;
      setPaused(true);
      if (reduced) {
        camera.position.copy(destination.clone().normalize().multiplyScalar(endRadius));
        controls.update();
        render();
        return;
      }
      flight = {
        startDirection: camera.position.clone().normalize(),
        endDirection: destination.clone().normalize(),
        startRadius: camera.position.length(),
        endRadius,
        startTime: performance.now(),
        duration: 1150,
      };
      sync();
    };

    controls.addEventListener("change", render);
    controls.addEventListener("start", () => {
      rotating = false;
      flight = null;
      setPaused(true);
      sync();
    });

    const observer = new ResizeObserver(() => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    });
    observer.observe(element);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let start = { x: 0, y: 0 };
    const hitTest = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([earth, ...markerObjects])[0];
      return hit?.object.userData.id as string | undefined;
    };
    const pointerDown = (event: PointerEvent) => {
      start = { x: event.clientX, y: event.clientY };
    };
    const pointerMove = (event: PointerEvent) => {
      const nextHovered = hitTest(event) ?? null;
      if (nextHovered === hoveredId) return;
      hoveredId = nextHovered;
      renderer.domElement.style.cursor = hoveredId ? "pointer" : "grab";
      updateMarkerAppearance();
    };
    const pointerLeave = () => {
      if (!hoveredId) return;
      hoveredId = null;
      renderer.domElement.style.cursor = "grab";
      updateMarkerAppearance();
    };
    const pointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6)
        return;
      const id = hitTest(event);
      if (id) callback.current(id);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerleave", pointerLeave);
    renderer.domElement.addEventListener("pointerup", pointerUp);

    const contextLost = (event: Event) => {
      event.preventDefault();
      setUnavailable(true);
      rotating = false;
      flight = null;
      sync();
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);

    api.current = {
      zoom: (distance) => {
        camera.position.multiplyScalar(distance);
        camera.position.setLength(
          THREE.MathUtils.clamp(camera.position.length(), 1.72, 4.7),
        );
        controls.update();
        render();
      },
      focus: (location) => {
        flyTo(position(location.latitude, location.longitude, 1));
      },
      select: (id) => {
        selectedId = id;
        updateMarkerAppearance();
      },
      reset: () => {
        flyTo(position(25, 60, 1), 3.2);
      },
      pause: (isPaused) => {
        rotating = !isPaused && !reduced;
        if (rotating) flight = null;
        sync();
      },
    };

    document.addEventListener("visibilitychange", sync);
    queueMicrotask(() => {
      if (!alive) return;
      setPaused(reduced);
      setUnavailable(false);
    });
    sync();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controls.dispose();
      earthTexture.dispose();
      Object.values(markerTextures).forEach((set) => {
        set.idle.dispose();
        set.selected.dispose();
      });
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
        if (object instanceof THREE.Sprite) object.material.dispose();
      });
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerleave", pointerLeave);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, [locations, reduced]);

  useEffect(() => {
    const location = locations.find((item) => item.id === selected);
    api.current?.select(selected);
    if (location) api.current?.focus(location);
  }, [selected, locations]);

  return (
    <div className="globe-stage">
      <div
        ref={host}
        className={`globe-canvas ${unavailable ? "hidden-canvas" : ""}`}
      />
      <div className="globe-orbit globe-orbit--outer" aria-hidden="true" />
      <div className="globe-orbit globe-orbit--inner" aria-hidden="true" />
      {unavailable && (
        <div className="globe-fallback">
          <img src="/images/earth.webp" alt="NASA Blue Marble world map" />
          <p>
            The 3D view isn’t available here. Explore every destination from the
            lists.
          </p>
        </div>
      )}
      {!ready && !unavailable && (
        <p className="globe-loading">Bringing the world into view…</p>
      )}
      {textureError && !unavailable && (
        <p className="globe-loading">
          Earth imagery could not load. Destinations are still available.
        </p>
      )}
      <div className="globe-controls">
        <button
          type="button"
          disabled={unavailable}
          aria-label="Zoom in"
          onClick={() => api.current?.zoom(0.85)}
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          disabled={unavailable}
          aria-label="Zoom out"
          onClick={() => api.current?.zoom(1.15)}
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
          disabled={unavailable}
          aria-label="Reset Earth view"
          onClick={() => api.current?.reset()}
        >
          <RotateCcw size={17} />
        </button>
        <button
          type="button"
          disabled={unavailable || reduced}
          aria-label={paused ? "Rotate Earth automatically" : "Pause Earth rotation"}
          onClick={() => {
            setPaused((value) => !value);
            api.current?.pause(!paused);
          }}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
      <p id="globe-instructions" className="globe-help">
        DRAG TO ORBIT <span>·</span> SELECT A MARKER <span>·</span> SCROLL TO ZOOM
      </p>
    </div>
  );
}
