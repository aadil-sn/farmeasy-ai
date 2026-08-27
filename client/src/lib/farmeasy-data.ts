import { calculateTransparentSettlement, type MarketplaceRole } from "@shared/marketplace";
export type { MarketplaceRole } from "@shared/marketplace";

export type CropLot = {
  id: string;
  product: string;
  category: string;
  quantity: number;
  unit: string;
  farmer: string;
  village: string;
  harvestDate: string;
  quality: string;
  availability: "Available" | "Reserved" | "Harvesting";
  agreedPrice: number;
  logistics: number;
  handling: number;
  fee: number;
  distance: number;
  verified?: boolean;
};

export type Requirement = {
  id: string;
  buyer: string;
  buyerType: string;
  product: string;
  quantity: number;
  quality: string;
  maxPrice: number;
  destination: string;
  due: string;
  status: "Open" | "Matched" | "Confirmed";
};

export type BuyerOffer = {
  id: string;
  lotId: string;
  buyer: string;
  product: string;
  quantity: number;
  offeredPrice: number;
  status: "Pending" | "Accepted" | "Rejected";
  lot: CropLot;
};

export type OrderStage =
  | "Offer received"
  | "Confirmed"
  | "Collection scheduled"
  | "Picked up"
  | "In transit"
  | "Delivered"
  | "Settled";

export type FarmEasyOrder = {
  id: string;
  product: string;
  quantity: number;
  buyers: string;
  status: OrderStage;
  payment: "Pending" | "Paid" | "Held" | "Delivery confirmed" | "Settled";
  producers: string[];
  agreedPrice: number;
  logistics: number;
  handling: number;
  fee: number;
  route: string;
  eta: string;
};

export type ActivityNotification = {
  id: number;
  role: MarketplaceRole | "all";
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: "mint" | "blue" | "pink" | "amber";
};

export const cropLots: CropLot[] = [
  { id: "LOT-042", product: "Tomatoes", category: "Vegetables", quantity: 800, unit: "kg", farmer: "Asha Naik", village: "Kolar", harvestDate: "Today", quality: "Grade A", availability: "Available", agreedPrice: 25.5, logistics: 2.2, handling: 0.5, fee: 0.7, distance: 42, verified: true },
  { id: "LOT-039", product: "Tomatoes", category: "Vegetables", quantity: 450, unit: "kg", farmer: "Ravi Kumar", village: "Malur", harvestDate: "Today", quality: "Grade A", availability: "Available", agreedPrice: 25.5, logistics: 2.0, handling: 0.5, fee: 0.7, distance: 36, verified: true },
  { id: "LOT-031", product: "Tomatoes", category: "Vegetables", quantity: 250, unit: "kg", farmer: "Latha Devi", village: "Hoskote", harvestDate: "Tomorrow", quality: "Grade A", availability: "Harvesting", agreedPrice: 25.5, logistics: 2.5, handling: 0.5, fee: 0.7, distance: 53, verified: true },
  { id: "LOT-051", product: "Onions", category: "Vegetables", quantity: 1200, unit: "kg", farmer: "Manjunath R.", village: "Chintamani", harvestDate: "Aug 30", quality: "Grade A", availability: "Available", agreedPrice: 29.0, logistics: 1.9, handling: 0.4, fee: 0.6, distance: 68, verified: true },
  { id: "LOT-027", product: "Finger millet", category: "Cereals", quantity: 900, unit: "kg", farmer: "Sunita K.", village: "Srinivaspur", harvestDate: "Aug 31", quality: "Premium", availability: "Available", agreedPrice: 34.0, logistics: 1.5, handling: 0.6, fee: 0.8, distance: 78, verified: true },
  { id: "LOT-058", product: "Green beans", category: "Vegetables", quantity: 300, unit: "kg", farmer: "Lakshmi P.", village: "Vemgal", harvestDate: "Today", quality: "Grade A", availability: "Available", agreedPrice: 46.0, logistics: 2.4, handling: 0.8, fee: 1.0, distance: 31, verified: false },
  { id: "LOT-061", product: "Cabbage", category: "Vegetables", quantity: 650, unit: "kg", farmer: "Harish B.", village: "Kolar", harvestDate: "Tomorrow", quality: "Grade B", availability: "Available", agreedPrice: 18.5, logistics: 2.1, handling: 0.4, fee: 0.5, distance: 39, verified: true },
  { id: "LOT-064", product: "Mangoes", category: "Fruit", quantity: 400, unit: "kg", farmer: "Fathima A.", village: "Bangarapet", harvestDate: "Sep 02", quality: "Premium", availability: "Available", agreedPrice: 64.0, logistics: 3.1, handling: 1.1, fee: 1.2, distance: 56, verified: true },
  { id: "LOT-068", product: "Chillies", category: "Vegetables", quantity: 175, unit: "kg", farmer: "Devappa S.", village: "Mulbagal", harvestDate: "Sep 01", quality: "Grade A", availability: "Available", agreedPrice: 78.0, logistics: 2.7, handling: 1.3, fee: 1.2, distance: 83, verified: true },
  { id: "LOT-073", product: "Potatoes", category: "Vegetables", quantity: 750, unit: "kg", farmer: "Yashoda M.", village: "Sidlaghatta", harvestDate: "Today", quality: "Grade A", availability: "Available", agreedPrice: 22.0, logistics: 1.8, handling: 0.4, fee: 0.5, distance: 64, verified: true },
];

