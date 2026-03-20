CREATE TABLE `meals` (
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
	`anabolicScore` int NOT NULL DEFAULT 0,
	`imageUri` text,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(512) NOT NULL,
	`platform` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`targetWeight` int DEFAULT 180,
	`currentWeight` int DEFAULT 180,
	`calorieGoal` int DEFAULT 2500,
	`proteinGoal` int DEFAULT 200,
	`carbsGoal` int DEFAULT 250,
	`fatGoal` int DEFAULT 80,
	`unit` varchar(10) DEFAULT 'lbs',
	`profilePhotoUri` text,
	`subscription` varchar(32) DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `weightLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` float NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weightLog_id` PRIMARY KEY(`id`)
);
