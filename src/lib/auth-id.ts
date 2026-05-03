// يحوّل Auth0 sub (مثلاً "google-oauth2|123") إلى UUID v5 ثابت
// لاستخدامه كمعرّف في جداول Supabase.
function uuidv5FromString(input: string): string {
  // Hash بسيط ومستقر (FNV-1a 128 تقريبي عبر تكرار) — كافٍ لتوليد معرّف ثابت
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const bytes = new Uint8Array(16);
  const dv = new DataView(bytes.buffer);
  dv.setUint32(0, h1 >>> 0);
  dv.setUint32(4, h2 >>> 0);
  // mix more bytes from input length and chars
  let acc = input.length;
  for (let i = 0; i < input.length; i++) acc = (acc * 31 + input.charCodeAt(i)) >>> 0;
  dv.setUint32(8, acc);
  let acc2 = 0;
  for (let i = input.length - 1; i >= 0; i--) acc2 = (acc2 * 17 + input.charCodeAt(i)) >>> 0;
  dv.setUint32(12, acc2);

  // ضبط بتات النسخة (v5) والمتغيّر
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function auth0SubToUuid(sub: string | undefined | null): string | null {
  if (!sub) return null;
  return uuidv5FromString(sub);
}
