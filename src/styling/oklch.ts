// OKLab / OKLCH <-> sRGB, hand-rolled from two published sources: Ottosson's
// post (https://bottosson.github.io/posts/oklab/) and the CSS Color 4 sample
// conversions (https://github.com/w3c/csswg-drafts/tree/main/css-color-4).
// The canvas composites on gamma-encoded channels, so every wash decision in
// this folder is reasoned about in OKLCH and delivered as an sRGB string.

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

// sRGB-linear <-> XYZ, D65 (CSS Color 4, exact rationals evaluated).
const XYZ_FROM_SRGB_LINEAR: Mat3 = [
  [0.4123907998, 0.3575843394, 0.1804807884],
  [0.2126390059, 0.7151686788, 0.0721923154],
  [0.0193308187, 0.1191947798, 0.9505321522],
];

// XYZ <-> LMS and LMS-cubed -> OKLab: Ottosson's published matrices.
const LMS_FROM_XYZ: Mat3 = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];

const OKLAB_FROM_LMS: Mat3 = [
  [0.210454268309314, 0.793617774702305, -0.0040720430116193],
  [1.9779985324311684, -2.4285922420485799, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];

const LMS_FROM_OKLAB: Mat3 = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
];

const XYZ_FROM_LMS: Mat3 = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

const SRGB_LINEAR_FROM_XYZ: Mat3 = [
  [3.2409699419, -1.5373831776, -0.4986107603],
  [-0.9692436363, 1.8759675015, 0.0415550574],
  [0.0556300797, -0.203976959, 1.0569715142],
];

const mul = (m: Mat3, v: Vec3): Vec3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

// Reads a CSS colour into its encoded channels — the theme tokens arrive as
// `rgb(229 222 214)`, the research anchors as hex. Anything else throws — a
// misread colour must crash here, not surface as NaN three conversions
// downstream.
function parseChannels(css: string): Vec3 {
  const hex = /^#[0-9a-f]{6}$/i.exec(css);
  const rgb = /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\)$/.exec(css);
  if (hex) {
    const h = hex[0].slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  throw new Error(`unreadable colour: ${css}`);
}

export function cssToOklch(css: string): Oklch {
  return oklchFromSrgb(parseChannels(css));
}

function oklchFromSrgb(channels: Vec3): Oklch {
  const linear: Vec3 = [srgbToLinear(channels[0] / 255), srgbToLinear(channels[1] / 255), srgbToLinear(channels[2] / 255)];
  const lms = mul(LMS_FROM_XYZ, mul(XYZ_FROM_SRGB_LINEAR, linear));
  const lab = mul(OKLAB_FROM_LMS, [Math.cbrt(lms[0]), Math.cbrt(lms[1]), Math.cbrt(lms[2])]);
  const c = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
  let h = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab[0], c, h };
}

// A mix of two CSS colours, in the encoded channel space the canvas actually
// composites in: t is the weight of b. This is what the night mix uses —
// most of the way to the theme paper, a sliver of the day colour.
export function mixCss(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseChannels(a);
  const [br, bg, bb] = parseChannels(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${mix(ar, br)} ${mix(ag, bg)} ${mix(ab, bb)})`;
}

// Out-of-gamut rows resolve by reducing chroma — a binary search for the
// largest chroma that still converts inside the sRGB cube — so a clamped row
// keeps its lightness and hue and loses only the intensity the gamut refuses.
// The EPS slack absorbs the encoded rounding at 8 bits.
export function oklchToCss(o: Oklch): string {
  const toLinear = (c: number): [number, number, number] => {
    const a = c * Math.cos((o.h * Math.PI) / 180);
    const b = c * Math.sin((o.h * Math.PI) / 180);
    const lms = mul(LMS_FROM_OKLAB, [o.l, a, b]);
    return mul(SRGB_LINEAR_FROM_XYZ, mul(XYZ_FROM_LMS, [lms[0] ** 3, lms[1] ** 3, lms[2] ** 3]));
  };
  const EPS = 1e-4;
  const inGamut = (lin: [number, number, number]) => lin.every((v) => v >= -EPS && v <= 1 + EPS);
  let c = o.c;
  if (!inGamut(toLinear(c))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(toLinear(mid))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(linearToSrgb(v) * 255)));
  const [r, g, b] = toLinear(c);
  return `rgb(${clamp(r)} ${clamp(g)} ${clamp(b)})`;
}
