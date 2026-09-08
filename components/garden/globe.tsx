"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Minus, Plus, RotateCcw, Pause, Play } from "lucide-react";
import type { Location } from "@/lib/garden/data";
const position = (lat: number, lon: number, r = 1) =>
  new THREE.Vector3(
    Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180) * r,
    Math.sin((lat * Math.PI) / 180) * r,
    -Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180) * r,
  );
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
  const host = useRef<HTMLDivElement>(null),
    callback = useRef(onSelect),
    api = useRef<{
      zoom: (d: number) => void;
      focus: (p: Location) => void;
      reset: () => void;
      pause: (p: boolean) => void;
    } | null>(null);
  const [unavailable, setUnavailable] = useState(false),
    [textureError, setTextureError] = useState(false),
    [paused, setPaused] = useState(reduced),
    [ready, setReady] = useState(false);
  callback.current = onSelect;
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
      setUnavailable(true);
      return;
    }
    let alive = true,
      rotating = !reduced,
      raf = 0,
      previous = 0;
    const element = host.current;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0, 0);
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive Earth. Drag to rotate and pinch or scroll to zoom. Select destinations from the adjacent list.",
    );
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.copy(position(25, 60, 3.5));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.7;
    controls.maxDistance = 5;
    controls.enableDamping = false;
    controls.autoRotateSpeed = 0.22;
    controls.autoRotate = !reduced;
    scene.add(new THREE.AmbientLight(0xc7dcf7, 1.45));
    const light = new THREE.DirectionalLight(0xffefd7, 2.2);
    light.position.set(4, 3, 5);
    scene.add(light);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.03,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), material);
    scene.add(earth);
    const texture = new THREE.TextureLoader().load(
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
        }
      },
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.014, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x6babc0,
        transparent: true,
        opacity: 0.09,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);
    const pins: THREE.Mesh[] = [];
    locations.forEach((p) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.017, 12, 8),
        new THREE.MeshBasicMaterial({
          color:
            p.type === "visited"
              ? 0x81c9b9
              : p.type === "dream_destination"
                ? 0xe8bf75
                : 0xeee5d2,
        }),
      );
      mesh.position.copy(position(p.latitude, p.longitude, 1.022));
      mesh.userData.id = p.id;
      scene.add(mesh);
      pins.push(mesh);
    });
    const render = () => {
      if (alive && !document.hidden) renderer.render(scene, camera);
    };
    const tick = (t: number) => {
      raf = 0;
      if (!alive || document.hidden || !rotating) return;
      controls.update(previous ? Math.min((t - previous) / 1000, 0.05) : 0.016);
      previous = t;
      render();
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
      controls.autoRotate = rotating;
      if (rotating && !document.hidden) raf = requestAnimationFrame(tick);
      else render();
    };
    controls.addEventListener("change", render);
    controls.addEventListener("start", () => {
      rotating = false;
      setPaused(true);
      sync();
    });
    const observer = new ResizeObserver(() => {
      const width = element.clientWidth,
        height = element.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    });
    observer.observe(element);
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let start = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([earth, ...pins])[0];
      if (hit?.object.userData.id) callback.current(hit.object.userData.id);
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    const lost = (e: Event) => {
      e.preventDefault();
      setUnavailable(true);
      rotating = false;
      sync();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    api.current = {
      zoom: (d) => {
        camera.position.multiplyScalar(d);
        camera.position.setLength(
          THREE.MathUtils.clamp(camera.position.length(), 1.7, 5),
        );
        controls.update();
        render();
      },
      focus: (p) => {
        rotating = false;
        setPaused(true);
        camera.position.copy(position(p.latitude, p.longitude, 2.9));
        controls.update();
        sync();
      },
      reset: () => {
        camera.position.copy(position(25, 60, 3.5));
        controls.update();
        render();
      },
      pause: (p) => {
        rotating = !p && !reduced;
        sync();
      },
    };
    document.addEventListener("visibilitychange", sync);
    setPaused(reduced);
    setUnavailable(false);
    sync();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controls.dispose();
      texture.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, [locations, reduced]);
  useEffect(() => {
    const p = locations.find((l) => l.id === selected);
    if (p) api.current?.focus(p);
  }, [selected, locations]);
  return (
    <div className="globe-stage">
      <div
        ref={host}
        className={`globe-canvas ${unavailable ? "hidden-canvas" : ""}`}
      />
      {unavailable && (
        <div className="globe-fallback">
          <img src="/images/earth.webp" alt="NASA Blue Marble world map" />
          <p>
            The 3D view isn’t available here. Explore every destination from the
            list.
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
          disabled={unavailable}
          aria-label="Zoom in"
          onClick={() => api.current?.zoom(0.85)}
        >
          <Plus size={18} />
        </button>
        <button
          disabled={unavailable}
          aria-label="Zoom out"
          onClick={() => api.current?.zoom(1.15)}
        >
          <Minus size={18} />
        </button>
        <button
          disabled={unavailable}
          aria-label="Reset Earth view"
          onClick={() => api.current?.reset()}
        >
          <RotateCcw size={17} />
        </button>
        <button
          disabled={unavailable || reduced}
          aria-label={
            paused ? "Rotate Earth automatically" : "Pause Earth rotation"
          }
          onClick={() => {
            setPaused((v) => !v);
            api.current?.pause(!paused);
          }}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
      <p className="globe-help">
        DRAG TO ROTATE <span>·</span> SCROLL OR PINCH TO ZOOM
      </p>
    </div>
  );
}
