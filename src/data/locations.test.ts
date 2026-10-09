import { describe, expect, it } from "vitest";

import { locations, parseSelectedLocationId } from "./locations";

describe("parseSelectedLocationId", () => {
  it("restores a known pickup location", () => {
    expect(parseSelectedLocationId("la-fonderie")).toBe("la-fonderie");
  });

  it("falls back to the first stop for unknown or missing values", () => {
    expect(parseSelectedLocationId("ailleurs")).toBe(locations[0].id);
    expect(parseSelectedLocationId(null)).toBe(locations[0].id);
  });
});
