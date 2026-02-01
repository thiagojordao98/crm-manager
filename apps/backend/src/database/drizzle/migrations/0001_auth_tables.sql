CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);

-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" text;

-- Create indexes
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_idx" ON "refresh_tokens" ("token");
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" ("email");
CREATE INDEX IF NOT EXISTS "invitations_token_idx" ON "invitations" ("token");
CREATE INDEX IF NOT EXISTS "invitations_organization_id_idx" ON "invitations" ("organization_id");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_organization_id_idx" ON "users" ("organization_id");
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");

-- Add foreign key constraints
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" 
	FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" 
	FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
