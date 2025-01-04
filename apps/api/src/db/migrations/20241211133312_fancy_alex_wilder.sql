ALTER TABLE "resources" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "resources" DROP COLUMN IF EXISTS "cleanup_at";