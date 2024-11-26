ALTER TABLE "plans" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "priority_type" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "features" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "highlight_features" jsonb DEFAULT '[]'::jsonb NOT NULL;