export const buyerRequirements: Requirement[] = [
  { id: "REQ-108", buyer: "FreshBasket Kitchens", buyerType: "Restaurant group", product: "Tomatoes", quantity: 1500, quality: "Grade A", maxPrice: 31, destination: "Indiranagar, Bengaluru", due: "Tomorrow, 10:00", status: "Matched" },
  { id: "REQ-104", buyer: "Namma Retail", buyerType: "Retailer", product: "Onions", quantity: 1000, quality: "Grade A", maxPrice: 35, destination: "Whitefield, Bengaluru", due: "Aug 30", status: "Open" },
  { id: "REQ-099", buyer: "Annapoorna Foods", buyerType: "Food processor", product: "Finger millet", quantity: 800, quality: "Premium", maxPrice: 42, destination: "Peenya, Bengaluru", due: "Sep 03", status: "Open" },
  { id: "REQ-112", buyer: "Green Table Market", buyerType: "Supermarket", product: "Green beans", quantity: 250, quality: "Grade A", maxPrice: 55, destination: "Koramangala, Bengaluru", due: "Today, 17:00", status: "Confirmed" },
  { id: "REQ-097", buyer: "City Hostel Network", buyerType: "Institutional buyer", product: "Potatoes", quantity: 600, quality: "Grade A", maxPrice: 28, destination: "Jayanagar, Bengaluru", due: "Tomorrow", status: "Open" },
];

export const initialBuyerOffers: BuyerOffer[] = [
  {
    id: "OFF-302",
    lotId: "LOT-042",
    buyer: "FreshBasket Kitchens",
    product: "Tomatoes",
    quantity: 800,
    offeredPrice: 25.5,
    status: "Pending",
    lot: cropLots[0],
  },
];

export const initialOrders: FarmEasyOrder[] = [
  { id: "ORD-2048", product: "Tomatoes", quantity: 1500, buyers: "FreshBasket Kitchens", status: "Collection scheduled", payment: "Paid", producers: ["Asha Naik · 800 kg", "Ravi Kumar · 450 kg", "Latha Devi · 250 kg"], agreedPrice: 25.5, logistics: 2.1, handling: 0.5, fee: 0.7, route: "Kolar → Malur → Hoskote → Indiranagar", eta: "Tomorrow, 10:00" },
  { id: "ORD-2045", product: "Green beans", quantity: 250, buyers: "Green Table Market", status: "In transit", payment: "Delivery confirmed", producers: ["Lakshmi P. · 250 kg"], agreedPrice: 46, logistics: 2.4, handling: 0.8, fee: 1.0, route: "Vemgal → Koramangala", eta: "Today, 15:40" },
  { id: "ORD-2039", product: "Onions", quantity: 900, buyers: "Namma Retail", status: "Delivered", payment: "Settled", producers: ["Manjunath R. · 900 kg"], agreedPrice: 29, logistics: 1.9, handling: 0.4, fee: 0.6, route: "Chintamani → Whitefield", eta: "Completed" },
];

export const initialNotifications: ActivityNotification[] = [
  { id: 1, role: "farmer", title: "Match approved for 800 kg tomatoes", body: "FreshBasket Kitchens has confirmed the transparent settlement for LOT-042.", time: "8 min ago", read: false, tone: "mint" },
  { id: 2, role: "fpo", title: "Three-farm collection can be consolidated", body: "The ORD-2048 route removes two duplicate trips and lowers freight by 12%.", time: "24 min ago", read: false, tone: "blue" },
  { id: 3, role: "buyer", title: "Collection confirmed", body: "Your tomato order will be collected from Kolar, Malur, and Hoskote tomorrow morning.", time: "38 min ago", read: true, tone: "pink" },
  { id: 4, role: "all", title: "Tomato demand signal strengthened", body: "Prototype forecast shows a 24% increase in next-week demand. Review the recommendation before acting.", time: "1 hr ago", read: false, tone: "amber" },
];

export const roleLabels: Record<MarketplaceRole, string> = {
  farmer: "Farmer workspace",
  buyer: "Buyer workspace",
  fpo: "FPO operations",
};

export function settlementForLot(lot: Pick<CropLot, "quantity" | "agreedPrice" | "logistics" | "handling" | "fee">) {
  return calculateTransparentSettlement({
    quantity: lot.quantity,
    agreedPricePerUnit: lot.agreedPrice,
    logisticsPerUnit: lot.logistics,
    handlingPerUnit: lot.handling,
    serviceFeePerUnit: lot.fee,
  });
}

export function settlementForOrder(order: Pick<FarmEasyOrder, "quantity" | "agreedPrice" | "logistics" | "handling" | "fee">) {
  return calculateTransparentSettlement({
    quantity: order.quantity,
    agreedPricePerUnit: order.agreedPrice,
    logisticsPerUnit: order.logistics,
    handlingPerUnit: order.handling,
    serviceFeePerUnit: order.fee,
  });
}
