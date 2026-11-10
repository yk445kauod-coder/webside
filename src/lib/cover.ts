// A calm, deterministic cover for each site card: same slug, same artwork.

const PALETTES: [string, string, string][] = [
  ["#E4502D", "#2F5D8C", "#FD6B47"],
  ["#f2603f", "#ffb25e", "#FD6B47"],
  ["#1f8f63", "#7FA6D1", "#2F5D8C"],
  ["#1c7ed6", "#4cd4e8", "#E4502D"],
  ["#e0378a", "#ff9ec7", "#FF9B7F"],
  ["#14122b", "#E4502D", "#2F5D8C"],
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
