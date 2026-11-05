// ============================================================
// Tiny QR code encoder (byte mode, error correction level M, versions 1-10).
// Runs at render time so published sites carry an inline SVG and need no
// script or third-party service. Capacity is ~213 bytes, plenty for a URL.
// ============================================================

// [ecCodewordsPerBlock, [blockCount, dataCodewordsPerBlock][]] for level M.
const VERSIONS: [number, [number, number][]][] = [
  [10, [[1, 16]]],
  [16, [[1, 28]]],
  [26, [[1, 44]]],
  [18, [[2, 32]]],
  [24, [[2, 43]]],
  [16, [[4, 27]]],
  [18, [[4, 31]]],
  [22, [[2, 38], [2, 39]]],
  [22, [[3, 36], [2, 37]]],
  [26, [[4, 43], [1, 44]]],
];
const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

export const QR_MAX_BYTES = 213;

// --- GF(256) arithmetic for Reed-Solomon ---
const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsRemainder(data: number[], ecLen: number): number[] {
  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array<number>(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= mul(gen[j], EXP[i]);
    }
    gen = next;
  }
  const rem = new Array<number>(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < ecLen; i++) rem[i] ^= mul(gen[i + 1], factor);
  }
  return rem;
}

function bch(value: number, poly: number, polyBits: number): number {
  let v = value << (polyBits - 1);
  for (let i = 31; i >= polyBits - 1; i--) if ((v >> i) & 1) v ^= poly << (i - (polyBits - 1));
  return v;
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function penalty(m: boolean[][]): number {
  const n = m.length;
  let p = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      let run = 1;
      for (let j = 1; j < n; j++) {
        const a = pass ? m[j][i] : m[i][j];
        const b = pass ? m[j - 1][i] : m[i][j - 1];
        if (a === b) run++;
        else {
          if (run >= 5) p += run - 2;
          run = 1;
        }
      }
      if (run >= 5) p += run - 2;
    }
  }
  for (let r = 0; r < n - 1; r++)
    for (let c = 0; c < n - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
    }
  const pat = [true, false, true, true, true, false, true, false, false, false, false];
  const rev = [...pat].reverse();
  const hit = (get: (k: number) => boolean, p2: boolean[]) => p2.every((v, k) => get(k) === v);
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= n - 11; j++)
      for (const q of [pat, rev]) {
        if (hit((k) => m[i][j + k], q)) p += 40;
        if (hit((k) => m[j + k][i], q)) p += 40;
      }
  let dark = 0;
  for (const row of m) for (const v of row) if (v) dark++;
  p += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return p;
}

/** Encode text (UTF-8) as a QR matrix, or null when it does not fit. true = dark module. */
export function qrMatrix(text: string): boolean[][] | null {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 0;
  for (let v = 0; v < VERSIONS.length; v++) {
    const dataCw = VERSIONS[v][1].reduce((s, [n, d]) => s + n * d, 0);
    const lenBits = v < 9 ? 8 : 16;
    if (4 + lenBits + bytes.length * 8 <= dataCw * 8) {
      version = v + 1;
      break;
    }
  }
  if (!version || bytes.length === 0) return null;
  const [ecLen, groups] = VERSIONS[version - 1];
  const dataCw = groups.reduce((s, [n, d]) => s + n * d, 0);

  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, dataCw * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0xec; data.length < dataCw; pad ^= 0xec ^ 0x11) data.push(pad);

  const blocks: number[][] = [];
  let at = 0;
  for (const [n, d] of groups)
    for (let i = 0; i < n; i++) {
      blocks.push(data.slice(at, at + d));
      at += d;
    }
  const ecs = blocks.map((b) => rsRemainder(b, ecLen));
  const out: number[] = [];
  const maxD = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecLen; i++) for (const e of ecs) out.push(e[i]);
  const stream: number[] = [];
  for (const cw of out) push2(stream, cw);
  function push2(arr: number[], cw: number) {
    for (let i = 7; i >= 0; i--) arr.push((cw >> i) & 1);
  }

  const n = 17 + 4 * version;
  const mod: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const fn: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  const set = (r: number, c: number, v: boolean) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return;
    mod[r][c] = v;
    fn[r][c] = true;
  };
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const dark = inside && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        set(r0 + r, c0 + c, dark);
      }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  for (let i = 8; i < n - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  const al = ALIGN[version - 1];
  for (const r of al)
    for (const c of al) {
      const last = al[al.length - 1];
      if ((r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  // reserve format + version areas
  for (let i = 0; i < 9; i++) {
    if (i === 6) continue; // timing pattern
    set(8, i, false);
    set(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    set(8, n - 1 - i, false);
    set(n - 1 - i, 8, false);
  }
  set(n - 8, 8, true); // dark module
  if (version >= 7) {
    const info = (version << 12) | bch(version, 0x1f25, 13);
    for (let i = 0; i < 18; i++) {
      const bit = ((info >> i) & 1) === 1;
      set(Math.floor(i / 3), n - 11 + (i % 3), bit);
      set(n - 11 + (i % 3), Math.floor(i / 3), bit);
    }
  }

  // place data bits in the zig-zag order
  const cells: [number, number][] = [];
  for (let right = n - 1, up = true; right >= 1; right -= 2, up = !up) {
    if (right === 6) right = 5;
    for (let k = 0; k < n; k++) {
      const r = up ? n - 1 - k : k;
      for (const c of [right, right - 1]) if (!fn[r][c]) cells.push([r, c]);
    }
  }
  cells.forEach(([r, c], i) => {
    mod[r][c] = (stream[i] ?? 0) === 1;
  });

  const withMask = (mask: number) => {
    const m = mod.map((row) => [...row]);
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (!fn[r][c] && MASKS[mask](r, c)) m[r][c] = !m[r][c];
    const fmt = (((0b00 << 3) | mask) << 10) | bch((0b00 << 3) | mask, 0x537, 11);
    const f = (fmt ^ 0x5412) & 0x7fff;
    const bit = (i: number) => ((f >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
    m[7][8] = bit(6);
    m[8][8] = bit(7);
    m[8][7] = bit(8);
    for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) m[8][n - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) m[n - 15 + i][8] = bit(i);
    m[n - 8][8] = true;
    return m;
  };
  let best = withMask(0);
  let bestP = penalty(best);
  for (let k = 1; k < 8; k++) {
    const m = withMask(k);
    const p = penalty(m);
    if (p < bestP) {
      best = m;
      bestP = p;
    }
  }
  return best;
}

/** SVG path data (one rect per dark module) for a matrix, with a 4-module quiet zone handled by the viewBox. */
export function qrSvg(text: string): { path: string; size: number } | null {
  const m = qrMatrix(text);
  if (!m) return null;
  let path = "";
  m.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    }),
  );
  return { path, size: m.length + 8 };
}
