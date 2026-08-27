import { describe, expect, it } from "vitest";
import { verifyCedaConnection } from "./externalSignals";

describe("CEDA market data credential", () => {
  it("authorizes the lightweight commodity catalog request", async () => {
    const token = process.env.CEDA_API_TOKEN;
    expect(token, "CEDA_API_TOKEN must be configured").toBeTruthy();

    const result = await verifyCedaConnection(token!);
    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
  }, 15_000);
});
