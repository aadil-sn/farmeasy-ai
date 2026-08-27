import { describe, expect, it } from "vitest";
import { calculateTransparentSettlement } from "../shared/marketplace";

describe("transparent marketplace settlement", () => {
  it("itemizes every cost without introducing a resale margin", () => {
    const settlement = calculateTransparentSettlement({
      quantity: 800,
      agreedPricePerUnit: 25.5,
      logisticsPerUnit: 2.2,
      handlingPerUnit: 0.5,
      serviceFeePerUnit: 0.7,
    });

    expect(settlement.grossCropValue).toBe(20400);
    expect(settlement.logisticsTotal).toBe(1760);
    expect(settlement.handlingTotal).toBe(400);
    expect(settlement.serviceFeeTotal).toBe(560);
    expect(settlement.farmerNetPerUnit).toBe(22.1);
    expect(settlement.farmerPayout).toBe(17680);
    expect(settlement.buyerPricePerUnit).toBe(28.9);
    expect(settlement.buyerPayment).toBe(23120);
  });

  it("keeps the gross crop value equal to the farmer payout plus actual itemized costs", () => {
    const settlement = calculateTransparentSettlement({
      quantity: 1500,
      agreedPricePerUnit: 25.5,
      logisticsPerUnit: 2.1,
      handlingPerUnit: 0.5,
      serviceFeePerUnit: 0.7,
    });

    expect(settlement.grossCropValue).toBe(
      settlement.farmerPayout + settlement.logisticsTotal + settlement.handlingTotal + settlement.serviceFeeTotal,
    );
  });
});
