import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { FEATURES } from "@/lib/features";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("shows only the Comida shortcut", () => {
    expect(FEATURES.map((item) => item.key)).toEqual(["comida"]);
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("serves the sales page at /pagdevendas and keeps / as the app entry", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    // The sales page must open at its own address and be the page listed in the site map.
    expect(router.matchRoutes("/pagdevendas").at(-1)?.routeId).toBe("/pagdevendas");
    const sales = Object.values(router.routesById).find((route) => route.fullPath === "/pagdevendas");
    expect(sales?.options.staticData?.sitemap).toBe(true);

    // The main address belongs to the app, so it must not be listed as a public page.
    const home = Object.values(router.routesById).find((route) => route.fullPath === "/");
    expect(home?.options.staticData?.sitemap).toBe(false);
  });
});
