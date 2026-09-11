/** Integrate the sheet tangent: fixed spine, curved free edge, flat endpoints. */
export function sheetPoint(u: number, progress: number, width = 3.2) {
  const p = Math.max(0, Math.min(1, progress));
  const steps = 32;
  const ds = u * width / steps;
  let x = 0, z = 0;
  for (let i = 0; i < steps; i++) {
    const t = u * (i + .5) / steps;
    const angle = Math.PI * p + Math.sin(Math.PI * p) * .62 * Math.sin(Math.PI * t);
    x += Math.cos(angle) * ds;
    z += Math.sin(angle) * ds;
  }
  return { x, z };
}

/** Map a point in the 1672×941 room photo through object-fit: cover. */
export function tableAnchor(width: number, height: number, positionX = .75) {
  const scale = Math.max(width / 1672, height / 941);
  const imageWidth = 1672 * scale, imageHeight = 941 * scale;
  return {
    x: (width - imageWidth) * positionX + imageWidth * .515,
    y: (height - imageHeight) * .5 + imageHeight * .584,
    scale: Math.max(.5, Math.min(1.15, scale)),
  };
}
