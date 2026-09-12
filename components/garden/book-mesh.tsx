"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { books, type Book } from "@/lib/garden/books";
import { restingPageHeight, turningPagePoint } from "@/lib/garden/book-geometry";

export type MeshState = { index: number; direction: -1 | 1; progress: number; turning: boolean; opening: number };
const W = 3.2, H = 4.6;

/** Fine deterministic paper grain; shared by the printed page and its bump map. */
function paperSurface() {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 1104;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  let seed = 73;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const grain = ((seed >>> 24) / 255 - .5) * 10;
    pixels.data[i] = 229 + grain;
    pixels.data[i + 1] = 210 + grain;
    pixels.data[i + 2] = 180 + grain;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function pageTexture(book: Book, visual: boolean, paper: HTMLCanvasElement, ready: () => void) {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 1104;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let alive = true;
  const background = () => {
    ctx.drawImage(paper, 0, 0);
    // Gutter occlusion complements the actual curved geometry and direct light.
    const gutter = ctx.createLinearGradient(visual ? 0 : 768, 0, visual ? 110 : 658, 0);
    gutter.addColorStop(0, "#42291766"); gutter.addColorStop(.35, "#65472b20"); gutter.addColorStop(1, "#65472b00");
    ctx.fillStyle = gutter; ctx.fillRect(0, 0, 768, 1104);
    const patina = ctx.createRadialGradient(384, 500, 220, 384, 500, 690);
    patina.addColorStop(0, "#99713e00"); patina.addColorStop(1, "#805c2938");
    ctx.fillStyle = patina; ctx.fillRect(0, 0, 768, 1104);
  };
  background();
  let y = 88;
  const lines = (text: string, size: number, color: string, italic = false) => {
    ctx.fillStyle = color;
    ctx.font = `${italic ? "italic " : ""}${size}px Georgia, "Times New Roman", serif`;
    let line = "";
    for (const word of text.split(/\s+/)) {
      if (ctx.measureText(line + word).width > 605 && line) {
        ctx.fillText(line.trim(), 64, y); y += size * 1.4; line = "";
      }
      line += word + " ";
    }
    if (line) { ctx.fillText(line.trim(), 64, y); y += size * 1.4; }
  };
  lines(`${String(books.indexOf(book) + 1).padStart(2, "0")}  /  ${books.length}`, 26, "#705a3c"); y += 35;
  lines(book.title, 54, "#292719"); y += 14;
  lines(book.author, 29, "#5e4933", true); y += 24;
  ctx.fillStyle = "#8c73515c"; ctx.fillRect(64, y, 145, 1.5); y += 42;
  if (!visual) {
    for (const quote of book.quotes) { lines(`“${quote}”`, 30, "#715336", true); y += 24; }
    lines(book.description, 29, "#3f3528"); y += 24;
    if (book.personalNote) {
      lines("READING NOTE · DRAFT", 20, "#796747"); y += 8;
      lines(book.personalNote, 25, "#574935");
    }
  }
  const image = new Image();
  if (visual) {
    // Remote sources must allow CORS to become WebGL textures. The accessible
    // HTML cover remains available even if that source cannot be used in canvas.
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!alive) return;
      background();
      const ratio = Math.min(535 / image.naturalWidth, 790 / image.naturalHeight);
      const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
      ctx.save(); ctx.translate(400, 550); ctx.rotate(-.085);
      ctx.shadowColor = "#291a10a0"; ctx.shadowBlur = 30; ctx.shadowOffsetX = 7; ctx.shadowOffsetY = 20;
      ctx.fillStyle = "#4b3321"; ctx.fillRect(-w/2-5, -h/2+6, w+10, h+12);
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#c3ad87"; ctx.fillRect(-w/2+4, -h/2+5, w, h+5);
      ctx.drawImage(image, -w/2, -h/2, w, h);
      const binding = ctx.createLinearGradient(-w/2, 0, -w/2+25, 0);
      binding.addColorStop(0, "#1c140e77"); binding.addColorStop(.5, "#efdec337"); binding.addColorStop(1, "transparent");
      ctx.fillStyle = binding; ctx.fillRect(-w/2, -h/2, 25, h); ctx.restore();
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const model = new THREE.Group(); model.rotation.z = -.018; scene.add(model);
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    camera.position.set(0, -3, 13); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xfff2dc, 0x302319, 1.1));
    const light = new THREE.DirectionalLight(0xffebce, 2.4);
    light.position.set(-3, 5, 6); light.castShadow = true;
    light.shadow.mapSize.set(1024,1024);
    light.shadow.camera.left=-8; light.shadow.camera.right=8;
    light.shadow.camera.top=8; light.shadow.camera.bottom=-8;
    light.shadow.bias=-.001;
    light.shadow.normalBias=.025;
    scene.add(light);
    const objects: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const leftGroup = new THREE.Group(); model.add(leftGroup);
    let alive = true;
    let current = initial.current;
    const paper = paperSurface();
    const paperBump = new THREE.CanvasTexture(paper);
    const leather = new THREE.TextureLoader().load('/images/library/walnut-leather.webp', () => { if (alive) render(current); });
    leather.colorSpace = THREE.SRGBColorSpace;
    const box = (width: number, height: number, depth: number, color: string, x: number, z: number, group: THREE.Object3D) => {
      const geometry = new THREE.BoxGeometry(width,height,depth);
      const material = new THREE.MeshStandardMaterial({color,roughness:.87,map:leather,bumpMap:leather,bumpScale:.015});
      const mesh = new THREE.Mesh(geometry,material); mesh.position.set(x,0,z);
      mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh);
      objects.push(geometry); materials.push(material);
    };
    for (const side of [-1,1]) {
      const group = side < 0 ? leftGroup : model;
      box(W+.2,H+.24,.12,"#bf9b72",side*(W/2+.02),-.4,group);
      // A solid, curved page block makes the head, fore-edge and tail visible.
      const section = new THREE.Shape(); section.moveTo(0,-.34); section.lineTo(W+.055,-.34);
      for(let j=32;j>=0;j--) { const u=j/32; section.lineTo(u*(W+.055),restingPageHeight(u,0)-.04); }
      section.closePath();
      const blockGeometry = new THREE.ExtrudeGeometry(section,{depth:H+.06,bevelEnabled:false,steps:1});
      blockGeometry.rotateX(Math.PI/2); blockGeometry.translate(0,(H+.06)/2,0);
      const blockMaterial = new THREE.MeshStandardMaterial({color:'#aa916b',roughness:1});
      const block = new THREE.Mesh(blockGeometry,blockMaterial); block.scale.x=side;
      block.castShadow=true; block.receiveShadow=true; group.add(block);
      objects.push(blockGeometry); materials.push(blockMaterial);
      for(let layer=1;layer<=18;layer++) {
        const geometry = new THREE.PlaneGeometry(W+layer*.003,H+layer*.003,48,2);
        const pos=geometry.attributes.position;
        for(let i=0;i<pos.count;i++) {
          const u=(i%49)/48, v=Math.floor(i/49)/2;
          pos.setX(i,side*u*(W+layer*.003));
          pos.setZ(i,restingPageHeight(u,v)-layer*.018);
        }
        if(side<0) { const uv=geometry.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,1-uv.getX(i)); }
        geometry.computeVertexNormals();
        const material=new THREE.MeshStandardMaterial({color:layer%3?'#cfba94':'#b9a17b',roughness:1,side:THREE.DoubleSide});
        const leaf=new THREE.Mesh(geometry,material); leaf.receiveShadow=true; group.add(leaf);
        objects.push(geometry); materials.push(material);
      }
    }
    box(.18,H+.18,.4,"#755235",0,-.25,model);
    const textures = new Map<string, ReturnType<typeof pageTexture>>();
    const getTexture = (index: number, visual: boolean) => {
      const key = `${index}-${visual}`;
      if (!textures.has(key)) textures.set(key,pageTexture(books[index],visual,paper,()=>{if(alive)render(current);}));
      return textures.get(key)!.texture;
    };
    const makePage = (side: number, group: THREE.Object3D) => {
      const geometry = new THREE.PlaneGeometry(W,H,48,12);
      const pos=geometry.attributes.position;
      for(let i=0;i<pos.count;i++) {
        const u=(i%49)/48, v=Math.floor(i/49)/12;
        pos.setX(i,side===1?u*W:(u-1)*W);
        pos.setZ(i,restingPageHeight(side===1?u:1-u,v));
      }
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({roughness:.98,bumpMap:paperBump,bumpScale:.009});
      const mesh = new THREE.Mesh(geometry,material);
      mesh.receiveShadow=true; group.add(mesh); objects.push(geometry); materials.push(material);
      return material;
    };
    const leftMaterial = makePage(-1,leftGroup);
    const rightMaterial = makePage(1,model);
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
    model.add(frontMesh,backMesh);
    objects.push(geometry,backGeometry); materials.push(front,back);
    function render(next: MeshState) {
      current=next;
      const target = Math.max(0,Math.min(books.length-1,next.index+next.direction));
      leftMaterial.map = getTexture(next.turning && next.direction===-1 ? target : next.index,false);
      rightMaterial.map = getTexture(next.turning && next.direction===1 ? target : next.index,true);
      if (!leftMaterial.version) leftMaterial.needsUpdate=true;
      if (!rightMaterial.version) rightMaterial.needsUpdate=true;
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
            const point=turningPagePoint(u,Math.floor(i/49)/12,progress,W);
            pos.setX(i,point.x); pos.setZ(i,point.z+.012);
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
      const distance=Math.max((H/2+.25)/Math.tan(halfFov),(W+.35)/(Math.tan(halfFov)*camera.aspect));
      camera.position.set(0,-distance*.32,distance);
      camera.lookAt(0,0,0);
      camera.updateProjectionMatrix(); renderer.setSize(width,height); render(current);
    };
    const observer=new ResizeObserver(resize); observer.observe(element);
    const contextLost=(event: Event)=>{event.preventDefault();setLost(true);failure.current();};
    renderer.domElement.addEventListener("webglcontextlost",contextLost);
    draw.current=render; resize(); ready.current();
    return ()=>{
      alive=false;
      draw.current=null; observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost",contextLost);
      textures.forEach(item=>item.dispose()); objects.forEach(item=>item.dispose()); materials.forEach(item=>item.dispose());
      paperBump.dispose(); leather.dispose();
      renderer.dispose(); renderer.domElement.remove();
    };
  },[]);
  useEffect(()=>{draw.current?.(state);},[state]);
  return <div ref={host} className="book-webgl" aria-hidden="true" hidden={lost}/>;
}
