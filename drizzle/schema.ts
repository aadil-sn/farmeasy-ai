import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "farmer", "buyer", "fpo"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const fpoOrganizations = mysqlTable("fpoOrganizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  coordinatorUserId: int("coordinatorUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const farmerProfiles = mysqlTable("farmerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  fpoId: int("fpoId").references(() => fpoOrganizations.id),
  phone: varchar("phone", { length: 32 }),
  location: varchar("location", { length: 255 }).notNull(),
  farmDetails: text("farmDetails"),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("farmerProfiles_fpoId_idx").on(table.fpoId)]);

export const buyerProfiles = mysqlTable("buyerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  buyerType: mysqlEnum("buyerType", ["consumer", "retailer", "restaurant", "supermarket", "food_processor", "wholesaler", "institutional"]).notNull(),
  companyName: varchar("companyName", { length: 160 }),
  phone: varchar("phone", { length: 32 }),
  location: varchar("location", { length: 255 }).notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  unit: varchar("unit", { length: 32 }).default("kg").notNull(),
  shelfLifeDays: int("shelfLifeDays"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const farmerProducts = mysqlTable("farmerProducts", {
  id: int("id").autoincrement().primaryKey(),
  farmerId: int("farmerId").notNull().references(() => farmerProfiles.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }).default("kg").notNull(),
  expectedHarvestAt: timestamp("expectedHarvestAt"),
  location: varchar("location", { length: 255 }).notNull(),
  qualityGrade: varchar("qualityGrade", { length: 80 }).notNull(),
  minimumPricePerUnit: decimal("minimumPricePerUnit", { precision: 10, scale: 2 }).notNull(),
  availabilityStatus: mysqlEnum("availabilityStatus", ["available", "reserved", "harvesting", "unavailable"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("farmerProducts_productId_idx").on(table.productId), index("farmerProducts_farmerId_idx").on(table.farmerId)]);

export const buyerRequirements = mysqlTable("buyerRequirements", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull().references(() => buyerProfiles.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  requiredQuality: varchar("requiredQuality", { length: 80 }),
  maximumPricePerUnit: decimal("maximumPricePerUnit", { precision: 10, scale: 2 }).notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
  requiredDeliveryAt: timestamp("requiredDeliveryAt"),
  additionalRequirements: text("additionalRequirements"),
  status: mysqlEnum("status", ["open", "matched", "confirmed", "fulfilled", "cancelled"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("buyerRequirements_productId_idx").on(table.productId), index("buyerRequirements_buyerId_idx").on(table.buyerId)]);

export const aggregatedSupplies = mysqlTable("aggregatedSupplies", {
  id: int("id").autoincrement().primaryKey(),
  fpoId: int("fpoId").notNull().references(() => fpoOrganizations.id),
  productId: int("productId").notNull().references(() => products.id),
  totalQuantity: decimal("totalQuantity", { precision: 12, scale: 2 }).notNull(),
  weightedPricePerUnit: decimal("weightedPricePerUnit", { precision: 10, scale: 2 }).notNull(),
  qualitySummary: varchar("qualitySummary", { length: 255 }),
  status: mysqlEnum("status", ["proposed", "approved", "matched", "completed", "rejected"]).default("proposed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("aggregatedSupplies_fpoId_idx").on(table.fpoId), index("aggregatedSupplies_productId_idx").on(table.productId)]);

export const aggregatedSupplyItems = mysqlTable("aggregatedSupplyItems", {
  id: int("id").autoincrement().primaryKey(),
  aggregatedSupplyId: int("aggregatedSupplyId").notNull().references(() => aggregatedSupplies.id),
  farmerProductId: int("farmerProductId").notNull().references(() => farmerProducts.id),
  contributedQuantity: decimal("contributedQuantity", { precision: 12, scale: 2 }).notNull(),
  agreedPricePerUnit: decimal("agreedPricePerUnit", { precision: 10, scale: 2 }).notNull(),
}, table => [index("aggregatedSupplyItems_aggregation_idx").on(table.aggregatedSupplyId)]);

export const logisticsProviders = mysqlTable("logisticsProviders", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  contactName: varchar("contactName", { length: 120 }),
  phone: varchar("phone", { length: 32 }),
  serviceAreas: text("serviceAreas"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  logisticsProviderId: int("logisticsProviderId").notNull().references(() => logisticsProviders.id),
  vehicleType: varchar("vehicleType", { length: 80 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 32 }),
  capacityKg: decimal("capacityKg", { precision: 12, scale: 2 }).notNull(),
  active: int("active").default(1).notNull(),
}, table => [index("vehicles_providerId_idx").on(table.logisticsProviderId)]);

export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  logisticsProviderId: int("logisticsProviderId").references(() => logisticsProviders.id),
  vehicleId: int("vehicleId").references(() => vehicles.id),
  pickupPoints: text("pickupPoints").notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
  estimatedDistanceKm: decimal("estimatedDistanceKm", { precision: 10, scale: 2 }).notNull(),
  estimatedCost: decimal("estimatedCost", { precision: 12, scale: 2 }).notNull(),
  estimatedDurationMinutes: int("estimatedDurationMinutes"),
  rationale: text("rationale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  fpoId: int("fpoId").notNull().references(() => fpoOrganizations.id),
  buyerId: int("buyerId").notNull().references(() => buyerProfiles.id),
  buyerRequirementId: int("buyerRequirementId").references(() => buyerRequirements.id),
  routeId: int("routeId").references(() => routes.id),
  status: mysqlEnum("status", ["offer_received", "confirmed", "collection_scheduled", "picked_up", "in_transit", "delivered", "settled", "cancelled"]).default("offer_received").notNull(),
  totalQuantity: decimal("totalQuantity", { precision: 12, scale: 2 }).notNull(),
  totalAgreedCropValue: decimal("totalAgreedCropValue", { precision: 14, scale: 2 }).notNull(),
  totalLogisticsCost: decimal("totalLogisticsCost", { precision: 14, scale: 2 }).notNull(),
  totalHandlingCost: decimal("totalHandlingCost", { precision: 14, scale: 2 }).notNull(),
  totalServiceFee: decimal("totalServiceFee", { precision: 14, scale: 2 }).notNull(),
  buyerFinalPayment: decimal("buyerFinalPayment", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("orders_buyerId_idx").on(table.buyerId), index("orders_fpoId_idx").on(table.fpoId), index("orders_status_idx").on(table.status)]);

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  farmerProductId: int("farmerProductId").notNull().references(() => farmerProducts.id),
  farmerId: int("farmerId").notNull().references(() => farmerProfiles.id),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  agreedPricePerUnit: decimal("agreedPricePerUnit", { precision: 10, scale: 2 }).notNull(),
  logisticsCost: decimal("logisticsCost", { precision: 12, scale: 2 }).notNull(),
  handlingCost: decimal("handlingCost", { precision: 12, scale: 2 }).notNull(),
  serviceFee: decimal("serviceFee", { precision: 12, scale: 2 }).notNull(),
  farmerPayout: decimal("farmerPayout", { precision: 12, scale: 2 }).notNull(),
}, table => [index("orderItems_orderId_idx").on(table.orderId), index("orderItems_farmerId_idx").on(table.farmerId)]);

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique().references(() => orders.id),
  status: mysqlEnum("status", ["pending", "paid", "held", "delivery_confirmed", "settled", "refunded"]).default("pending").notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  simulatedReference: varchar("simulatedReference", { length: 80 }),
  paidAt: timestamp("paidAt"),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  farmerId: int("farmerId").references(() => farmerProfiles.id),
  transactionType: mysqlEnum("transactionType", ["buyer_payment", "farmer_payout", "service_fee", "logistics_payment", "refund"]).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("transactions_orderId_idx").on(table.orderId), index("transactions_farmerId_idx").on(table.farmerId)]);

export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique().references(() => orders.id),
  logisticsProviderId: int("logisticsProviderId").references(() => logisticsProviders.id),
  vehicleId: int("vehicleId").references(() => vehicles.id),
  routeId: int("routeId").references(() => routes.id),
  status: mysqlEnum("status", ["assigned", "pickup_scheduled", "picked_up", "in_transit", "arriving", "delivered", "confirmed"]).default("assigned").notNull(),
  pickupScheduledAt: timestamp("pickupScheduledAt"),
  deliveredAt: timestamp("deliveredAt"),
  trackingNote: text("trackingNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const priceData = mysqlTable("priceData", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  region: varchar("region", { length: 160 }).notNull(),
  source: varchar("source", { length: 160 }).notNull(),
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }).notNull(),
  lowPricePerUnit: decimal("lowPricePerUnit", { precision: 10, scale: 2 }),
  highPricePerUnit: decimal("highPricePerUnit", { precision: 10, scale: 2 }),
  observedAt: timestamp("observedAt").notNull(),
}, table => [index("priceData_productId_idx").on(table.productId)]);

export const demandForecasts = mysqlTable("demandForecasts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  region: varchar("region", { length: 160 }).notNull(),
  currentDemandQuantity: decimal("currentDemandQuantity", { precision: 12, scale: 2 }).notNull(),
  predictedDemandQuantity: decimal("predictedDemandQuantity", { precision: 12, scale: 2 }).notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }).notNull(),
  forecastFor: timestamp("forecastFor").notNull(),
  rationale: text("rationale").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("demandForecasts_productId_idx").on(table.productId)]);

