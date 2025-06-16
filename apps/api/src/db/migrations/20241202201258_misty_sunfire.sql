CREATE TABLE IF NOT EXISTS "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"parent_id" varchar,
	"amount" integer NOT NULL,
	"description" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_text_provider" ADD COLUMN "prompt_token_to_credit_coefficient" real DEFAULT 0.0001 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_text_provider" ADD COLUMN "output_token_to_credit_coefficient" real DEFAULT 0.0002 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_text_provider" ADD COLUMN "capabilities" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_text_provider" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_text_provider" ADD COLUMN "is_default_for" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_parent_id_credit_transactions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."credit_transactions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transactions_organization_id_index" ON "credit_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_text_provider_is_default_for_index" ON "ai_text_provider" USING btree ("is_default_for") WHERE cardinality("ai_text_provider"."is_default_for") > 0;