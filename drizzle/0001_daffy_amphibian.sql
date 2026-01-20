CREATE TABLE `keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keywords_id` PRIMARY KEY(`id`),
	CONSTRAINT `keywords_keyword_unique` UNIQUE(`keyword`)
);
--> statement-breakpoint
CREATE TABLE `papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`arxivId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`titleJa` text,
	`authors` text NOT NULL,
	`abstract` text NOT NULL,
	`abstractJa` text,
	`journal` varchar(255),
	`publishedAt` bigint,
	`arxivUrl` varchar(512) NOT NULL,
	`pdfUrl` varchar(512),
	`keyword` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `papers_id` PRIMARY KEY(`id`),
	CONSTRAINT `papers_arxivId_unique` UNIQUE(`arxivId`)
);
