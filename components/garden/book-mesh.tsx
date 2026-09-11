"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { books, type Book } from "@/lib/garden/books";
import { sheetPoint } from "@/lib/garden/book-geometry";

export type MeshState = { index: number; direction: -1 | 1; progress: number; turning: boolean; opening: number };
const W = 3.2, H = 4.6;

function pageTexture(book: Book, visual: boolean, ready: () => void) {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 1104;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let alive = true;
  ctx.fillStyle = "#f0e5ce"; ctx.fillRect(0, 0, 768, 1104);
  let y = 92;
  const lines = (text: string, size: number, color: string, italic = false) => {
    ctx.fillStyle = color;
    ctx.font = `${italic ? "italic " : ""}${size}px Georgia`;
    let line = "";
    for (const word of text.split(/\s+/)) {
      if (ctx.measureText(line + word).width > 630 && line) {
        ctx.fillText(line.trim(), 64, y); y += size * 1.4; line = "";
      }
      line += word + " ";
    }
    if (line) { ctx.fillText(line.trim(), 64, y); y += size * 1.4; }
  };
  lines(book.category ?? "FROM THE SHELF", 22, "#766446"); y += 30;
  lines(book.title, 52, "#24392f"); y += 14;
  lines(book.author, 27, "#6a5c46", true); y += 36;
  if (!visual) {
    lines(book.description, 30, "#39483f"); y += 28;
    for (const quote of book.quotes) { lines(`“${quote}”`, 28, "#6c5836", true); y += 16; }
    if (book.personalNote) {
      y += 14; lines("READING NOTE · DRAFT", 21, "#796747"); y += 10;
      lines(book.personalNote, 27, "#465248");
    }
  }
  const image = new Image();
  if (visual) {
    // Remote sources must allow CORS to become WebGL textures. The accessible
    // HTML cover remains available even if that source cannot be used in canvas.
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!alive) return;
      ctx.fillStyle = "#e9ddc3"; ctx.fillRect(0, 0, 768, 1104);
      const ratio = Math.min(620 / image.naturalWidth, 920 / image.naturalHeight);
      const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
      ctx.save(); ctx.shadowColor = "#35281980"; ctx.shadowBlur = 25; ctx.shadowOffsetY = 14;
      ctx.drawImage(image, (768-w)/2, (1104-h)/2, w, h); ctx.restore();
      texture.needsUpdate = true; ready();
    };
    image.src = book.coverImage;
  }
  return { texture, dispose: () => { alive = false; image.onload = null; image.src = ""; texture.dispose(); } };
}

