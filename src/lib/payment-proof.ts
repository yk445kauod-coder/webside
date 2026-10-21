// Client-side only: shrink a transfer screenshot before upload so each proof stays well under the
// bucket's 300 KB cap (the owner deletes proofs after verifying, but they must never pile up).

export const PROOF_MAX_BYTES = 280_000;
const MAX_SIDE = 1400;

export async function compressProof(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image (PNG, JPG or WebP).");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  let w = Math.max(1, Math.round(bitmap.width * scale));
  let h = Math.max(1, Math.round(bitmap.height * scale));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't process this image.");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const quality = Math.max(0.4, 0.82 - attempt * 0.1);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
    if (blob && blob.type === "image/webp" && blob.size <= PROOF_MAX_BYTES) return blob;
    w = Math.round(w * 0.8);
    h = Math.round(h * 0.8);
  }
  throw new Error("That image is too large. Try a cropped screenshot.");
}