export const aiRecommendations = mysqlTable("aiRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  farmerProductId: int("farmerProductId").references(() => farmerProducts.id),
  buyerRequirementId: int("buyerRequirementId").references(() => buyerRequirements.id),
  recommendationType: mysqlEnum("recommendationType", ["buyer_match", "price", "sell_time", "route", "aggregation", "demand"]).notNull(),
  recommendation: text("recommendation").notNull(),
  rationale: text("rationale").notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  acceptedAt: timestamp("acceptedAt"),
  rejectedAt: timestamp("rejectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  eventType: mysqlEnum("eventType", ["buyer_match", "price_recommendation", "demand_increase", "order", "payment", "pickup", "dispatch", "delivery", "logistics_issue"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("notifications_userId_idx").on(table.userId)]);

export const serviceFees = mysqlTable("serviceFees", {
  id: int("id").autoincrement().primaryKey(),
  fpoId: int("fpoId").notNull().references(() => fpoOrganizations.id),
  name: varchar("name", { length: 120 }).notNull(),
  feePerUnit: decimal("feePerUnit", { precision: 10, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  activeFrom: timestamp("activeFrom").defaultNow().notNull(),
  activeTo: timestamp("activeTo"),
});

export const marketplaceEvents = mysqlTable("marketplaceEvents", {
  id: int("id").autoincrement().primaryKey(),
  actorRole: mysqlEnum("actorRole", ["farmer", "buyer", "fpo"]).notNull(),
  eventType: mysqlEnum("eventType", ["lot_published", "lot_updated", "lot_removed", "farmer_verified", "farmer_rejected", "offer_created", "offer_accepted", "offer_rejected", "aggregation_approved", "order_advanced"]).notNull(),
  referenceId: varchar("referenceId", { length: 80 }).notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("marketplaceEvents_reference_idx").on(table.referenceId), index("marketplaceEvents_actor_idx").on(table.actorRole)]);

export type FarmerProfile = typeof farmerProfiles.$inferSelect;
export type BuyerProfile = typeof buyerProfiles.$inferSelect;
export type FarmerProduct = typeof farmerProducts.$inferSelect;
export type BuyerRequirement = typeof buyerRequirements.$inferSelect;
export type FarmEasyOrder = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type MarketplaceEvent = typeof marketplaceEvents.$inferSelect;
