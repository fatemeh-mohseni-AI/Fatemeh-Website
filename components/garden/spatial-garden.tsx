"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import type { RoomId } from "@/lib/garden/content";

export default function SpatialGarden({
  reduced,
  onRoom,
  onSecret,
}: {
  reduced: boolean;
  onRoom: (room: RoomId) => void;
  onSecret: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    pressed = useRef(new Set<string>()),
    callbacks = useRef({ onRoom, onSecret });
  callbacks.current = { onRoom, onSecret };
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0xc8c5b6);
    renderer.shadowMap.enabled = !reduced;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute(
      "aria-label",
      "Walkable Persian courtyard. Use WASD or arrows to move, drag to look, and click labeled doors.",
    );
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc8d4d1);
    scene.fog = new THREE.Fog(0xc8d4d1, 24, 65);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
    camera.position.set(0, 1.7, 8.5);
    camera.rotation.order = "YXZ";
    const hemi = new THREE.HemisphereLight(0xfff1dd, 0x6f6a4c, 2.2);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe0b2, 3.1);
    sun.position.set(-8, 15, 8);
    sun.castShadow = !reduced;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const plaster = new THREE.MeshStandardMaterial({
        color: 0xd4bb8e,
        roughness: 0.98,
      }),
      stone = new THREE.MeshStandardMaterial({
        color: 0xcdbb9e,
        roughness: 0.92,
      }),
      blue = new THREE.MeshStandardMaterial({
        color: 0x287e88,
        roughness: 0.36,
      }),
      wood = new THREE.MeshStandardMaterial({
        color: 0x59452d,
        roughness: 0.8,
      }),
      leaf = new THREE.MeshStandardMaterial({
        color: 0x45603b,
        roughness: 0.96,
      });
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    box(25, 0.2, 26, 0, -0.18, 0, stone);
    // Raised stone paths and a bounded pool keep walking deliberate and predictable.
    for (let x = -10; x <= 10; x += 2)
      for (let z = -10; z <= 10; z += 2) {
        if (Math.abs(x) < 3 && z >= -6 && z <= 2) continue;
        box(1.96, 0.025, 1.96, x, -0.055, z, stone);
      }
    box(5.6, 0.22, 10, 0, -0.04, -1.5, blue);
    box(0.3, 0.3, 10.5, -2.95, 0.06, -1.5, stone);
    box(0.3, 0.3, 10.5, 2.95, 0.06, -1.5, stone);
    box(6.2, 0.3, 0.3, 0, 0.06, -6.65, stone);
    box(6.2, 0.3, 0.3, 0, 0.06, 3.65, stone);
    const waterUniforms = { time: { value: 0 } };
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec2 vUv; uniform float time; void main(){float d=length((vUv-vec2(.5,.5))*vec2(1.,1.8));float wave=sin(d*90.-time*1.8)*.5+.5;float light=pow(max(0.,sin(vUv.x*80.+sin(vUv.y*35.+time)*.3)),20.)*.1;vec3 c=mix(vec3(.08,.30,.31),vec3(.20,.54,.55),vUv.y);gl_FragColor=vec4(c+wave*.027+light,1.);}",
    });
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 9.95),
      waterMaterial,
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.08, -1.5);
    scene.add(water);
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.25, 0.25, 24),
      stone,
    );
    bowl.position.set(0, 0.43, -1.5);
    bowl.userData.secret = true;
    scene.add(bowl);
    box(0.18, 0.7, 0.18, 0, 0.4, -1.5, stone);
    const texture = new THREE.TextureLoader().load("/images/door.webp");
    texture.colorSpace = THREE.SRGBColorSpace;
    const doorMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.72,
    });
    const interactables: THREE.Object3D[] = [bowl];
    const textures: THREE.Texture[] = [texture];
    const labels: THREE.Sprite[] = [];
    function doorway(
      x: number,
      z: number,
      rotation: number,
      id: RoomId,
      label: string,
    ) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotation;
      const shape = new THREE.Shape();
      shape.moveTo(-1.55, 0);
      shape.lineTo(1.55, 0);
      shape.lineTo(1.55, 4.8);
      shape.lineTo(-1.55, 4.8);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(-1.03, 0);
      hole.lineTo(-1.03, 2.6);
      hole.quadraticCurveTo(-1.03, 3.6, 0, 4.1);
      hole.quadraticCurveTo(1.03, 3.6, 1.03, 2.6);
      hole.lineTo(1.03, 0);
      hole.closePath();
      shape.holes.push(hole);
      const facade = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false }),
        plaster,
      );
      facade.castShadow = true;
      facade.receiveShadow = true;
      group.add(facade);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.1), doorMat);
      door.position.set(0, 2.05, 0.02);
      door.userData.room = id;
      group.add(door);
      interactables.push(door);
      const sign = document.createElement("canvas");
      sign.width = 512;
      sign.height = 100;
      const ctx = sign.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(30,44,39,.92)";
        ctx.fillRect(0, 0, 512, 100);
        ctx.strokeStyle = "#d2b681";
        ctx.strokeRect(3, 3, 506, 94);
        ctx.fillStyle = "#f1e5d2";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "32px Georgia";
        ctx.fillText(label, 256, 50);
      }
      const tex = new THREE.CanvasTexture(sign);
      textures.push(tex);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, depthTest: false }),
      );
      sprite.position.set(0, 3.2, 0.6);
      sprite.scale.set(2.5, 0.49, 1);
      sprite.userData.room = id;
      group.add(sprite);
      labels.push(sprite);
      interactables.push(sprite);
      scene.add(group);
    }
    doorway(-6, -10, 0, "library", "The Library");
    doorway(0, -10, 0, "travel", "Travel Observatory");
    doorway(6, -10, 0, "gallery", "The Gallery");
    doorway(-10, -1, Math.PI / 2, "cinema", "Cinema & Culture");
    doorway(10, -1, -Math.PI / 2, "lab", "The Curiosity Lab");
    box(23, 0.3, 0.9, 0, 4.85, -10, plaster);
    box(2.9, 4.8, 0.6, -3, 2.4, -10, plaster);
    box(2.9, 4.8, 0.6, 3, 2.4, -10, plaster);
    box(2.5, 4.8, 0.6, -9, 2.4, -10, plaster);
    box(2.5, 4.8, 0.6, 9, 2.4, -10, plaster);
    for (const side of [-1, 1]) {
      box(0.6, 4.8, 6, side * 10, 2.4, -6, plaster);
      box(0.6, 4.8, 8, side * 10, 2.4, 5.4, plaster);
      box(1, 0.28, 21, side * 10, 4.85, 0, plaster);
      for (const z of [-6, 4]) {
        box(0.3, 1.5, 0.3, side * 6.2, 0.75, z, wood);
        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 12, 10),
          leaf,
        );
        crown.position.set(side * 6.2, 2.3, z);
        crown.castShadow = true;
        scene.add(crown);
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.68, 0.45, 0.65, 16),
          new THREE.MeshStandardMaterial({ color: 0xa16c46, roughness: 1 }),
        );
        pot.position.set(side * 6.2, 0.28, z);
        scene.add(pot);
      }
      for (const z of [-8, 1, 7]) {
        const tree = new THREE.Mesh(
          new THREE.ConeGeometry(0.63, 4.6, 12),
          leaf,
        );
        tree.position.set(side * 8.5, 2.2, z);
        tree.castShadow = true;
        scene.add(tree);
      }
    }
    // Lightweight mesh curtains move only when motion is enabled.
    const curtainGeometry = new THREE.PlaneGeometry(0.45, 3, 8, 14);
    const curtain = new THREE.Mesh(
      curtainGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xf6eedc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        roughness: 1,
      }),
    );
    curtain.position.set(1.3, 1.8, -9.4);
    scene.add(curtain);
    let yaw = 0,
      pitch = 0,
      dragging = false,
      start = { x: 0, y: 0 },
      last = { x: 0, y: 0 },
      raf = 0,
      previous = 0,
      alive = true;
    const keys = pressed.current;
    const valid = (p: THREE.Vector3) =>
      Math.abs(p.x) < 9.25 &&
      p.z > -8.6 &&
      p.z < 9.7 &&
      !(Math.abs(p.x) < 3.25 && p.z > -6.95 && p.z < 3.95);
    const move = (dt: number) => {
      let forward =
          Number(keys.has("w") || keys.has("arrowup")) -
          Number(keys.has("s") || keys.has("arrowdown")),
        strafe =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft"));
      if (!forward && !strafe) return;
      const length = Math.hypot(forward, strafe);
      forward /= length;
      strafe /= length;
      const candidate = camera.position.clone();
      candidate.x +=
        (Math.cos(yaw) * strafe - Math.sin(yaw) * forward) * dt * 2.8;
      candidate.z +=
        (-Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * dt * 2.8;
      if (valid(candidate)) camera.position.copy(candidate);
      else {
        const xOnly = camera.position.clone();
        xOnly.x = candidate.x;
        if (valid(xOnly)) camera.position.copy(xOnly);
        const zOnly = camera.position.clone();
        zOnly.z = candidate.z;
        if (valid(zOnly)) camera.position.copy(zOnly);
      }
    };
    const render = (t: number) => {
      if (!alive) return;
      const dt = previous ? Math.min((t - previous) / 1000, 0.05) : 0;
      previous = t;
      if (!document.hidden) {
        move(dt);
        camera.rotation.set(pitch, yaw, 0);
        if (!reduced) {
          waterUniforms.time.value = t / 1000;
          const p = curtainGeometry.attributes.position;
          for (let i = 0; i < p.count; i++)
            p.setZ(i, Math.sin(p.getY(i) * 3 + t * 0.0008) * 0.06);
          p.needsUpdate = true;
        }
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(render);
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          'button,input,textarea,select,[role="dialog"]',
        )
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        keys.add(key);
      }
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const clear = () => keys.clear();
    const raycaster = new THREE.Raycaster();
    const down = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
      last = start;
      dragging = true;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const pointermove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw -= (e.clientX - last.x) * 0.003;
      pitch = THREE.MathUtils.clamp(
        pitch - (e.clientY - last.y) * 0.002,
        -0.7,
        0.6,
      );
      last = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(interactables)[0];
      if (hit?.object.userData.room)
        callbacks.current.onRoom(hit.object.userData.room);
      else if (hit?.object.userData.secret) callbacks.current.onSecret();
    };
    const cancel = () => {
      dragging = false;
      keys.clear();
    };
    const contextlost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
      cancelAnimationFrame(raf);
    };
    const resize = new ResizeObserver(() => {
      const w = element.clientWidth,
        h = element.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resize.observe(element);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", pointermove);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("webglcontextlost", contextlost);
    raf = requestAnimationFrame(render);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      keys.clear();
      resize.disconnect();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", pointermove);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("webglcontextlost", contextlost);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
        if (o instanceof THREE.Sprite) materials.add(o.material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced]);
  return (
    <div className="spatial-world">
      <div className="spatial-canvas" ref={host} />
      {failed && (
        <div className="webgl-message">
          <h2>The walking view is unavailable.</h2>
          <p>
            Return to Cinematic view to explore the garden and all its rooms.
          </p>
        </div>
      )}
      <div className="spatial-caption">
        <span>THE WALKING GARDEN</span>
        <p>Follow the paths. Open a door.</p>
      </div>
      <div className="touch-pad spatial-pad" aria-label="Walking controls">
        {[
          ["w", "Move forward", ArrowUp],
          ["a", "Move left", ArrowLeft],
          ["s", "Move backward", ArrowDown],
          ["d", "Move right", ArrowRight],
        ].map(([key, label, Icon]) => {
          const Glyph = Icon as typeof ArrowUp;
          return (
            <button
              key={key as string}
              aria-label={label as string}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                pressed.current.add(key as string);
              }}
              onPointerUp={() => pressed.current.delete(key as string)}
              onPointerCancel={() => pressed.current.clear()}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter")
                  pressed.current.add(key as string);
              }}
              onKeyUp={() => pressed.current.delete(key as string)}
              onBlur={() => pressed.current.clear()}
            >
              <Glyph size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
