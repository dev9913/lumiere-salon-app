import { describe, it, expect } from "vitest";
import { formatPrice, formatDuration, slugify, cn } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats whole dollar amounts", () => {
    expect(formatPrice(4500)).toBe("$45.00");
  });

  it("formats amounts with cents", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });
});

describe("formatDuration", () => {
  it("formats minutes under an hour", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formats exact hours with no remainder", () => {
    expect(formatDuration(120)).toBe("2 hr");
  });

  it("formats hours plus minutes", () => {
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Hair Color")).toBe("hair-color");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Manicure & Pedicure!")).toBe("manicure-pedicure");
  });

  it("trims leading/trailing hyphens produced by punctuation", () => {
    expect(slugify("  -Bridal Packages-  ")).toBe("bridal-packages");
  });

  it("collapses repeated separators into one hyphen", () => {
    expect(slugify("Spa   /   Massage")).toBe("spa-massage");
  });
});

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
