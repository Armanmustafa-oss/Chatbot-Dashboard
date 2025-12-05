CREATE TABLE `dailyAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalMessages` int NOT NULL DEFAULT 0,
	`positiveCount` int NOT NULL DEFAULT 0,
	`neutralCount` int NOT NULL DEFAULT 0,
	`negativeCount` int NOT NULL DEFAULT 0,
	`avgResponseTimeMs` int DEFAULT 0,
	`avgRating` int,
	`uniqueStudents` int DEFAULT 0,
	CONSTRAINT `dailyAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hourlyPeakTimes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`hour` int NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `hourlyPeakTimes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`query` text NOT NULL,
	`response` text,
	`sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
	`category` varchar(128),
	`responseTimeMs` int,
	`isResolved` boolean DEFAULT true,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queryCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `queryCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `queryCategories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` varchar(64) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`department` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_studentId_unique` UNIQUE(`studentId`)
);
