CREATE UNIQUE INDEX IF NOT EXISTS "user_organizations_user_id_organization_id_index" ON "user_organizations" USING btree ("user_id","organization_id");