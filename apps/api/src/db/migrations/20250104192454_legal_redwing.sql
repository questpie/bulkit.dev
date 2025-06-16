CREATE TABLE IF NOT EXISTS "ai_image_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"model" text NOT NULL,
	"api_key" text NOT NULL,
	"capabilities" text[] NOT NULL,
	"input_mapping" jsonb NOT NULL,
	"default_input" jsonb,
	"image" real DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
