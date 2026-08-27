CREATE TABLE `marketplaceEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorRole` enum('farmer','buyer','fpo') NOT NULL,
	`eventType` enum('lot_published','lot_updated','lot_removed','farmer_verified','farmer_rejected','offer_created','offer_accepted','offer_rejected','aggregation_approved','order_advanced') NOT NULL,
	`referenceId` varchar(80) NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplaceEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `marketplaceEvents_reference_idx` ON `marketplaceEvents` (`referenceId`);--> statement-breakpoint
CREATE INDEX `marketplaceEvents_actor_idx` ON `marketplaceEvents` (`actorRole`);