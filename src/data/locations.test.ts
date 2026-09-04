import { describe, expect, it } from "vitest";

import { locations, parseSelectedLocationId } from "./locations";

describe("parseSelectedLocationId", () => {
  it("restores a known pickup location", () => {
    expect(parseSelectedLocationId("campus-saint-charles")).toBe("campus-saint-charles");
  });

  it("falls back to the first stop for unknown or missing values", () => {
    expect(parseSelectedLocationId("ailleurs")).toBe(locations[0].id);
    expect(parseSelectedLocationId(null)).toBe(locations[0].id);
  });
});
