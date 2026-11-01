// A calm, deterministic cover for each site card: same slug, same artwork.

const PALETTES: [string, string, string][] = [
  ["#b5482a", "#2e7d87", "#e8772e"],
  ["#f2603f", "#ffb25e", "#e8772e"],
  ["#1f8f63", "#6fb7ae", "#2e7d87"],
  ["#1c7ed6", "#4cd4e8", "#b5482a"],
  ["#e0378a", "#ff9ec7", "#f2a65a"],
  ["#14122b", "#b5482a", "#2e7d87"],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function coverFor(seed: string): { background: string; angle: number } {
  const h = hash(seed);
  const [a, b, c] = PALETTES[h % PALETTES.length];
  const angle = 100 + (h % 80);
  return {
    angle,
    background: [
      `radial-gradient(circle at ${20 + (h % 40)}% 15%, ${c}aa, transparent 55%)`,
      `radial-gradient(circle at 85% ${60 + (h % 30)}%, ${b}cc, transparent 60%)`,
      `linear-gradient(${angle}deg, ${a}, ${b})`,
    ].join(", "),
  };
}