/** A persistent, on-demand WebGL scene. Vertices bend; no CSS page rotation. */
export default function BookMesh({ state, onReady, onUnavailable }: { state: MeshState; onReady:()=>void; onUnavailable: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const draw = useRef<((next: MeshState) => void) | null>(null);
  const initial = useRef(state);
  const failure = useRef(onUnavailable);
  const ready = useRef(onReady);
  const [lost, setLost] = useState(false);
  useEffect(() => { failure.current = onUnavailable; }, [onUnavailable]);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { failure.current(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    camera.position.set(0, -1.2, 13); camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const light = new THREE.DirectionalLight(0xffe9c5, 2.3);
    light.position.set(-3, 5, 9); light.castShadow = true;
    light.shadow.mapSize.set(1024,1024);
    light.shadow.camera.left=-8; light.shadow.camera.right=8;
    light.shadow.camera.top=8; light.shadow.camera.bottom=-8;
    light.shadow.bias=-.001;
    scene.add(light);
    const objects: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const leftGroup = new THREE.Group(); scene.add(leftGroup);
    const box = (width: number, height: number, depth: number, color: string, x: number, z: number, group: THREE.Object3D) => {
      const geometry = new THREE.BoxGeometry(width,height,depth);
      const material = new THREE.MeshStandardMaterial({color,roughness:.88});
      const mesh = new THREE.Mesh(geometry,material); mesh.position.set(x,0,z);
      mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh);
      objects.push(geometry); materials.push(material);
    };
    for (const side of [-1,1]) {
      const group = side < 0 ? leftGroup : scene;
      box(W+.1,H+.15,.09,"#264238",side*W/2,-.2,group);
      box(W-.03,H-.035,.17,"#cdbf9d",side*W/2,-.065,group);
      for(let i=0;i<6;i++) box(W-.03,H-.035,.008,i%2?"#f3e8cc":"#b7a88b",side*W/2,-.12+i*.024,group);
    }
    box(.13,H+.12,.2,"#243b30",0,-.13,scene);
    let current = initial.current;
    const textures = new Map<string, ReturnType<typeof pageTexture>>();
    const getTexture = (index: number, visual: boolean) => {
      const key = `${index}-${visual}`;
      if (!textures.has(key)) textures.set(key,pageTexture(books[index],visual,()=>render(current)));
      return textures.get(key)!.texture;
    };
    const makePage = (x: number, group: THREE.Object3D) => {
      const geometry = new THREE.PlaneGeometry(W,H);
      const material = new THREE.MeshStandardMaterial({roughness:.96});
      const mesh = new THREE.Mesh(geometry,material); mesh.position.set(x,0,.034);
      mesh.receiveShadow=true; group.add(mesh); objects.push(geometry); materials.push(material);
      return material;
    };
    const leftMaterial = makePage(-W/2,leftGroup);
    const rightMaterial = makePage(W/2,scene);
    const geometry = new THREE.PlaneGeometry(W,H,48,12);
    geometry.translate(W/2,0,0);
    const front = new THREE.MeshStandardMaterial({roughness:.92,side:THREE.FrontSide});
    const back = new THREE.MeshStandardMaterial({roughness:.92,side:THREE.BackSide});
    // Back UVs are mirrored so the reverse side reads normally after turning.
    const backGeometry = geometry.clone();
    const uv = backGeometry.attributes.uv;
    for(let i=0;i<uv.count;i++) uv.setX(i,1-uv.getX(i));
    const frontMesh = new THREE.Mesh(geometry,front), backMesh = new THREE.Mesh(backGeometry,back);
    frontMesh.castShadow=true; backMesh.castShadow=true;
    scene.add(frontMesh,backMesh);
    objects.push(geometry,backGeometry); materials.push(front,back);
    function render(next: MeshState) {
      current=next;
      const target = Math.max(0,Math.min(books.length-1,next.index+next.direction));
      leftMaterial.map = getTexture(next.turning && next.direction===-1 ? target : next.index,false);
      rightMaterial.map = getTexture(next.turning && next.direction===1 ? target : next.index,true);
      leftMaterial.needsUpdate=true; rightMaterial.needsUpdate=true;
      leftGroup.rotation.y = -Math.PI*(1-next.opening);
      frontMesh.visible=backMesh.visible=next.turning;
      if(next.turning) {
        front.map=getTexture(next.direction===1?next.index:target,true);
        back.map=getTexture(next.direction===1?target:next.index,false);
        front.needsUpdate=true; back.needsUpdate=true;
        const progress=next.direction===1?next.progress:1-next.progress;
        for(const geom of [geometry,backGeometry]) {
          const pos=geom.attributes.position;
          for(let i=0;i<pos.count;i++) {
            const u=(i%49)/48;
            const point=sheetPoint(u,progress,W);
            pos.setX(i,point.x); pos.setZ(i,point.z+.055);
          }
          pos.needsUpdate=true; geom.computeVertexNormals(); geom.computeBoundingSphere();
        }
      }
      renderer.render(scene,camera);
    }
    const resize = () => {
      const {width,height}=element.getBoundingClientRect();
      if(!width||!height) return;
      camera.aspect=width/height;
      const halfFov=THREE.MathUtils.degToRad(18);
      camera.position.z=Math.max((H/2+.25)/Math.tan(halfFov),(W+.25)/(Math.tan(halfFov)*camera.aspect));
      camera.lookAt(0,0,0);
      camera.updateProjectionMatrix(); renderer.setSize(width,height); render(current);
    };
    const observer=new ResizeObserver(resize); observer.observe(element);
    const contextLost=(event: Event)=>{event.preventDefault();setLost(true);failure.current();};
    renderer.domElement.addEventListener("webglcontextlost",contextLost);
    draw.current=render; resize(); ready.current();
    return ()=>{
      draw.current=null; observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost",contextLost);
      textures.forEach(item=>item.dispose()); objects.forEach(item=>item.dispose()); materials.forEach(item=>item.dispose());
      renderer.dispose(); renderer.domElement.remove();
    };
  },[]);
  useEffect(()=>{draw.current?.(state);},[state]);
  return <div ref={host} className="book-webgl" aria-hidden="true" hidden={lost}/>;
}
