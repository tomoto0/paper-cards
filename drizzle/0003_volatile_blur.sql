CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paperId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE no action ON UPDATE no action;