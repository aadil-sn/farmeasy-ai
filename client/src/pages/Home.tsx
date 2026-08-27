import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bot,
  Boxes,
  ChevronDown,
  ChevronRight,
  CloudSun,
  CopyPlus,
  Leaf,
  LineChart,
  Menu,
  PackageCheck,
  Plus,
  ReceiptText,
  Route,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Truck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RouteContextMap } from "@/components/RouteContextMap";
import { trpc } from "@/lib/trpc";
import {
  buyerRequirements,
  cropLots,
  initialBuyerOffers,
  initialNotifications,
  initialOrders,
  roleLabels,
  settlementForLot,
  type ActivityNotification,
  type BuyerOffer,
  type CropLot,
  type FarmEasyOrder,
  type MarketplaceRole,
  type OrderStage,
  type Requirement,
} from "@/lib/farmeasy-data";

type Section = "overview" | "market" | "orders" | "intelligence" | "logistics" | "operations";
type FarmerVerification = { id: string; name: string; village: string; crops: string; status: "Pending" | "Verified" | "Rejected" };

const navigation: Record<MarketplaceRole, { id: Section; label: string; icon: typeof Leaf }[]> = {
  farmer: [
    { id: "overview", label: "My field", icon: Leaf },
    { id: "market", label: "Crop lots", icon: ShoppingBasket },
    { id: "orders", label: "Orders & payout", icon: WalletCards },
    { id: "intelligence", label: "AI advice", icon: Bot },
    { id: "logistics", label: "Collection route", icon: Route },
  ],
  buyer: [
    { id: "overview", label: "Buying desk", icon: ShoppingBasket },
    { id: "market", label: "Browse supply", icon: Search },
    { id: "orders", label: "Orders & delivery", icon: PackageCheck },
    { id: "intelligence", label: "Demand signals", icon: LineChart },
    { id: "logistics", label: "Delivery route", icon: Route },
  ],
  fpo: [
    { id: "overview", label: "Operations", icon: Boxes },
    { id: "operations", label: "Supply aggregation", icon: UsersRound },
    { id: "market", label: "Buyer demand", icon: ShoppingBasket },
    { id: "orders", label: "Order coordination", icon: PackageCheck },
    { id: "intelligence", label: "AI intelligence", icon: Bot },
    { id: "logistics", label: "Route planning", icon: Route },
  ],
};

const orderStages: OrderStage[] = [
  "Offer received",
  "Confirmed",
  "Collection scheduled",
  "Picked up",
  "In transit",
  "Delivered",
  "Settled",
];

const demandData = [
  { day: "Mon", demand: 3800, supply: 4150 },
  { day: "Tue", demand: 4200, supply: 4080 },
  { day: "Wed", demand: 4600, supply: 4420 },
  { day: "Thu", demand: 5000, supply: 4700 },
  { day: "Fri", demand: 5400, supply: 4820 },
  { day: "Sat", demand: 5900, supply: 5160 },
  { day: "Sun", demand: 6200, supply: 5400 },
];

const optimizationData = [
  { name: "Before", farmer: 21.6, buyer: 31.4 },
  { name: "Optimized", farmer: 22.1, buyer: 28.9 },
];

