CREATE TABLE `gains_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` float NOT NULL,
	`protein` float NOT NULL,
	`calories` int NOT NULL,
	`daysTracked` int NOT NULL,
	`anabolicScore` int NOT NULL,
	`subscription` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gains_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`name` varchar(255) NOT NULL,
	`calories` int NOT NULL DEFAULT 0,
	`protein` float NOT NULL DEFAULT 0,
	`carbs` float NOT NULL DEFAULT 0,
	`fat` float NOT NULL DEFAULT 0,
	`sugar` float NOT NULL DEFAULT 0,
	`anabolicScore` int NOT NULL DEFAULT 0,
	`imageUri` text,
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meal_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','essential','pro','elite') NOT NULL DEFAULT 'free',
	`productId` varchar(128),
	`transactionId` varchar(256),
	`originalTransactionId` varchar(256),
	`platform` enum('ios','android','web') DEFAULT 'ios',
	`purchaseDate` timestamp,
	`expiresDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetWeight` float,
	`currentWeight` float,
	`calorieGoal` int,
	`proteinGoal` int,
	`carbsGoal` int,
	`fatGoal` int,
	`unit` enum('lbs','kg') DEFAULT 'lbs',
	`heightFt` int,
	`heightIn` int,
	`goal` varchar(32),
	`trainingDays` int,
	`dietaryRestrictions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` float NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_logs_id` PRIMARY KEY(`id`)
);
