// One static window scene in unit measure (window box 1.6 × 2.0). Every trace
// name embeds the window address so the warp is stable per window.
// Ahead of its ticket: this shell exists only to give the pen demo something
// to draw. The window-shell archetypes (wayfinder: "Window shell archetypes —
// frame variants") have not been worked yet; expect this scene to be redrawn
// once they are.
import type { Pen, Pt } from '../pen/pen';
import { Rng } from '../randomness/rng';

type CurtainStyle = 'panels' | 'cafe' | 'full';

const ADDR = '0,0';
const name = (trace: string) => `w${ADDR}:${trace}`;

function line(x0: number, y0: number, x1: number, y1: number): Pt[] {
  return [
    { x: x0, y: y0 },
    { x: x1, y: y1 },
  ];
}

// Four separate strokes running past the sharp corners, like the reference's
// sheet edges — a rectangle that closes exactly reads as drawn by a program.
function rectStrokes(
  pen: Pen,
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  trace: string,
  width: number,
): void {
  const runPast = 0.035 * Math.min(x1 - x0, y1 - y0);
  const edges: [Pt[], string][] = [
    [line(x0 - runPast, y0, x1 + runPast, y0), `${trace}-top`],
    [line(x1, y0 - runPast, x1, y1 + runPast), `${trace}-right`],
    [line(x1 + runPast, y1, x0 - runPast, y1), `${trace}-bottom`],
    [line(x0, y1 + runPast, x0, y0 - runPast), `${trace}-left`],
  ];
  for (const [pts, suffix] of edges) {
    pen.stroke(ctx, pts, { name: name(suffix), width });
  }
}

function foldLine(rng: Rng, x: number, yTop: number, yBottom: number): Pt[] {
  const pts: Pt[] = [];
  for (let y = yTop; y <= yBottom; y += 0.18) {
    pts.push({ x: x + rng.float(-0.035, 0.035), y });
  }
  pts.push({ x: x + rng.float(-0.035, 0.035), y: yBottom });
  return pts;
}

function scallopHem(rng: Rng, x0: number, x1: number, y: number, lobes: number): Pt[] {
  const pts: Pt[] = [];
  const step = (x1 - x0) / lobes;
  for (let i = 0; i <= lobes * 4; i++) {
    const x = x0 + (i / (lobes * 4)) * (x1 - x0);
    const phase = (i % 4) / 4;
    const dip = Math.sin(phase * Math.PI) * step * 0.45;
    pts.push({ x: x + rng.float(-0.008, 0.008), y: y + dip });
  }
  return pts;
}

function drawCurtain(pen: Pen, ctx: CanvasRenderingContext2D, rng: Rng, style: CurtainStyle): void {
  const w = 0.022;
  if (style === 'panels') {
    const rodY = -0.84;
    const hemY = 0.88;
    pen.stroke(ctx, line(-0.76, rodY, 0.76, rodY), { name: name('curtain-rod'), width: w });
    const panelW = rng.float(0.16, 0.24);
    for (const side of [-1, 1]) {
      const inner = side * (0.76 - panelW);
      for (let f = 0; f < 3; f++) {
        const x = side * (0.76 - (f / 3) * panelW);
        pen.stroke(ctx, foldLine(rng, x, rodY + 0.04, hemY), {
          name: name(`curtain-${side < 0 ? 'l' : 'r'}-fold-${f}`),
          width: w,
        });
      }
      pen.stroke(ctx, scallopHem(rng, Math.min(inner, side * 0.76), Math.max(inner, side * 0.76), hemY, 2), {
        name: name(`curtain-${side < 0 ? 'l' : 'r'}-hem`),
        width: w * 0.9,
      });
    }
  } else if (style === 'full') {
    const rodY = -0.84;
    const hemY = 0.88;
    pen.stroke(ctx, line(-0.76, rodY, 0.76, rodY), { name: name('curtain-rod'), width: w });
    for (let f = 0; f < 9; f++) {
      const x = -0.72 + (f / 8) * 1.44;
      pen.stroke(ctx, foldLine(rng, x, rodY + 0.04, hemY), {
        name: name(`curtain-fold-${f}`),
        width: w,
      });
    }
    pen.stroke(ctx, scallopHem(rng, -0.76, 0.76, hemY, 7), { name: name('curtain-hem'), width: w * 0.9 });
  } else {
    const rodY = -0.12;
    const hemY = 0.78;
    pen.stroke(ctx, line(-0.76, rodY, 0.76, rodY), { name: name('curtain-rod'), width: w });
    for (let f = 0; f < 7; f++) {
      const x = -0.7 + (f / 6) * 1.4;
      pen.stroke(ctx, foldLine(rng, x, rodY + 0.04, hemY - 0.1), {
        name: name(`cafe-fold-${f}`),
        width: w,
      });
    }
    pen.stroke(ctx, scallopHem(rng, -0.74, 0.74, hemY, 6), { name: name('cafe-hem'), width: w * 0.9 });
  }
}

export function drawWindow(ctx: CanvasRenderingContext2D, pen: Pen, seed: number): void {
  const rng = new Rng(seed);

  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = pen.ink;
  ctx.fillRect(-0.72, -0.92, 1.44, 1.84);
  ctx.restore();

  const style = rng.weighted<CurtainStyle>([
    { value: 'panels', weight: 5 },
    { value: 'cafe', weight: 2 },
    { value: 'full', weight: 2 },
  ]);
  drawCurtain(pen, ctx, rng, style);

  const fw = 0.032;
  rectStrokes(pen, ctx, -0.8, -1.0, 0.8, 1.0, 'frame-outer', fw);
  rectStrokes(pen, ctx, -0.72, -0.92, 0.72, 0.92, 'frame-inner', fw * 0.85);
  pen.stroke(ctx, line(-0.72, 0.05, 0.72, 0.05), { name: name('frame-rail'), width: fw * 0.85 });
  if (rng.chance(0.5)) {
    pen.stroke(ctx, line(0, 0.05, 0, 0.92), { name: name('frame-mullion'), width: fw * 0.7 });
  }

  pen.stroke(ctx, line(-0.98, 1.0, 0.98, 1.0), { name: name('sill-top'), width: 0.036 });
  pen.stroke(ctx, line(-0.9, 1.12, 0.9, 1.12), { name: name('sill-front'), width: 0.03 });
  pen.stroke(ctx, line(-0.98, 1.0, -0.9, 1.12), { name: name('sill-left'), width: 0.026 });
  pen.stroke(ctx, line(0.98, 1.0, 0.9, 1.12), { name: name('sill-right'), width: 0.026 });
  pen.dot(ctx, -0.8, 1.2, 0.028, name('sill-dot-l'));
  pen.dot(ctx, 0.8, 1.2, 0.028, name('sill-dot-r'));
}
