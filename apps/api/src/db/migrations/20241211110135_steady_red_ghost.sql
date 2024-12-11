ALTER TABLE "resources" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "size_in_bytes" bigint;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "resources" DROP COLUMN IF EXISTS "cleanup_at";