CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`frame` integer,
	`body` text,
	`drawing` text,
	`has_drawing` integer DEFAULT false NOT NULL,
	`resolved` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `version`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `note_version_idx` ON `note` (`version_id`);--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shot` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'WIP' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shot_project_idx` ON `shot` (`project_id`);--> statement-breakpoint
CREATE TABLE `version` (
	`id` text PRIMARY KEY NOT NULL,
	`shot_id` text NOT NULL,
	`number` integer NOT NULL,
	`label` text,
	`status` text DEFAULT 'NEEDS_REVIEW' NOT NULL,
	`source_type` text NOT NULL,
	`source_path` text NOT NULL,
	`seq_pattern` text,
	`frame_start` integer DEFAULT 1 NOT NULL,
	`frame_end` integer DEFAULT 1 NOT NULL,
	`fps` integer DEFAULT 24 NOT NULL,
	`nuke_script_path` text,
	`rendered_at` integer,
	`proxy_status` text DEFAULT 'pending' NOT NULL,
	`proxy_error` text,
	`frame_count` integer DEFAULT 0 NOT NULL,
	`has_mp4` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shot_id`) REFERENCES `shot`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `version_shot_idx` ON `version` (`shot_id`);