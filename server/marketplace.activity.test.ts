import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordMarketplaceEvent: vi.fn(async () => ({ recorded: true })),
}));

vi.mock("./db", () => ({ recordMarketplaceEvent: mocks.recordMarketplaceEvent }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("marketplace.recordActivity", () => {
  it("records a transparent buyer offer workflow event", async () => {
    const caller = appRouter.createCaller({} as TrpcContext);

    await expect(caller.marketplace.recordActivity({
      actorRole: "buyer",
      eventType: "offer_created",
      referenceId: "OFF-302",
      summary: "FreshBasket Kitchens offered ₹25.50/kg for 800 kg of tomatoes.",
    })).resolves.toEqual({ recorded: true });

    expect(mocks.recordMarketplaceEvent).toHaveBeenCalledWith({
      actorRole: "buyer",
      eventType: "offer_created",
      referenceId: "OFF-302",
      summary: "FreshBasket Kitchens offered ₹25.50/kg for 800 kg of tomatoes.",
    });
  });
});
