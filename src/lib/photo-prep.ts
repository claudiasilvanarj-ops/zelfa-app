// Browser-safe rules for choosing a dish photo (camera or gallery).
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

export function isHeic(file: { name: string; type: string }) {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

export function isAcceptedPhoto(file: { name: string; type: string }) {
  return /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name) || isHeic(file);
}

export const needsCompression = (size: number) => size > MAX_PHOTO_BYTES;

/** Converts HEIC to JPG when needed; the upload step already compresses large photos. */
export async function preparePhoto(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(out) ? out[0] : out;
  if (!blob) throw new Error("heic");
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, "") + ".jpg", { type: "image/jpeg" });
}