const formatNumber = (amount: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(amount);

function pillTone(status: string) {
  const normalized = status.toLowerCase();
  if (/(settled|delivered|available|paid)/.test(normalized)) return "bg-[#c6ead6] text-[#153e2a]";
  if (/(transit|matched|scheduled|confirmed)/.test(normalized)) return "bg-[#c9def3] text-[#173a54]";
  if (/(hold|open|harvest|pending)/.test(normalized)) return "bg-[#f7e6a3] text-[#57440d]";
  return "bg-[#f3c9c6] text-[#6d2924]";
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${className}`}>{children}</span>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-[-.06em] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm font-light leading-6 text-[#66736b]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Stat({ label, value, detail, tone = "mint", trend }: { label: string; value: string; detail: string; tone?: "mint" | "blue" | "pink" | "yellow"; trend?: "up" | "down" }) {
  const colors = { mint: "bg-[#c6ead6]", blue: "bg-[#c9def3]", pink: "bg-[#f3c9c6]", yellow: "bg-[#f7e6a3]" };
  return (
    <article className="card-surface relative min-h-[146px] overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <span className={`absolute -right-7 -top-7 h-20 w-20 rotate-45 ${colors[tone]} opacity-75`} />
      <p className="eyebrow relative">{label}</p>
      <p className="relative mt-5 text-3xl font-extrabold tracking-[-.07em]">{value}</p>
      <p className="relative mt-2 flex items-center gap-1 text-[11px] text-[#66736b]">
        {trend === "up" && <ArrowUpRight size={13} className="text-[#217444]" />}
        {trend === "down" && <ArrowDownRight size={13} className="text-[#217444]" />}
        {detail}
      </p>
    </article>
  );
}

function PriceBreakdown({ quantity, agreedPrice, logistics, handling, fee, compact = false }: { quantity: number; agreedPrice: number; logistics: number; handling: number; fee: number; compact?: boolean }) {
  const settlement = settlementForLot({ quantity, agreedPrice, logistics, handling, fee });
  const entries = [
    ["Agreed crop price", settlement.grossCropValue, ""],
    ["Logistics coordination", settlement.logisticsTotal, "− "],
    ["Handling & packing", settlement.handlingTotal, "− "],
    ["FPO service fee", settlement.serviceFeeTotal, "− "],
  ];
  return (
    <div className={`border border-[#dce4de] bg-[#f7f9f7] ${compact ? "p-3" : "p-4"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="eyebrow text-[9px]">Transparent settlement</p>
        <Pill className="bg-[#c6ead6] text-[#153e2a]">No resale margin</Pill>
      </div>
      <div className="space-y-2">
        {entries.map(([label, value, symbol]) => (
          <div key={String(label)} className="flex justify-between gap-3 text-xs text-[#5c6961]">
            <span>{label}</span><span className="mono whitespace-nowrap text-[#102017]">{symbol}₹{formatNumber(Number(value))}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#dce4de] pt-3">
        <div><p className="text-[10px] uppercase tracking-[.08em] text-[#66736b]">Farmer payout</p><p className="mt-1 text-base font-extrabold tracking-[-.04em] text-[#153e2a]">₹{formatNumber(settlement.farmerPayout)}</p></div>
        <div className="border-l border-[#dce4de] pl-3"><p className="text-[10px] uppercase tracking-[.08em] text-[#66736b]">Buyer pays</p><p className="mt-1 text-base font-extrabold tracking-[-.04em]">₹{formatNumber(settlement.buyerPayment)}</p></div>
      </div>
    </div>
  );
}

function LotCard({ lot, editable, onDetail, onAction }: { lot: CropLot; editable?: boolean; onDetail: (lot: CropLot) => void; onAction: (lot: CropLot) => void }) {
  const settlement = settlementForLot(lot);
  return (
    <article className="card-surface flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="mono text-[10px] text-[#69776e]">{lot.id}</p><h3 className="mt-1 text-xl font-extrabold tracking-[-.05em]">{lot.product}</h3><p className="mt-1 text-xs text-[#68766d]">{lot.quality} · {lot.village}</p></div>
        <Pill className={pillTone(lot.availability)}>{lot.availability}</Pill>
      </div>
      <div className="mt-5 flex items-end justify-between border-y border-[#e0e7e1] py-3">
        <div><p className="eyebrow text-[9px]">Available</p><p className="mt-1 text-lg font-extrabold tracking-[-.05em]">{formatNumber(lot.quantity)} <span className="text-sm font-medium">kg</span></p></div>
        <div className="text-right"><p className="eyebrow text-[9px]">Farmer net / kg</p><p className="mt-1 text-lg font-extrabold tracking-[-.05em] text-[#153e2a]">₹{formatNumber(settlement.farmerNetPerUnit, 1)}</p></div>
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-[#68766d]"><span>{lot.farmer}</span><span>{lot.distance} km</span></div>
      <div className="mt-4 flex gap-2"><button onClick={() => onDetail(lot)} className="flex-1 border border-[#cfd9d0] py-2 text-xs font-bold hover:bg-[#edf2ee]">Details</button><button onClick={() => onAction(lot)} className="flex-1 bg-[#153e2a] py-2 text-xs font-bold text-white hover:bg-[#102017]">{editable ? "Update lot" : "Make offer"}</button></div>
    </article>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102017]/35 p-3 sm:items-center" onMouseDown={onClose}><div className="max-h-[90vh] w-full max-w-lg overflow-auto bg-[#fbfcfb] p-6 shadow-2xl" onMouseDown={event => event.stopPropagation()}>{children}</div></div>;
}

function SettlementModal({ item, onClose }: { item: CropLot | FarmEasyOrder; onClose: () => void }) {
  const contributors = "producers" in item ? item.producers : null;
  return <Modal onClose={onClose}><div className="mb-6 flex items-start justify-between"><div><p className="eyebrow">Transaction detail</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.05em]">{item.product} · {formatNumber(item.quantity)} kg</h2></div><button aria-label="Close detail" onClick={onClose} className="grid h-9 w-9 place-items-center border border-[#dce4de] hover:bg-[#edf2ee]"><X size={18} /></button></div><PriceBreakdown quantity={item.quantity} agreedPrice={item.agreedPrice} logistics={item.logistics} handling={item.handling} fee={item.fee} /><div className="mt-5 bg-[#c9def3]/45 p-4"><div className="flex items-center gap-2"><ShieldCheck size={17} /><p className="text-sm font-bold">How this stays transparent</p></div><p className="mt-2 text-xs leading-5 text-[#435b6b]">FarmEasy AI coordinates verified supply, route planning, and settlement. It never purchases the crop or applies an undisclosed resale margin.</p></div>{contributors && <div className="mt-5"><p className="eyebrow mb-2">Contributing farmers</p>{contributors.map(name => <div key={name} className="flex items-center justify-between border-b border-[#e2e7e3] py-2 text-sm"><span>{name}</span><PackageCheck size={15} className="text-[#217444]" /></div>)}</div>}</Modal>;
}

function FarmerOverview({ lots, orders, offers, onNavigate, onDetail, onEdit, onOfferDecision }: { lots: CropLot[]; orders: FarmEasyOrder[]; offers: BuyerOffer[]; onNavigate: (section: Section) => void; onDetail: (lot: CropLot) => void; onEdit: (lot: CropLot) => void; onOfferDecision: (offer: BuyerOffer, decision: "Accepted" | "Rejected") => void }) {
  const ownLots = lots.filter(lot => lot.farmer === "Asha Naik");
  const payout = ownLots.reduce((sum, lot) => sum + settlementForLot(lot).farmerPayout, 0);
  return <>
    <PageTitle eyebrow="Farmer workspace · Kolar" title="Good morning, Asha." description="Your tomatoes are part of a consolidated buyer match. Every cost and payout is visible before you confirm." action={<button onClick={() => onNavigate("market")} className="flex items-center gap-2 bg-[#153e2a] px-4 py-3 text-xs font-bold text-white hover:bg-[#102017]"><Plus size={15} /> Add crop lot</button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Available stock" value="800 kg" detail="Tomatoes · Grade A" /><Stat label="Suggested price" value="₹25.5" detail="Per kg · 84% confidence" tone="blue" trend="up" /><Stat label="Expected payout" value={`₹${formatNumber(payout)}`} detail="After all visible costs" tone="pink" /><Stat label="Demand forecast" value="+24%" detail="Tomatoes · next week" tone="yellow" trend="up" /></div>
    {offers.filter(offer => offer.status === "Pending").length > 0 && <article className="card-surface mt-5 border-l-4 border-l-[#c7847d] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Action required</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Review buyer offer</h2></div><Pill className="bg-[#f7e6a3] text-[#57440d]">Offer pending</Pill></div>{offers.filter(offer => offer.status === "Pending").map(offer => <div key={offer.id} className="mt-4 grid gap-4 border-t border-[#dce4de] pt-4 lg:grid-cols-[1fr_.85fr_auto]"><div><p className="text-sm font-bold">{offer.buyer} · {offer.product}</p><p className="mt-1 text-xs text-[#65736a]">{offer.quantity} kg from {offer.lotId} at ₹{offer.offeredPrice}/kg. Accepting reserves your lot and creates a tracked order.</p></div><PriceBreakdown quantity={offer.quantity} agreedPrice={offer.offeredPrice} logistics={offer.lot.logistics} handling={offer.lot.handling} fee={offer.lot.fee} compact /><div className="flex min-w-[160px] items-center gap-2"><button onClick={() => onOfferDecision(offer, "Rejected")} className="flex-1 border border-[#ccd6ce] py-2 text-xs font-bold hover:bg-[#edf2ee]">Reject</button><button onClick={() => onOfferDecision(offer, "Accepted")} className="flex-1 bg-[#153e2a] py-2 text-xs font-bold text-white hover:bg-[#102017]">Accept</button></div></div>)}</article>}
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
      <article className="card-surface overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce4de] px-5 py-4"><div><p className="eyebrow">Best available match</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">FreshBasket Kitchens · 800 kg</h2></div><Pill className="bg-[#c9def3] text-[#173a54]">AI match 93%</Pill></div><div className="grid gap-4 p-5 sm:grid-cols-[1fr_.94fr]"><div><p className="text-sm font-bold">Why this match?</p><div className="mt-3 space-y-3 text-xs leading-5 text-[#617067]"><p>• The buyer needs your full quantity as part of a single 1,500 kg consolidated shipment.</p><p>• A shared route lowers logistics to ₹2.20/kg compared with separate dispatch.</p><p>• Pickup tomorrow meets the delivery window and protects freshness.</p></div><button onClick={() => onNavigate("orders")} className="mt-5 flex items-center gap-1 text-xs font-bold underline underline-offset-4">Review offer <ChevronRight size={14} /></button></div><PriceBreakdown quantity={800} agreedPrice={25.5} logistics={2.2} handling={.5} fee={.7} compact /></div></article>
      <article className="card-surface overflow-hidden"><div className="border-b border-[#dce4de] px-5 py-4"><p className="eyebrow">Sell-time guidance</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Sell within 24 hours</h2></div><div className="p-5"><div className="flex gap-3"><div className="icon-tile bg-[#f7e6a3]"><CloudSun size={18} /></div><p className="text-sm leading-5 text-[#4e5c54]">A marginal predicted price lift does not outweigh estimated storage, spoilage, and handling costs.</p></div><div className="mt-5 grid grid-cols-2 gap-2"><div className="bg-[#edf2ee] p-3"><p className="eyebrow text-[9px]">Sell now</p><p className="mt-1 text-lg font-extrabold tracking-[-.04em]">₹22.10/kg</p></div><div className="bg-[#f8e9e6] p-3"><p className="eyebrow text-[9px]">Wait 2 days</p><p className="mt-1 text-lg font-extrabold tracking-[-.04em]">₹21.70/kg</p></div></div></div></article>
    </div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.85fr]"><article className="card-surface p-5"><div className="flex justify-between"><div><p className="eyebrow">My crop lots</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Keep supply current</h2></div><button onClick={() => onNavigate("market")} className="text-xs font-bold underline underline-offset-4">View all</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{ownLots.map(lot => <LotCard key={lot.id} lot={lot} editable onDetail={onDetail} onAction={onEdit} />)}</div></article><article className="card-surface p-5"><p className="eyebrow">Active collection</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">{orders[0].id}</h2><div className="mt-5 space-y-3">{["Confirmed", "Collection scheduled", "Picked up", "In transit", "Delivered"].map((step, index) => <div key={step} className="flex items-center gap-3"><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${index < 2 ? "bg-[#153e2a] text-white" : "bg-[#e8eeea] text-[#718077]"}`}>{index < 2 ? "✓" : index + 1}</span><span className={`text-xs ${index < 2 ? "font-bold" : "text-[#718077]"}`}>{step}</span></div>)}</div><button onClick={() => onNavigate("orders")} className="mt-6 w-full border border-[#ccd6ce] py-2.5 text-xs font-bold hover:bg-[#edf2ee]">Track & view payout</button></article></div>
  </>;
}

function BuyerOverview({ lots, onNavigate, onOffer, onDetail }: { lots: CropLot[]; onNavigate: (section: Section) => void; onOffer: (lot: CropLot) => void; onDetail: (lot: CropLot) => void }) {
  const tomatoSupply = lots.filter(lot => lot.product === "Tomatoes").reduce((total, lot) => total + lot.quantity, 0);
  return <>
    <PageTitle eyebrow="Buyer workspace · Bengaluru" title="Source with the full cost visible." description="Compare verified nearby supply and approve a coordinated delivery—without hidden trading spreads." action={<button onClick={() => onNavigate("market")} className="flex items-center gap-2 bg-[#153e2a] px-4 py-3 text-xs font-bold text-white hover:bg-[#102017]"><CopyPlus size={15} /> Post requirement</button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Open requirement" value="1,500 kg" detail="Grade A tomatoes" tone="pink" /><Stat label="Matched supply" value={`${formatNumber(tomatoSupply)} kg`} detail="3 verified farms" trend="up" /><Stat label="Est. buyer price" value="₹28.80" detail="All costs included / kg" tone="blue" trend="down" /><Stat label="Est. delivery" value="Tomorrow" detail="10:00 · 42 km route" tone="yellow" /></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.85fr]"><article className="card-surface p-5"><div className="flex justify-between gap-4"><div><p className="eyebrow">Your strongest match</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">FreshBasket Kitchens · tomatoes</h2></div><Pill className="bg-[#c6ead6] text-[#153e2a]">Ready to confirm</Pill></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="bg-[#edf2ee] p-4"><p className="eyebrow text-[9px]">Supply design</p><p className="mt-2 text-2xl font-extrabold tracking-[-.06em]">3 farms</p><p className="mt-1 text-xs leading-5 text-[#65736a]">Asha Naik, Ravi Kumar, and Latha Devi fill one coordinated load.</p></div><div className="bg-[#c9def3]/45 p-4"><p className="eyebrow text-[9px]">Why it works</p><p className="mt-2 text-sm font-bold leading-5">The route meets your volume and freshness requirements while reducing delivery cost.</p><button onClick={() => onNavigate("orders")} className="mt-4 flex items-center gap-1 text-xs font-bold underline underline-offset-4">Review offer <ChevronRight size={14} /></button></div></div></article><article className="card-surface p-5"><p className="eyebrow">Transparent buyer total</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">No unknown mark-up</h2><div className="mt-5"><PriceBreakdown quantity={1500} agreedPrice={25.5} logistics={2.1} handling={.5} fee={.7} compact /></div></article></div>
    <article className="card-surface mt-7 p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="eyebrow">Available farmer & FPO supply</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Verified crops near your delivery location</h2></div><button onClick={() => onNavigate("market")} className="text-xs font-bold underline underline-offset-4">Browse all supply</button></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{lots.slice(0, 4).map(lot => <LotCard key={lot.id} lot={lot} onDetail={onDetail} onAction={onOffer} />)}</div></article>
  </>;
}

function FpoOverview({ lots, onNavigate, onApprove, farmerChecks, onVerification }: { lots: CropLot[]; onNavigate: (section: Section) => void; onApprove: () => void; farmerChecks: FarmerVerification[]; onVerification: (farmer: FarmerVerification, status: "Verified" | "Rejected") => void }) {
  const availableKg = lots.filter(lot => lot.availability === "Available").reduce((total, lot) => total + lot.quantity, 0);
  const tomatoes = lots.filter(lot => lot.product === "Tomatoes");
  return <>
    <PageTitle eyebrow="FPO operations · Kolar cluster" title="Coordinate more value with fewer layers." description="Approve farmer supply aggregation, match verified demand, and keep every operational cost visible to all parties." action={<button onClick={() => onNavigate("operations")} className="flex items-center gap-2 bg-[#153e2a] px-4 py-3 text-xs font-bold text-white hover:bg-[#102017]"><Boxes size={15} /> Review aggregation</button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Verified farmers" value="10" detail="8 active this week" /><Stat label="Available produce" value={`${formatNumber(availableKg)} kg`} detail="Across 8 crop categories" tone="blue" /><Stat label="Active orders" value="3" detail="₹70,542 coordinated" tone="pink" /><Stat label="Buyer savings" value="8.0%" detail="Vs. separate dispatch" tone="yellow" trend="down" /></div>
    <article className="card-surface mt-5 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="eyebrow">Member validation</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Verify farmer profiles before matching supply</h2></div><Pill className="bg-[#c9def3] text-[#173a54]">{farmerChecks.filter(farmer => farmer.status === "Pending").length} pending</Pill></div><div className="mt-4 grid gap-3 md:grid-cols-2">{farmerChecks.map(farmer => <div key={farmer.id} className="border border-[#dce4de] bg-[#f7f9f7] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{farmer.name}</p><p className="mt-1 text-xs text-[#65736a]">{farmer.village} · {farmer.crops}</p></div><Pill className={pillTone(farmer.status)}>{farmer.status}</Pill></div>{farmer.status === "Pending" && <div className="mt-4 flex gap-2"><button onClick={() => onVerification(farmer, "Rejected")} className="flex-1 border border-[#ccd6ce] py-2 text-xs font-bold hover:bg-[#edf2ee]">Reject</button><button onClick={() => onVerification(farmer, "Verified")} className="flex-1 bg-[#153e2a] py-2 text-xs font-bold text-white hover:bg-[#102017]">Verify farmer</button></div>}</div>)}</div></article>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><article className="card-surface overflow-hidden"><div className="flex justify-between gap-4 border-b border-[#dce4de] px-5 py-4"><div><p className="eyebrow">Review required</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Tomato aggregation · REQ-108</h2></div><Pill className="bg-[#f7e6a3] text-[#57440d]">Pending approval</Pill></div><div className="p-5"><div className="grid grid-cols-3 gap-2">{tomatoes.map(lot => <div key={lot.id} className="bg-[#edf2ee] p-3"><p className="text-xs font-bold">{lot.farmer.split(" ")[0]}</p><p className="mt-2 mono text-lg">{lot.quantity} kg</p><p className="mt-1 text-[10px] text-[#6d7a72]">{lot.village}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-[#65736a]">The shared 1,800 kg vehicle avoids duplicate trips and lowers the buyer’s total price by ₹2.50/kg compared with separate collection.</p><div className="mt-5 flex gap-2"><button onClick={onApprove} className="flex-1 bg-[#153e2a] py-2.5 text-xs font-bold text-white hover:bg-[#102017]">Approve coordination plan</button><button onClick={() => onNavigate("operations")} className="border border-[#ccd6ce] px-4 text-xs font-bold hover:bg-[#edf2ee]">Inspect</button></div></div></article><article className="card-surface p-5"><p className="eyebrow">Operating principle</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">FPO coordinates. Farmers sell.</h2><div className="mt-5 space-y-4"><div className="flex gap-3"><div className="icon-tile bg-[#c6ead6]"><ShieldCheck size={17} /></div><div><p className="text-sm font-bold">No hidden resale margin</p><p className="mt-1 text-xs leading-5 text-[#65736a]">Farmer price, actual logistics, handling, and service fee are visible in every order.</p></div></div><div className="flex gap-3"><div className="icon-tile bg-[#c9def3]"><Truck size={17} /></div><div><p className="text-sm font-bold">Third-party route coordination</p><p className="mt-1 text-xs leading-5 text-[#65736a]">The FPO does not own delivery vehicles; it schedules capacity around farms and delivery windows.</p></div></div></div></article></div>
    <article className="card-surface mt-7 p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="eyebrow">Supply & demand outlook</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Prepare the cluster for next week</h2></div><Pill className="bg-[#c9def3] text-[#173a54]">AI estimate · 87% confidence</Pill></div><div className="mt-4 h-[250px]"><DemandChart data={demandData} /></div></article>
  </>;
}

function DemandChart({ data }: { data: typeof demandData }) {
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#153e2a" stopOpacity={.3} /><stop offset="100%" stopColor="#153e2a" stopOpacity={.02} /></linearGradient></defs><CartesianGrid stroke="#dce4de" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#748078", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#748078", fontSize: 11 }} /><Tooltip contentStyle={{ border: "1px solid #dce4de", borderRadius: 0, fontSize: 12 }} /><Area type="monotone" dataKey="demand" stroke="#153e2a" strokeWidth={2} fill="url(#demandFill)" /><Area type="monotone" dataKey="supply" stroke="#c7847d" strokeWidth={2} fill="none" /></AreaChart></ResponsiveContainer>;
}

function Market({ role, lots, requirements, onDetail, onOffer, onEdit, onCreateLot, onCreateRequirement }: { role: MarketplaceRole; lots: CropLot[]; requirements: Requirement[]; onDetail: (lot: CropLot) => void; onOffer: (lot: CropLot) => void; onEdit: (lot: CropLot) => void; onCreateLot: () => void; onCreateRequirement: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = lots.filter(lot => (category === "All" || lot.category === category) && `${lot.product} ${lot.farmer} ${lot.village}`.toLowerCase().includes(query.toLowerCase()));
  if (role === "fpo") return <DemandBoard requirements={requirements} />;
  const isFarmer = role === "farmer";
  return <>
    <PageTitle eyebrow={isFarmer ? "Farmer workspace" : "Buyer workspace"} title={isFarmer ? "Your crop lots" : "Browse verified supply"} description={isFarmer ? "Publish availability early so buyers and the FPO can build efficient fair-price matches." : "Filter transparent farmer lots, compare itemized totals, and make an informed offer."} action={<button onClick={isFarmer ? onCreateLot : onCreateRequirement} className="flex items-center gap-2 bg-[#153e2a] px-4 py-3 text-xs font-bold text-white hover:bg-[#102017]"><Plus size={15} /> {isFarmer ? "Add crop lot" : "Post requirement"}</button>} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-2 border border-[#cfd9d0] bg-[#fbfcfb] px-3"><Search size={17} className="text-[#66736b]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search crop, farmer, village" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a978f]" /></div><div className="flex gap-2 overflow-auto">{["All", "Vegetables", "Fruit", "Cereals"].map(item => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap border px-3 py-2 text-xs font-bold ${category === item ? "border-[#153e2a] bg-[#153e2a] text-white" : "border-[#cfd9d0] bg-[#fbfcfb] hover:bg-[#edf2ee]"}`}>{item}</button>)}</div></div>
    <p className="mb-4 text-xs text-[#66736b]"><strong className="text-[#102017]">{filtered.length} lots</strong> match your filters. Buyer cost and projected farmer payout remain visible.</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(lot => <LotCard key={lot.id} lot={lot} editable={isFarmer && lot.farmer === "Asha Naik"} onDetail={onDetail} onAction={isFarmer && lot.farmer === "Asha Naik" ? onEdit : onOffer} />)}</div>
  </>;
}

function DemandBoard({ requirements }: { requirements: Requirement[] }) {
  return <><PageTitle eyebrow="FPO operations" title="Buyer requirements" description="Prioritize verified demand by delivery time, supply fit, net farmer outcome, and shared-route potential—not just headline price." /><div className="card-surface overflow-hidden"><div className="hidden grid-cols-[1.15fr_.8fr_.8fr_.9fr_.6fr] gap-4 border-b border-[#dce4de] bg-[#edf2ee] px-5 py-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#65736a] sm:grid"><span>Buyer & requirement</span><span>Volume</span><span>Max price</span><span>Delivery</span><span>Status</span></div>{requirements.map(item => <div key={item.id} className="grid grid-cols-1 gap-3 border-b border-[#e1e7e2] px-5 py-4 text-sm sm:grid-cols-[1.15fr_.8fr_.8fr_.9fr_.6fr] sm:items-center sm:gap-4"><div><p className="font-bold">{item.product}</p><p className="mt-1 text-xs text-[#6b786f]">{item.buyer} · {item.buyerType}</p></div><span>{formatNumber(item.quantity)} kg</span><span>₹{item.maxPrice}/kg</span><span className="text-xs">{item.due}<br /><span className="text-[#6b786f]">{item.destination}</span></span><Pill className={pillTone(item.status)}>{item.status}</Pill></div>)}</div></>;
}

function SupplyAggregation({ lots, onApprove }: { lots: CropLot[]; onApprove: () => void }) {
  const tomatoLots = lots.filter(lot => lot.product === "Tomatoes");
  const total = tomatoLots.reduce((sum, lot) => sum + lot.quantity, 0);
  const weightedPrice = tomatoLots.reduce((sum, lot) => sum + lot.agreedPrice * lot.quantity, 0) / total;
  return <>
    <PageTitle eyebrow="FPO operations" title="Supply aggregation proposal" description="Combine small verified lots only when it improves farmer net earnings, buyer price, route efficiency, and delivery reliability." action={<Pill className="bg-[#f7e6a3] text-[#57440d]">Approval pending</Pill>} />
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><article className="card-surface overflow-hidden"><div className="bg-[#153e2a] p-6 text-white"><p className="eyebrow text-[#b9d8c6]">Proposed coordinated fulfillment</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><h2 className="text-3xl font-extrabold tracking-[-.06em]">1,500 kg tomatoes</h2><p className="text-sm text-[#d4e4da]">FreshBasket Kitchens · tomorrow 10:00</p></div><div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/15 pt-5"><div><p className="text-[10px] uppercase tracking-[.1em] text-[#aac8b5]">Farmers</p><p className="mt-1 text-xl font-bold">3</p></div><div><p className="text-[10px] uppercase tracking-[.1em] text-[#aac8b5]">Weighted price</p><p className="mt-1 text-xl font-bold">₹{formatNumber(weightedPrice, 1)}/kg</p></div><div><p className="text-[10px] uppercase tracking-[.1em] text-[#aac8b5]">Shared route</p><p className="mt-1 text-xl font-bold">42 km</p></div></div></div><div className="p-6"><div className="space-y-3">{tomatoLots.map(lot => <div key={lot.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[#e1e7e2] pb-3 text-sm"><div><p className="font-bold">{lot.farmer}</p><p className="mt-1 text-xs text-[#6b786f]">{lot.village} · {lot.quality} · harvest {lot.harvestDate}</p></div><span className="mono text-xs">{lot.quantity} kg</span><span className="mono text-xs">₹{lot.agreedPrice}/kg</span></div>)}</div><div className="mt-5 flex gap-2"><button onClick={onApprove} className="flex-1 bg-[#153e2a] py-3 text-xs font-bold text-white hover:bg-[#102017]">Approve proposal</button><button onClick={() => toast("Aggregation proposal prepared for member review.")} className="border border-[#ccd6ce] px-4 text-xs font-bold hover:bg-[#edf2ee]">Share</button></div></div></article><div className="space-y-5"><article className="card-surface p-5"><p className="eyebrow">Outcome comparison</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Consolidation improves both sides</h2><div className="mt-5 h-[220px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={optimizationData} barGap={6}><CartesianGrid stroke="#dce4de" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#65736a" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#65736a" }} /><Tooltip contentStyle={{ border: "1px solid #dce4de", borderRadius: 0, fontSize: 12 }} /><Bar dataKey="farmer" fill="#153e2a" name="Farmer net ₹/kg" /><Bar dataKey="buyer" fill="#c7847d" name="Buyer final ₹/kg" /></BarChart></ResponsiveContainer></div><p className="mt-2 text-xs leading-5 text-[#68766d]">Farmer net return rises by ₹0.50/kg while buyer final price falls by ₹2.50/kg compared with separate dispatch.</p></article><PriceBreakdown quantity={1500} agreedPrice={25.5} logistics={2.1} handling={.5} fee={.7} /></div></div>
  </>;
}

function OrderBoard({ role, orders, onDetail, onAdvance }: { role: MarketplaceRole; orders: FarmEasyOrder[]; onDetail: (order: FarmEasyOrder) => void; onAdvance: (order: FarmEasyOrder) => void }) {
  const title = role === "farmer" ? "Orders & payout" : role === "buyer" ? "Orders & delivery" : "Order coordination";
  return <><PageTitle eyebrow={roleLabels[role]} title={title} description="Follow each milestone from a transparent offer through collection, delivery, simulated payment, and final settlement." /><div className="space-y-4">{orders.map(order => { const completed = orderStages.indexOf(order.status); const canAdvance = role === "fpo" || (role === "buyer" && order.status === "Delivered"); return <article key={order.id} className="card-surface overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dce4de] px-5 py-4"><div><p className="mono text-[10px] text-[#69776e]">{order.id}</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">{order.product} · {formatNumber(order.quantity)} kg</h2><p className="mt-1 text-xs text-[#68766d]">Buyer: {order.buyers} · {order.route}</p></div><div className="flex flex-wrap gap-2"><Pill className={pillTone(order.status)}>{order.status}</Pill><Pill className={pillTone(order.payment)}>{order.payment}</Pill></div></div><div className="p-5"><div className="flex min-w-[620px] justify-between gap-2 overflow-auto pb-2">{orderStages.map((stage, index) => <div key={stage} className="relative flex min-w-[85px] flex-1 flex-col items-center gap-2 text-center"><span className={`z-10 grid h-7 w-7 place-items-center rounded-full border text-[10px] font-bold ${index <= completed ? "border-[#153e2a] bg-[#153e2a] text-white" : "border-[#cad5cd] bg-white text-[#79867e]"}`}>{index <= completed ? "✓" : index + 1}</span>{index < orderStages.length - 1 && <span className={`absolute left-[58%] top-3 h-px w-[84%] ${index < completed ? "bg-[#153e2a]" : "bg-[#dce4de]"}`} />}<span className={`text-[10px] leading-4 ${index === completed ? "font-bold text-[#153e2a]" : "text-[#6b786f]"}`}>{stage}</span></div>)}</div><div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[#e1e7e2] pt-4"><p className="text-xs text-[#65736a]"><strong className="text-[#102017]">Next:</strong> {order.status === "Delivered" ? "Buyer confirms receipt, then settlement is released." : order.status === "Settled" ? "Settlement is completed and recorded." : `Coordinate the next ${orderStages[completed + 1].toLowerCase()}.`}</p><div className="flex gap-2"><button onClick={() => onDetail(order)} className="border border-[#ccd6ce] px-3 py-2 text-xs font-bold hover:bg-[#edf2ee]">Price detail</button>{canAdvance && completed < orderStages.length - 1 && <button onClick={() => onAdvance(order)} className="bg-[#153e2a] px-3 py-2 text-xs font-bold text-white hover:bg-[#102017]">{role === "buyer" ? "Confirm receipt" : "Advance status"}</button>}</div></div></div></article>; })}</div></>;
}

function Intelligence({ onDetail }: { onDetail: (order: FarmEasyOrder) => void }) {
  const [strategy, setStrategy] = useState("Consolidate nearby supply");
  const regionalSignals = trpc.regionalSignals.current.useQuery();
  const options = [
    ["Sell now", 22.1, 28.9, "Low", "Recommended for freshness"],
    ["Store for 2 days", 21.7, 30, "Medium", "Storage and spoilage absorb the price lift"],
    ["Redirect to Buyer B", 21.9, 29.4, "Medium", "Higher route cost offsets headline price"],
    ["Consolidate nearby supply", 22.6, 28.4, "Low", "Shared collection lowers cost for both sides"],
  ] as const;
  const selected = options.find(option => option[0] === strategy) || options[0];
  return <>
    <PageTitle eyebrow="AI decision support" title="Recommendations you can inspect." description="Every estimate shows its relevant trade-offs. It is a decision aid, not an exact market forecast or an automatic trading instruction." action={<Pill className="bg-[#c9def3] text-[#173a54]">Prototype estimate</Pill>} />
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><article className="card-surface p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="eyebrow">Demand forecast · tomatoes</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.055em]">6,200 kg next week</h2><p className="mt-1 text-xs text-[#68766d]">Current demand 5,000 kg · expected increase 24%</p></div><div className="bg-[#c6ead6] px-3 py-2 text-right"><p className="eyebrow text-[9px]">Confidence</p><p className="mt-1 text-xl font-extrabold">87%</p></div></div><div className="mt-5 h-[225px]"><DemandChart data={demandData} /></div><div className="mt-4 border-t border-[#dce4de] pt-4"><p className="text-xs font-bold">Why this estimate?</p><p className="mt-2 text-xs leading-5 text-[#65736a]">The model weighs buyer requirements, prototype price history, harvest availability, seasonality, and regional weather. Volatility can reduce forecast reliability.</p></div></article><article className="card-surface p-5"><p className="eyebrow">Price intelligence</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Estimated price range</h2><div className="mt-5"><div className="flex items-end justify-between"><p className="text-4xl font-extrabold tracking-[-.07em]">₹24–₹27</p><p className="text-xs text-[#68766d]">per kg · tomatoes</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e6ece7]"><div className="h-full w-[67%] bg-[#153e2a]" /></div><div className="mt-2 flex justify-between text-[10px] text-[#68766d]"><span>Reference ₹24.2</span><span>Suggested ₹25.5</span><span>Buyer ceiling ₹27.0</span></div></div><div className="mt-6 bg-[#f7e6a3]/70 p-4"><p className="text-sm font-bold">Suggested price: ₹25.50/kg</p><p className="mt-1 text-xs leading-5 text-[#5b501e]">This range is an AI estimate based on available prototype and regional data, not a claim of an exact fair price.</p></div><button onClick={() => onDetail(initialOrders[0])} className="mt-5 flex items-center gap-1 text-xs font-bold underline underline-offset-4">See it in a transparent order <ChevronRight size={14} /></button></article></div>
    <article className="card-surface mt-5 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">External regional signals · Kolar</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Ground recommendations in current context</h2></div><Pill className={regionalSignals.isLoading ? "bg-[#f7e6a3] text-[#57440d]" : "bg-[#c6ead6] text-[#153e2a]"}>{regionalSignals.isLoading ? "Refreshing" : "Live connection"}</Pill></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="border border-[#dce4de] bg-[#f7f9f7] p-4"><div className="flex items-center gap-2"><CloudSun size={16} /><p className="text-sm font-bold">Regional weather</p></div>{regionalSignals.data?.weather ? <><p className="mt-3 text-2xl font-extrabold tracking-[-.06em]">{regionalSignals.data.weather.temperatureC}°C</p><p className="mt-1 text-xs text-[#65736a]">Rain {regionalSignals.data.weather.precipitationMm ?? 0} mm · wind {regionalSignals.data.weather.windKph ?? 0} km/h</p></> : <p className="mt-3 text-xs leading-5 text-[#65736a]">{regionalSignals.isLoading ? "Fetching the regional weather signal…" : "Weather signal is temporarily unavailable."}</p>}<p className="mt-4 mono text-[9px] uppercase tracking-[.07em] text-[#78857c]">{regionalSignals.data?.weather?.source || "Open-Meteo"}</p></div><div className="border border-[#dce4de] bg-[#f7f9f7] p-4"><div className="flex items-center gap-2"><LineChart size={16} /><p className="text-sm font-bold">Mandi price comparison</p></div>{regionalSignals.data?.mandi ? <><p className="mt-3 text-2xl font-extrabold tracking-[-.06em]">₹{regionalSignals.data.mandi.modalPerKg}/kg</p><p className="mt-1 text-xs text-[#65736a]">Range ₹{regionalSignals.data.mandi.lowPerKg}–₹{regionalSignals.data.mandi.highPerKg}/kg · {regionalSignals.data.mandi.date}</p></> : <p className="mt-3 text-xs leading-5 text-[#65736a]">{regionalSignals.isLoading ? "Checking the authorized mandi-price feed…" : "The live feed has no matching current Kolar tomato record. Prototype reference remains visible above."}</p>}<p className="mt-4 mono text-[9px] uppercase tracking-[.07em] text-[#78857c]">{regionalSignals.data?.mandi?.source || "CEDA Agmarknet connector"}</p></div></div>{regionalSignals.isError && <p className="mt-3 text-xs text-[#8b4942]">Regional signals could not be refreshed. The decision-support views retain their clearly labelled prototype estimates.</p>}</article>
    <article className="card-surface mt-7 p-5"><div className="flex flex-wrap justify-between gap-4"><div><p className="eyebrow">What-if profit simulator</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">Compare practical selling strategies</h2></div><p className="text-xs text-[#66736b]">Projected result for 800 kg Grade A tomatoes</p></div><div className="mt-5 grid gap-2 lg:grid-cols-4">{options.map(option => <button key={option[0]} onClick={() => setStrategy(option[0])} className={`border p-4 text-left transition-colors ${strategy === option[0] ? "border-[#153e2a] bg-[#153e2a] text-white" : "border-[#d4ddd6] bg-[#fbfcfb] hover:bg-[#edf2ee]"}`}><p className="text-sm font-bold">{option[0]}</p><p className={`mt-3 text-2xl font-extrabold tracking-[-.06em] ${strategy === option[0] ? "text-white" : "text-[#153e2a]"}`}>₹{option[1]}</p><p className={`mt-1 text-[10px] uppercase tracking-[.08em] ${strategy === option[0] ? "text-[#c6ead6]" : "text-[#68766d]"}`}>net farmer / kg</p><p className={`mt-3 text-xs ${strategy === option[0] ? "text-[#d7e5dc]" : "text-[#68766d]"}`}>Buyer ₹{option[2]}/kg · {option[3]} risk</p></button>)}</div><div className="mt-5 grid gap-4 border-t border-[#dce4de] pt-5 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-bold">Selected: {selected[0]}</p><p className="mt-1 text-xs leading-5 text-[#65736a]">{selected[4]}. Compare crop price, logistics, handling, and FPO service fee before accepting any option.</p></div><Pill className="h-fit bg-[#c6ead6] text-[#153e2a]">Best overall outcome</Pill></div></article>
  </>;
}

function Logistics({ role, onDetail }: { role: MarketplaceRole; onDetail: (order: FarmEasyOrder) => void }) {
  const eyebrow = role === "farmer" ? "Farmer collection" : role === "buyer" ? "Buyer delivery" : "FPO route planning";
  return <><PageTitle eyebrow={eyebrow} title="One coordinated route, three farms." description="This route context combines pickup points, buyer delivery, third-party vehicle capacity, and distance to lower avoidable transport cost." action={<button onClick={() => onDetail(initialOrders[0])} className="flex items-center gap-2 border border-[#ccd6ce] bg-[#fbfcfb] px-4 py-3 text-xs font-bold hover:bg-[#edf2ee]"><ReceiptText size={15} /> View settlement</button>} /><div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><article className="card-surface overflow-hidden"><RouteContextMap /></article><div className="space-y-4"><Stat label="Est. distance" value="42 km" detail="Kolar cluster → Indiranagar" tone="blue" /><Stat label="Transport saving" value="12%" detail="Vs. three separate trips" trend="down" /><article className="card-surface p-5"><p className="eyebrow">Third-party provider</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.05em]">GreenRoute Logistics</h2><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="bg-[#edf2ee] p-3"><p className="text-[#68766d]">Vehicle</p><p className="mt-1 font-bold">Mini truck</p></div><div className="bg-[#edf2ee] p-3"><p className="text-[#68766d]">Capacity</p><p className="mt-1 font-bold">1,800 kg</p></div></div><p className="mt-4 text-xs leading-5 text-[#65736a]">The capacity covers all stops, the sequence is 18 km shorter, and estimated cost is 12% lower.</p></article></div></div><article className="card-surface mt-5 p-5"><div className="grid gap-5 md:grid-cols-4">{[["Pickup 1", "Asha Naik · Kolar", "800 kg · 07:30"], ["Pickup 2", "Ravi Kumar · Malur", "450 kg · 08:20"], ["Pickup 3", "Latha Devi · Hoskote", "250 kg · 09:05"], ["Delivery", "FreshBasket · Indiranagar", "1,500 kg · 10:00"]].map(([label, name, detail]) => <div key={label}><p className="eyebrow">{label}</p><p className="mt-1 text-sm font-bold">{name}</p><p className="mt-1 text-xs text-[#68766d]">{detail}</p></div>)}</div></article></>;
}

function LotForm({ initial, onClose, onSave, onRemove }: { initial?: CropLot | null; onClose: () => void; onSave: (lot: CropLot) => void; onRemove: (lot: CropLot) => void }) {
  const [form, setForm] = useState({ product: initial?.product || "", quantity: initial?.quantity?.toString() || "", quality: initial?.quality || "Grade A", village: initial?.village || "Kolar", price: initial?.agreedPrice?.toString() || "25.5", harvest: initial?.harvestDate || "Tomorrow", availability: initial?.availability || "Available" });
  const update = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  function save(event: React.FormEvent) { event.preventDefault(); if (!form.product || !Number(form.quantity) || !Number(form.price)) { toast.error("Add a crop, quantity, and minimum price first."); return; } onSave({ id: initial?.id || `LOT-${Math.floor(80 + Math.random() * 19)}`, product: form.product, category: "Vegetables", quantity: Number(form.quantity), unit: "kg", farmer: "Asha Naik", village: form.village, harvestDate: form.harvest, quality: form.quality, availability: form.availability as CropLot["availability"], agreedPrice: Number(form.price), logistics: 2.2, handling: .5, fee: .7, distance: 42, verified: true }); }
  const fields: { label: string; field: keyof typeof form; placeholder: string }[] = [{ label: "Crop", field: "product", placeholder: "Tomatoes" }, { label: "Available quantity (kg)", field: "quantity", placeholder: "800" }, { label: "Quality / grade", field: "quality", placeholder: "Grade A" }, { label: "Farm location", field: "village", placeholder: "Kolar" }, { label: "Expected harvest", field: "harvest", placeholder: "Tomorrow" }, { label: "Minimum price (₹/kg)", field: "price", placeholder: "25.5" }];
  return <Modal onClose={onClose}><div className="flex items-start justify-between"><div><p className="eyebrow">Farmer crop lot</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.05em]">{initial ? "Manage crop lot" : "Publish a crop lot"}</h2></div><button aria-label="Close form" onClick={onClose} className="grid h-9 w-9 place-items-center border border-[#dce4de]"><X size={18} /></button></div><p className="mt-3 text-xs leading-5 text-[#68766d]">Your minimum price informs matching. Logistics, handling, and FPO fees remain itemized before any order is accepted.</p><form onSubmit={save}><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(item => <label key={item.field} className="text-xs font-bold">{item.label}<input value={form[item.field]} placeholder={item.placeholder} onChange={event => update(item.field, event.target.value)} className="mt-2 h-10 w-full border border-[#cfd9d0] bg-white px-3 text-sm font-normal outline-none focus:border-[#153e2a]" /></label>)}<label className="text-xs font-bold">Marketplace availability<select value={form.availability} onChange={event => update("availability", event.target.value)} className="mt-2 h-10 w-full border border-[#cfd9d0] bg-white px-3 text-sm font-normal outline-none focus:border-[#153e2a]"><option value="Available">Available</option><option value="Harvesting">Harvesting</option><option value="Reserved">Reserved</option></select></label></div><div className="mt-6 flex flex-wrap justify-between gap-2">{initial ? <button type="button" onClick={() => onRemove(initial)} className="border border-[#c7847d] px-4 py-2.5 text-xs font-bold text-[#8b4942] hover:bg-[#f8e9e6]">Remove lot</button> : <span />}<div className="flex gap-2"><button type="button" onClick={onClose} className="border border-[#ccd6ce] px-4 py-2.5 text-xs font-bold">Cancel</button><button className="bg-[#153e2a] px-4 py-2.5 text-xs font-bold text-white">{initial ? "Save changes" : "Publish lot"}</button></div></div></form></Modal>;
}

function RequirementForm({ onClose, onSave }: { onClose: () => void; onSave: (requirement: Requirement) => void }) {
  const [form, setForm] = useState({ product: "", quantity: "", quality: "Grade A", maxPrice: "", destination: "Bengaluru", due: "Tomorrow" });
  const update = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  function save(event: React.FormEvent) { event.preventDefault(); if (!form.product || !Number(form.quantity) || !Number(form.maxPrice)) { toast.error("Add a crop, quantity, and maximum price first."); return; } onSave({ id: `REQ-${120 + Math.floor(Math.random() * 60)}`, buyer: "FreshBasket Kitchens", buyerType: "Restaurant group", product: form.product, quantity: Number(form.quantity), quality: form.quality, maxPrice: Number(form.maxPrice), destination: form.destination, due: form.due, status: "Open" }); }
  const fields: { label: string; field: keyof typeof form; placeholder: string }[] = [{ label: "Crop", field: "product", placeholder: "Tomatoes" }, { label: "Quantity (kg)", field: "quantity", placeholder: "1500" }, { label: "Required quality", field: "quality", placeholder: "Grade A" }, { label: "Maximum price (₹/kg)", field: "maxPrice", placeholder: "31" }, { label: "Delivery location", field: "destination", placeholder: "Indiranagar, Bengaluru" }, { label: "Required delivery", field: "due", placeholder: "Tomorrow, 10:00" }];
  return <Modal onClose={onClose}><div className="flex items-start justify-between"><div><p className="eyebrow">Buyer requirement</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.05em]">Post buying need</h2></div><button aria-label="Close form" onClick={onClose} className="grid h-9 w-9 place-items-center border border-[#dce4de]"><X size={18} /></button></div><p className="mt-3 text-xs leading-5 text-[#68766d]">Your price ceiling is evaluated against transparent crop, logistics, handling, and FPO service costs. You receive a recommendation, not an automatic purchase.</p><form onSubmit={save}><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(item => <label key={item.field} className="text-xs font-bold">{item.label}<input value={form[item.field]} placeholder={item.placeholder} onChange={event => update(item.field, event.target.value)} className="mt-2 h-10 w-full border border-[#cfd9d0] bg-white px-3 text-sm font-normal outline-none focus:border-[#153e2a]" /></label>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="border border-[#ccd6ce] px-4 py-2.5 text-xs font-bold">Cancel</button><button className="bg-[#153e2a] px-4 py-2.5 text-xs font-bold text-white">Post requirement</button></div></form></Modal>;
}

function OfferForm({ lot, onClose, onSave }: { lot: CropLot; onClose: () => void; onSave: (offer: BuyerOffer) => void }) {
  const [quantity, setQuantity] = useState(lot.quantity.toString());
  const [price, setPrice] = useState(lot.agreedPrice.toString());
  function submit(event: React.FormEvent) { event.preventDefault(); if (!Number(quantity) || Number(quantity) > lot.quantity || !Number(price)) { toast.error("Enter a valid quantity within this crop lot and an offered crop price."); return; } onSave({ id: `OFF-${300 + Math.floor(Math.random() * 600)}`, lotId: lot.id, buyer: "FreshBasket Kitchens", product: lot.product, quantity: Number(quantity), offeredPrice: Number(price), status: "Pending", lot: { ...lot, quantity: Number(quantity) } }); }
  return <Modal onClose={onClose}><div className="flex items-start justify-between"><div><p className="eyebrow">Buyer offer</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.05em]">Offer for {lot.product}</h2></div><button aria-label="Close offer" onClick={onClose} className="grid h-9 w-9 place-items-center border border-[#dce4de]"><X size={18} /></button></div><p className="mt-3 text-xs leading-5 text-[#68766d]">The farmer receives this offer with the itemized settlement. It creates a tracked order only after the farmer accepts.</p><form onSubmit={submit}><div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs font-bold">Quantity (max {lot.quantity} kg)<input value={quantity} onChange={event => setQuantity(event.target.value)} className="mt-2 h-10 w-full border border-[#cfd9d0] bg-white px-3 text-sm font-normal outline-none" /></label><label className="text-xs font-bold">Offer crop price (₹/kg)<input value={price} onChange={event => setPrice(event.target.value)} className="mt-2 h-10 w-full border border-[#cfd9d0] bg-white px-3 text-sm font-normal outline-none" /></label></div><div className="mt-5"><PriceBreakdown quantity={Number(quantity) || 0} agreedPrice={Number(price) || 0} logistics={lot.logistics} handling={lot.handling} fee={lot.fee} compact /></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="border border-[#ccd6ce] px-4 py-2.5 text-xs font-bold">Cancel</button><button className="bg-[#153e2a] px-4 py-2.5 text-xs font-bold text-white">Send transparent offer</button></div></form></Modal>;
}

function NotificationPanel({ role, notifications, onClose, onRead }: { role: MarketplaceRole; notifications: ActivityNotification[]; onClose: () => void; onRead: () => void }) {
  const relevant = notifications.filter(item => item.role === role || item.role === "all");
  return <div className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-32px))] border border-[#dce4de] bg-[#fbfcfb] p-4 shadow-xl"><div className="flex justify-between"><div><p className="eyebrow">Activity</p><h3 className="mt-1 text-lg font-extrabold tracking-[-.05em]">Notifications</h3></div><button onClick={onClose} aria-label="Close notifications"><X size={17} /></button></div><div className="mt-4 space-y-1">{relevant.map(item => <div key={item.id} className={`border-l-2 px-3 py-3 ${item.read ? "border-[#dce4de]" : "border-[#4da673] bg-[#f2faf5]"}`}><div className="flex justify-between gap-3"><p className="text-xs font-bold leading-5">{item.title}</p>{!item.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#153e2a]" />}</div><p className="mt-1 text-[11px] leading-4 text-[#66736b]">{item.body}</p><p className="mt-2 mono text-[9px] text-[#89958d]">{item.time}</p></div>)}</div><button onClick={onRead} className="mt-4 w-full border border-[#ccd6ce] py-2 text-xs font-bold hover:bg-[#edf2ee]">Mark all as read</button></div>;
}

export default function Home() {
  const [role, setRole] = useState<MarketplaceRole>(() => (localStorage.getItem("farmeasy-demo-role") as MarketplaceRole) || "farmer");
  const [section, setSection] = useState<Section>("overview");
  const [lots, setLots] = useState<CropLot[]>(cropLots);
  const [requirements, setRequirements] = useState<Requirement[]>(buyerRequirements);
  const [orders, setOrders] = useState<FarmEasyOrder[]>(initialOrders);
  const [offers, setOffers] = useState<BuyerOffer[]>(initialBuyerOffers);
  const [farmerChecks, setFarmerChecks] = useState<FarmerVerification[]>([{ id: "FARMER-019", name: "Shreya Patel", village: "Vemgal", crops: "Green beans · 300 kg", status: "Pending" }, { id: "FARMER-021", name: "Mohan R.", village: "Chintamani", crops: "Onions · 650 kg", status: "Pending" }]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>(initialNotifications);
  const [detail, setDetail] = useState<CropLot | FarmEasyOrder | null>(null);
  const [editing, setEditing] = useState<CropLot | null | undefined>(undefined);
  const [offerLot, setOfferLot] = useState<CropLot | null>(null);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activityMutation = trpc.marketplace.recordActivity.useMutation();

  useEffect(() => { localStorage.setItem("farmeasy-demo-role", role); setSection("overview"); setNotificationsOpen(false); }, [role]);
  const navItems = navigation[role];
  const unread = notifications.filter(item => !item.read && (item.role === role || item.role === "all")).length;
  const mobileLabel = useMemo(() => navItems.find(item => item.id === section)?.label || "FarmEasy AI", [navItems, section]);

  const addNotification = (notification: Omit<ActivityNotification, "id" | "time" | "read">) => setNotifications(current => [{ ...notification, id: Date.now(), time: "Now", read: false }, ...current]);
  function recordActivity(actorRole: MarketplaceRole, eventType: "lot_published" | "lot_updated" | "lot_removed" | "farmer_verified" | "farmer_rejected" | "offer_created" | "offer_accepted" | "offer_rejected" | "aggregation_approved" | "order_advanced", referenceId: string, summary: string) { activityMutation.mutate({ actorRole, eventType, referenceId, summary }); }
  function saveLot(lot: CropLot) { const exists = lots.some(item => item.id === lot.id); setLots(current => current.some(item => item.id === lot.id) ? current.map(item => item.id === lot.id ? lot : item) : [lot, ...current]); setEditing(undefined); recordActivity("farmer", exists ? "lot_updated" : "lot_published", lot.id, `${lot.farmer} ${exists ? "updated" : "published"} ${lot.quantity} kg of ${lot.product}.`); addNotification({ role: "fpo", title: exists ? "Farmer crop lot updated" : "New farmer crop lot", body: `${lot.farmer} published ${lot.quantity} kg of ${lot.product} from ${lot.village}.`, tone: "mint" }); toast.success(`${lot.product} lot is now visible to verified marketplace participants.`); }
  function removeLot(lot: CropLot) { setLots(current => current.filter(item => item.id !== lot.id)); setEditing(undefined); recordActivity("farmer", "lot_removed", lot.id, `${lot.farmer} removed ${lot.id}.`); toast.success(`${lot.id} was removed from marketplace availability.`); }
  function saveRequirement(requirement: Requirement) { setRequirements(current => [requirement, ...current]); setRequirementOpen(false); addNotification({ role: "fpo", title: "New buyer requirement", body: `${requirement.buyer} needs ${requirement.quantity} kg of ${requirement.product}.`, tone: "blue" }); toast.success("Requirement posted. FarmEasy AI will compare verified supply and route options."); }
  function makeOffer(lot: CropLot) { setOfferLot(lot); }
  function saveOffer(offer: BuyerOffer) { setOffers(current => [offer, ...current]); setOfferLot(null); recordActivity("buyer", "offer_created", offer.id, `${offer.buyer} offered ₹${offer.offeredPrice}/kg for ${offer.quantity} kg of ${offer.product}.`); addNotification({ role: "farmer", title: `New offer for ${offer.product}`, body: `${offer.buyer} offered ₹${offer.offeredPrice}/kg for ${offer.quantity} kg from ${offer.lotId}. Review the settlement.`, tone: "mint" }); toast.success(`Offer ${offer.id} was sent to the farmer with full settlement details.`); }
  function decideOffer(offer: BuyerOffer, decision: "Accepted" | "Rejected") { setOffers(current => current.map(item => item.id === offer.id ? { ...item, status: decision } : item)); if (decision === "Accepted") setLots(current => current.map(item => item.id === offer.lotId ? { ...item, availability: "Reserved" } : item)); recordActivity("farmer", decision === "Accepted" ? "offer_accepted" : "offer_rejected", offer.id, `Asha Naik ${decision.toLowerCase()} ${offer.id}.`); addNotification({ role: "buyer", title: `${offer.id} ${decision.toLowerCase()}`, body: decision === "Accepted" ? "The crop lot is reserved and order coordination can begin." : "The farmer declined this offer. Browse comparable verified lots.", tone: decision === "Accepted" ? "mint" : "pink" }); toast.success(`Offer ${offer.id} ${decision.toLowerCase()}.`); }
  function approve() { setRequirements(current => current.map(item => item.id === "REQ-108" ? { ...item, status: "Confirmed" } : item)); recordActivity("fpo", "aggregation_approved", "REQ-108", "FPO approved tomato aggregation for the FreshBasket requirement."); addNotification({ role: "all", title: "Tomato aggregation approved", body: "ORD-2048 is ready for third-party collection coordination.", tone: "blue" }); toast.success("Aggregation approved. Farmers and buyer have been notified."); }
  function verifyFarmer(farmer: FarmerVerification, status: "Verified" | "Rejected") { setFarmerChecks(current => current.map(item => item.id === farmer.id ? { ...item, status } : item)); recordActivity("fpo", status === "Verified" ? "farmer_verified" : "farmer_rejected", farmer.id, `${farmer.name} was ${status.toLowerCase()} by the FPO.`); toast.success(`${farmer.name} marked ${status.toLowerCase()}.`); }
  function advance(order: FarmEasyOrder) { const index = orderStages.indexOf(order.status); const status = orderStages[Math.min(index + 1, orderStages.length - 1)]; const payment = status === "Settled" ? "Settled" : status === "Delivered" ? "Delivery confirmed" : order.payment; setOrders(current => current.map(item => item.id === order.id ? { ...item, status, payment } : item)); recordActivity(role, "order_advanced", order.id, `${order.id} advanced to ${status}.`); addNotification({ role: "all", title: `${order.id}: ${status}`, body: status === "Settled" ? "Transparent settlement is complete and farmer payout is recorded." : `The workflow has advanced to ${status.toLowerCase()}.`, tone: "blue" }); toast.success(`${order.id} advanced to ${status}.`); }
  function content() { if (section === "market") return <Market role={role} lots={lots} requirements={requirements} onDetail={setDetail} onOffer={makeOffer} onEdit={setEditing} onCreateLot={() => setEditing(null)} onCreateRequirement={() => setRequirementOpen(true)} />; if (section === "operations") return <SupplyAggregation lots={lots} onApprove={approve} />; if (section === "orders") return <OrderBoard role={role} orders={orders} onDetail={setDetail} onAdvance={advance} />; if (section === "intelligence") return <Intelligence onDetail={setDetail} />; if (section === "logistics") return <Logistics role={role} onDetail={setDetail} />; if (role === "farmer") return <FarmerOverview lots={lots} orders={orders} offers={offers} onNavigate={setSection} onDetail={setDetail} onEdit={setEditing} onOfferDecision={decideOffer} />; if (role === "buyer") return <BuyerOverview lots={lots} onNavigate={setSection} onOffer={makeOffer} onDetail={setDetail} />; return <FpoOverview lots={lots} onNavigate={setSection} onApprove={approve} farmerChecks={farmerChecks} onVerification={verifyFarmer} />; }

  return <div className="app-shell soft-grid text-[#102017]"><header className="sticky top-0 z-20 border-b border-[#dce4de] bg-[#f4f6f4]/90 backdrop-blur"><div className="app-container flex h-16 items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setMobileNavOpen(current => !current)} className="grid h-9 w-9 place-items-center border border-[#cfd9d0] bg-[#fbfcfb] lg:hidden" aria-label="Open navigation"><Menu size={18} /></button><button onClick={() => setSection("overview")} className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center bg-[#153e2a] text-white"><Sprout size={18} /></span><span className="text-lg font-extrabold tracking-[-.065em]">FarmEasy <i className="font-light not-italic">AI</i></span></button><span className="hidden border-l border-[#cfd9d0] pl-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#6e7c73] sm:block">Transparent digital FPO</span></div><div className="relative flex items-center gap-2"><button onClick={() => setNotificationsOpen(current => !current)} aria-label="Open notifications" className="relative grid h-9 w-9 place-items-center border border-[#cfd9d0] bg-[#fbfcfb] hover:bg-[#edf2ee]"><Bell size={17} />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c7847d] px-1 text-[9px] font-bold text-white">{unread}</span>}</button>{notificationsOpen && <NotificationPanel role={role} notifications={notifications} onClose={() => setNotificationsOpen(false)} onRead={() => setNotifications(current => current.map(item => ({ ...item, read: true })))} />}<div className="relative"><select aria-label="Select demonstration role" value={role} onChange={event => setRole(event.target.value as MarketplaceRole)} className="h-9 appearance-none border border-[#cfd9d0] bg-[#fbfcfb] py-0 pl-3 pr-8 text-xs font-bold outline-none hover:bg-[#edf2ee]"><option value="farmer">Farmer</option><option value="fpo">Admin / FPO</option><option value="buyer">Buyer</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2 top-3" /></div></div></div></header><div className="app-container flex gap-8 py-7"><aside className={`${mobileNavOpen ? "block" : "hidden"} fixed inset-x-3 top-[76px] z-20 border border-[#dce4de] bg-[#fbfcfb] p-3 shadow-xl lg:static lg:block lg:w-52 lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}><div className="lg:sticky lg:top-24"><div className="mb-4 border-b border-[#dce4de] pb-4"><p className="eyebrow">Role demo</p><p className="mt-1 text-sm font-extrabold">{roleLabels[role]}</p><p className="mt-1 text-[11px] leading-4 text-[#6b786f]">Role-specific actions and data remain separate in this prototype.</p></div><nav className="space-y-1">{navItems.map(item => { const Icon = item.icon; const isActive = section === item.id; return <button key={item.id} onClick={() => { setSection(item.id); setMobileNavOpen(false); }} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-bold transition-colors ${isActive ? "bg-[#153e2a] text-white" : "text-[#526057] hover:bg-[#e8eee9]"}`}><Icon size={16} /><span>{item.label}</span>{isActive && <ChevronRight size={14} className="ml-auto" />}</button>; })}</nav><div className="mt-6 hidden border-t border-[#dce4de] pt-5 lg:block"><p className="eyebrow">Guiding metric</p><p className="mt-2 text-sm font-bold leading-5">Farmer net earnings <span className="text-[#217444]">↑</span><br />Buyer price <span className="text-[#217444]">↓</span></p></div></div></aside><main className="min-w-0 flex-1 pb-12"><div className="mb-5 flex items-center justify-between border-b border-[#dce4de] pb-3 lg:hidden"><p className="eyebrow">{mobileLabel}</p><p className="mono text-[10px] text-[#69776e]">DEMO / 01</p></div>{content()}</main></div>{detail && <SettlementModal item={detail} onClose={() => setDetail(null)} />}{editing !== undefined && <LotForm initial={editing} onClose={() => setEditing(undefined)} onSave={saveLot} onRemove={removeLot} />}{offerLot && <OfferForm lot={offerLot} onClose={() => setOfferLot(null)} onSave={saveOffer} />}{requirementOpen && <RequirementForm onClose={() => setRequirementOpen(false)} onSave={saveRequirement} />}</div>;
}
