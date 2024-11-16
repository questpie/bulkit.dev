CREATE TABLE IF NOT EXISTS "stock_image_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"external_product_id" text,
	"display_name" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"max_posts" integer NOT NULL,
	"max_posts_per_month" integer NOT NULL,
	"max_channels" integer NOT NULL,
	"allowedPlatforms" text[],
	"monthly_ai_credits" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"external_subscription_id" text,
	"external_variant_id" text,
	"status" text NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_global_ai_provider_id_ai_text_provider_id_fk";
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "collect_metrics_intervals" jsonb DEFAULT '[{"maxAge":3600000,"delay":600000},{"maxAge":14400000,"delay":1800000},{"maxAge":28800000,"delay":3600000},{"maxAge":86400000,"delay":7200000},{"maxAge":172800000,"delay":14400000},{"maxAge":259200000,"delay":28800000},{"maxAge":604800000,"delay":43200000},{"maxAge":31557600000,"delay":86400000},{"maxAge":63115200000}]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "external_customer_id" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "caption" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_organization_id_index" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "global_ai_provider_id";