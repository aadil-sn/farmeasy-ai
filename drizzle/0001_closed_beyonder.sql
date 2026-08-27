CREATE TABLE `aggregatedSupplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fpoId` int NOT NULL,
	`productId` int NOT NULL,
	`totalQuantity` decimal(12,2) NOT NULL,
	`weightedPricePerUnit` decimal(10,2) NOT NULL,
	`qualitySummary` varchar(255),
	`status` enum('proposed','approved','matched','completed','rejected') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aggregatedSupplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aggregatedSupplyItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aggregatedSupplyId` int NOT NULL,
	`farmerProductId` int NOT NULL,
	`contributedQuantity` decimal(12,2) NOT NULL,
	`agreedPricePerUnit` decimal(10,2) NOT NULL,
	CONSTRAINT `aggregatedSupplyItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`farmerProductId` int,
	`buyerRequirementId` int,
	`recommendationType` enum('buyer_match','price','sell_time','route','aggregation','demand') NOT NULL,
	`recommendation` text NOT NULL,
	`rationale` text NOT NULL,
	`confidenceScore` decimal(5,2),
	`acceptedAt` timestamp,
	`rejectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buyerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`buyerType` enum('consumer','retailer','restaurant','supermarket','food_processor','wholesaler','institutional') NOT NULL,
	`companyName` varchar(160),
	`phone` varchar(32),
	`location` varchar(255) NOT NULL,
	`deliveryLocation` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buyerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `buyerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `buyerRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`requiredQuality` varchar(80),
	`maximumPricePerUnit` decimal(10,2) NOT NULL,
	`deliveryLocation` varchar(255) NOT NULL,
	`requiredDeliveryAt` timestamp,
	`additionalRequirements` text,
	`status` enum('open','matched','confirmed','fulfilled','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buyerRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`logisticsProviderId` int,
	`vehicleId` int,
	`routeId` int,
	`status` enum('assigned','pickup_scheduled','picked_up','in_transit','arriving','delivered','confirmed') NOT NULL DEFAULT 'assigned',
	`pickupScheduledAt` timestamp,
	`deliveredAt` timestamp,
	`trackingNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `demandForecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`region` varchar(160) NOT NULL,
	`currentDemandQuantity` decimal(12,2) NOT NULL,
	`predictedDemandQuantity` decimal(12,2) NOT NULL,
	`confidenceScore` decimal(5,2) NOT NULL,
	`forecastFor` timestamp NOT NULL,
	`rationale` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `demandForecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farmerProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmerId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'kg',
	`expectedHarvestAt` timestamp,
	`location` varchar(255) NOT NULL,
	`qualityGrade` varchar(80) NOT NULL,
	`minimumPricePerUnit` decimal(10,2) NOT NULL,
	`availabilityStatus` enum('available','reserved','harvesting','unavailable') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmerProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farmerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fpoId` int,
	`phone` varchar(32),
	`location` varchar(255) NOT NULL,
	`farmDetails` text,
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `farmerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `farmerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fpoOrganizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`location` varchar(255) NOT NULL,
	`coordinatorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fpoOrganizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logisticsProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`contactName` varchar(120),
	`phone` varchar(32),
	`serviceAreas` text,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logisticsProviders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('buyer_match','price_recommendation','demand_increase','order','payment','pickup','dispatch','delivery','logistics_issue') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`farmerProductId` int NOT NULL,
	`farmerId` int NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`agreedPricePerUnit` decimal(10,2) NOT NULL,
	`logisticsCost` decimal(12,2) NOT NULL,
	`handlingCost` decimal(12,2) NOT NULL,
	`serviceFee` decimal(12,2) NOT NULL,
	`farmerPayout` decimal(12,2) NOT NULL,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fpoId` int NOT NULL,
	`buyerId` int NOT NULL,
	`buyerRequirementId` int,
	`routeId` int,
	`status` enum('offer_received','confirmed','collection_scheduled','picked_up','in_transit','delivered','settled','cancelled') NOT NULL DEFAULT 'offer_received',
	`totalQuantity` decimal(12,2) NOT NULL,
	`totalAgreedCropValue` decimal(14,2) NOT NULL,
	`totalLogisticsCost` decimal(14,2) NOT NULL,
	`totalHandlingCost` decimal(14,2) NOT NULL,
	`totalServiceFee` decimal(14,2) NOT NULL,
	`buyerFinalPayment` decimal(14,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('pending','paid','held','delivery_confirmed','settled','refunded') NOT NULL DEFAULT 'pending',
	`amount` decimal(14,2) NOT NULL,
	`simulatedReference` varchar(80),
	`paidAt` timestamp,
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `priceData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`region` varchar(160) NOT NULL,
	`source` varchar(160) NOT NULL,
	`pricePerUnit` decimal(10,2) NOT NULL,
	`lowPricePerUnit` decimal(10,2),
	`highPricePerUnit` decimal(10,2),
	`observedAt` timestamp NOT NULL,
	CONSTRAINT `priceData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`category` varchar(120) NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'kg',
	`shelfLifeDays` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logisticsProviderId` int,
	`vehicleId` int,
	`pickupPoints` text NOT NULL,
	`deliveryLocation` varchar(255) NOT NULL,
	`estimatedDistanceKm` decimal(10,2) NOT NULL,
	`estimatedCost` decimal(12,2) NOT NULL,
	`estimatedDurationMinutes` int,
	`rationale` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceFees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fpoId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`feePerUnit` decimal(10,2),
	`percentage` decimal(5,2),
	`activeFrom` timestamp NOT NULL DEFAULT (now()),
	`activeTo` timestamp,
	CONSTRAINT `serviceFees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`farmerId` int,
	`transactionType` enum('buyer_payment','farmer_payout','service_fee','logistics_payment','refund') NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logisticsProviderId` int NOT NULL,
	`vehicleType` varchar(80) NOT NULL,
	`registrationNumber` varchar(32),
	`capacityKg` decimal(12,2) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','farmer','buyer','fpo') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `aggregatedSupplies` ADD CONSTRAINT `as_fpo_fk` FOREIGN KEY (`fpoId`) REFERENCES `fpoOrganizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aggregatedSupplies` ADD CONSTRAINT `as_product_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aggregatedSupplyItems` ADD CONSTRAINT `asi_supply_fk` FOREIGN KEY (`aggregatedSupplyId`) REFERENCES `aggregatedSupplies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aggregatedSupplyItems` ADD CONSTRAINT `asi_lot_fk` FOREIGN KEY (`farmerProductId`) REFERENCES `farmerProducts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiRecommendations` ADD CONSTRAINT `air_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiRecommendations` ADD CONSTRAINT `air_lot_fk` FOREIGN KEY (`farmerProductId`) REFERENCES `farmerProducts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiRecommendations` ADD CONSTRAINT `air_requirement_fk` FOREIGN KEY (`buyerRequirementId`) REFERENCES `buyerRequirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buyerProfiles` ADD CONSTRAINT `bp_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buyerRequirements` ADD CONSTRAINT `br_buyer_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyerProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buyerRequirements` ADD CONSTRAINT `br_product_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `delivery_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `delivery_provider_fk` FOREIGN KEY (`logisticsProviderId`) REFERENCES `logisticsProviders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `delivery_vehicle_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `delivery_route_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `demandForecasts` ADD CONSTRAINT `df_product_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farmerProducts` ADD CONSTRAINT `fp_farmer_fk` FOREIGN KEY (`farmerId`) REFERENCES `farmerProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farmerProducts` ADD CONSTRAINT `fp_product_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farmerProfiles` ADD CONSTRAINT `fprofile_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farmerProfiles` ADD CONSTRAINT `fprofile_fpo_fk` FOREIGN KEY (`fpoId`) REFERENCES `fpoOrganizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fpoOrganizations` ADD CONSTRAINT `fpo_coordinator_fk` FOREIGN KEY (`coordinatorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notification_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `oi_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `oi_lot_fk` FOREIGN KEY (`farmerProductId`) REFERENCES `farmerProducts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItems` ADD CONSTRAINT `oi_farmer_fk` FOREIGN KEY (`farmerId`) REFERENCES `farmerProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `order_fpo_fk` FOREIGN KEY (`fpoId`) REFERENCES `fpoOrganizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `order_buyer_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyerProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `order_requirement_fk` FOREIGN KEY (`buyerRequirementId`) REFERENCES `buyerRequirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `order_route_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payment_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceData` ADD CONSTRAINT `price_product_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `route_provider_fk` FOREIGN KEY (`logisticsProviderId`) REFERENCES `logisticsProviders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `route_vehicle_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serviceFees` ADD CONSTRAINT `fee_fpo_fk` FOREIGN KEY (`fpoId`) REFERENCES `fpoOrganizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `txn_farmer_fk` FOREIGN KEY (`farmerId`) REFERENCES `farmerProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicle_provider_fk` FOREIGN KEY (`logisticsProviderId`) REFERENCES `logisticsProviders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `aggregatedSupplies_fpoId_idx` ON `aggregatedSupplies` (`fpoId`);--> statement-breakpoint
