import { describe, expect, it } from "vitest";
import { isAcceptedPhoto, isHeic, needsCompression } from "@/lib/photo-prep";

describe("photo-prep", () => {
  it("accepts JPG, PNG, WEBP and HEIC", () => {
    for (const n of ["a.jpg", "a.png", "a.webp", "a.HEIC"]) expect(isAcceptedPhoto({ name: n, type: "" })).toBe(true);
    expect(isAcceptedPhoto({ name: "a.pdf", type: "application/pdf" })).toBe(false);
  });
  it("detects HEIC for conversion", () => expect(isHeic({ name: "x.heic", type: "" })).toBe(true));
  it("compresses only above 10 MB", () => {
    expect(needsCompression(10 * 1024 * 1024)).toBe(false);
    expect(needsCompression(10 * 1024 * 1024 + 1)).toBe(true);
  });
});
