// Helpers for the contact block. Pure functions so the editor preview, the
// published page and the tests all agree on what a phone number becomes.

/** Digits only, with Egyptian local numbers (01xxxxxxxxx) promoted to international (201xxxxxxxxx). */
export function whatsappDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("01")) d = "20" + d.slice(1);
  return d.length >= 8 && d.length <= 15 ? d : "";
}

/** https://wa.me/<digits>, optionally with a prefilled message. Empty when the number is unusable. */
export function whatsappHref(input: string, message = ""): string {
  const d = whatsappDigits(input);
  if (!d) return "";
  const text = message.trim();
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** tel: link, or empty when there are no digits. */
export function telHref(input: string): string {
  const plus = input.trim().startsWith("+") ? "+" : "";
  const d = input.replace(/\D/g, "");
  return d.length >= 5 ? `tel:${plus}${d}` : "";
}