CREATE INDEX `aggregatedSupplies_productId_idx` ON `aggregatedSupplies` (`productId`);--> statement-breakpoint
CREATE INDEX `aggregatedSupplyItems_aggregation_idx` ON `aggregatedSupplyItems` (`aggregatedSupplyId`);--> statement-breakpoint
CREATE INDEX `buyerRequirements_productId_idx` ON `buyerRequirements` (`productId`);--> statement-breakpoint
CREATE INDEX `buyerRequirements_buyerId_idx` ON `buyerRequirements` (`buyerId`);--> statement-breakpoint
CREATE INDEX `demandForecasts_productId_idx` ON `demandForecasts` (`productId`);--> statement-breakpoint
CREATE INDEX `farmerProducts_productId_idx` ON `farmerProducts` (`productId`);--> statement-breakpoint
CREATE INDEX `farmerProducts_farmerId_idx` ON `farmerProducts` (`farmerId`);--> statement-breakpoint
CREATE INDEX `farmerProfiles_fpoId_idx` ON `farmerProfiles` (`fpoId`);--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `orderItems_orderId_idx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `orderItems_farmerId_idx` ON `orderItems` (`farmerId`);--> statement-breakpoint
CREATE INDEX `orders_buyerId_idx` ON `orders` (`buyerId`);--> statement-breakpoint
CREATE INDEX `orders_fpoId_idx` ON `orders` (`fpoId`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `priceData_productId_idx` ON `priceData` (`productId`);--> statement-breakpoint
CREATE INDEX `transactions_orderId_idx` ON `transactions` (`orderId`);--> statement-breakpoint
CREATE INDEX `transactions_farmerId_idx` ON `transactions` (`farmerId`);--> statement-breakpoint
CREATE INDEX `vehicles_providerId_idx` ON `vehicles` (`logisticsProviderId`);
