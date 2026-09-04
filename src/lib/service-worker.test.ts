import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

function worker() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const put = vi.fn();
  const fetch = vi.fn().mockResolvedValue(new Response("ok"));
  const caches = { open: vi.fn().mockResolvedValue({ put }), match: vi.fn().mockResolvedValue(undefined) };
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: { location: { origin: "https://pizza.test" }, addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler; } },
    URL, fetch, caches, Response,
  });
  return { handlers, fetch, caches, put };
}

it("returns a network error, not homepage HTML, for an uncached offline image", async () => {
  const { handlers, fetch, caches } = worker();
  fetch.mockRejectedValue(new Error("offline"));
  const respondWith = vi.fn();
  handlers.fetch({ request: new Request("https://pizza.test/images/missing.webp"), respondWith, waitUntil: vi.fn() });
  const response = await respondWith.mock.calls[0][0];
  expect(response?.type).toBe("error");
  expect(caches.match).not.toHaveBeenCalledWith("/");
});

it("does not intercept private pages, APIs, foreign resources or RSC requests", () => {
  const { handlers } = worker();
  for (const path of ["/admin", "/admin/orders", "/api/orders", "https://other.test/image.png", "/?_rsc=test"]) {
    const respondWith = vi.fn();
    handlers.fetch({ request: new Request(new URL(path, "https://pizza.test")), respondWith });
    expect(respondWith, path).not.toHaveBeenCalled();
  }
});
