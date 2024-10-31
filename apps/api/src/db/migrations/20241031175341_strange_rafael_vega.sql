CREATE TYPE "public"."app_settings_id" AS ENUM('app-settings');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_text_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"model" text NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"id" "app_settings_id" PRIMARY KEY DEFAULT 'app-settings' NOT NULL,
	"global_ai_provider_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"settings" jsonb NOT NULL,
	"post_limit" integer NOT NULL,
	"post_limit_window_seconds" integer NOT NULL,
	"max_post_length" integer NOT NULL,
	"max_media_per_post" integer NOT NULL,
	"max_media_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "super_admins" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"device_fingerprint" text NOT NULL,
	"device_info" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text,
	"platform" text NOT NULL,
	"image_url" text,
	"url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"organization_id" text NOT NULL,
	"social_media_integration_id" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_media_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_account_id" text NOT NULL,
	"platform" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expiry" timestamp with time zone,
	"scope" text,
	"additional_data" jsonb DEFAULT '{}'::jsonb,
	"organization_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_metrics_history" (
	"id" text PRIMARY KEY NOT NULL,
	"scheduled_post_id" text NOT NULL,
	"likes" integer NOT NULL,
	"comments" integer NOT NULL,
	"shares" integer NOT NULL,
	"impressions" integer NOT NULL,
	"reach" integer NOT NULL,
	"clicks" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reel_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"resource_id" text,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regular_post_media" (
	"id" text PRIMARY KEY NOT NULL,
	"regular_post_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regular_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"failure_reason" text,
	"parent_post_id" text,
	"parent_post_settings" jsonb,
	"repost_settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"resource_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread_media" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_post_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"order" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"is_external" boolean DEFAULT false NOT NULL,
	"location" text NOT NULL,
	"type" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"organization_id" text NOT NULL,
	"cleanup_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_global_ai_provider_id_ai_text_provider_id_fk" FOREIGN KEY ("global_ai_provider_id") REFERENCES "public"."ai_text_provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "super_admins" ADD CONSTRAINT "super_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channels" ADD CONSTRAINT "channels_social_media_integration_id_social_media_integrations_id_fk" FOREIGN KEY ("social_media_integration_id") REFERENCES "public"."social_media_integrations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_metrics_history" ADD CONSTRAINT "post_metrics_history_scheduled_post_id_scheduled_posts_id_fk" FOREIGN KEY ("scheduled_post_id") REFERENCES "public"."scheduled_posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "regular_post_media" ADD CONSTRAINT "regular_post_media_regular_post_id_regular_posts_id_fk" FOREIGN KEY ("regular_post_id") REFERENCES "public"."regular_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "regular_post_media" ADD CONSTRAINT "regular_post_media_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_parent_post_id_scheduled_posts_id_fk" FOREIGN KEY ("parent_post_id") REFERENCES "public"."scheduled_posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_media" ADD CONSTRAINT "thread_media_thread_post_id_thread_posts_id_fk" FOREIGN KEY ("thread_post_id") REFERENCES "public"."thread_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_media" ADD CONSTRAINT "thread_media_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_posts" ADD CONSTRAINT "thread_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "platform_settings_platform_index" ON "app_platform_settings" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_index" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channels_platform_index" ON "channels" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channels_status_index" ON "channels" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channels_organization_id_index" ON "channels" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "channels_social_media_integration_id_index" ON "channels" USING btree ("social_media_integration_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_media_integrations_organization_id_index" ON "social_media_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_media_integrations_platform_index" ON "social_media_integrations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_media_integrations_platform_account_id_index" ON "social_media_integrations" USING btree ("platform_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "social_media_integrations_platform_account_id_platform_organization_id_index" ON "social_media_integrations" USING btree ("platform_account_id","platform","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_post_id_index" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_user_id_index" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_organization_id_index" ON "comments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_organizations_user_id_index" ON "user_organizations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_organizations_organization_id_index" ON "user_organizations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_organizations_role_index" ON "user_organizations" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_metrics_history_scheduled_post_id_index" ON "post_metrics_history" USING btree ("scheduled_post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_metrics_history_created_at_index" ON "post_metrics_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_organization_id_index" ON "posts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_type_index" ON "posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reel_posts_post_id_index" ON "reel_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reel_posts_resource_id_index" ON "reel_posts" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regular_post_media_regular_post_id_index" ON "regular_post_media" USING btree ("regular_post_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regular_post_media_regular_post_id_order_index" ON "regular_post_media" USING btree ("regular_post_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regular_posts_post_id_index" ON "regular_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_posts_post_id_index" ON "scheduled_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_posts_channel_id_index" ON "scheduled_posts" USING btree ("channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_posts_post_id_channel_id_index" ON "scheduled_posts" USING btree ("post_id","channel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_posts_post_id_index" ON "story_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_media_thread_post_id_index" ON "thread_media" USING btree ("thread_post_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "thread_media_thread_post_id_order_index" ON "thread_media" USING btree ("thread_post_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_posts_post_id_index" ON "thread_posts" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "thread_posts_order_post_id_index" ON "thread_posts" USING btree ("order","post_id");