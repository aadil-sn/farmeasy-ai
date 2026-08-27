export type MarketplaceRole = "farmer" | "buyer" | "fpo";

export type SettlementInput = {
  quantity: number;
  agreedPricePerUnit: number;
  logisticsPerUnit: number;
  handlingPerUnit: number;
  serviceFeePerUnit: number;
};

/**
 * The FPO coordinates the transaction and never earns an undisclosed resale margin.
 * All figures are per unit unless labelled as totals.
 */
export function calculateTransparentSettlement(input: SettlementInput) {
  const farmerNetPerUnit =
    input.agreedPricePerUnit -
    input.logisticsPerUnit -
    input.handlingPerUnit -
    input.serviceFeePerUnit;
  const buyerPricePerUnit =
    input.agreedPricePerUnit +
    input.logisticsPerUnit +
    input.handlingPerUnit +
    input.serviceFeePerUnit;

  return {
    farmerNetPerUnit: roundCurrency(farmerNetPerUnit),
    buyerPricePerUnit: roundCurrency(buyerPricePerUnit),
    grossCropValue: roundCurrency(input.quantity * input.agreedPricePerUnit),
    logisticsTotal: roundCurrency(input.quantity * input.logisticsPerUnit),
    handlingTotal: roundCurrency(input.quantity * input.handlingPerUnit),
    serviceFeeTotal: roundCurrency(input.quantity * input.serviceFeePerUnit),
    farmerPayout: roundCurrency(input.quantity * farmerNetPerUnit),
    buyerPayment: roundCurrency(input.quantity * buyerPricePerUnit),
  };
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
