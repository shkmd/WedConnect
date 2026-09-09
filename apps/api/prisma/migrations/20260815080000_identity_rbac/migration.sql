CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETION_REQUESTED', 'DELETED');
CREATE TYPE "RoleCode" AS ENUM ('CUSTOMER', 'VENDOR_OWNER', 'VENDOR_STAFF', 'VERIFIER', 'MODERATOR', 'SUPER_ADMIN');
CREATE TYPE "ScopeType" AS ENUM ('PLATFORM', 'VENDOR_BUSINESS');
CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'WITHDRAWN');

CREATE TABLE "app_users" (
  "id" UUID PRIMARY KEY,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "display_name" VARCHAR(120),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_users_auth_user_fk" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE
);
CREATE TABLE "roles" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "code" "RoleCode" NOT NULL UNIQUE, "name" VARCHAR(80) NOT NULL, "description" VARCHAR(300), "system" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "permissions" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "code" VARCHAR(120) NOT NULL UNIQUE, "description" VARCHAR(300), "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "role_permissions" ("role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE, "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE, PRIMARY KEY ("role_id", "permission_id"));
CREATE TABLE "user_roles" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "app_users"("id") ON DELETE CASCADE, "role_id" UUID NOT NULL REFERENCES "roles"("id"), "scope_type" "ScopeType" NOT NULL DEFAULT 'PLATFORM', "scope_id" UUID, "granted_by" UUID, "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "revoked_at" TIMESTAMPTZ);
CREATE UNIQUE INDEX "user_roles_scope_key" ON "user_roles" ("user_id", "role_id", "scope_type", COALESCE("scope_id", '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX "user_roles_active_idx" ON "user_roles" ("user_id", "revoked_at");
CREATE TABLE "consent_records" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "app_users"("id"), "purpose" VARCHAR(120) NOT NULL, "action" "ConsentAction" NOT NULL, "notice_version" VARCHAR(40) NOT NULL, "notice_text_hash" VARCHAR(64) NOT NULL, "notice_text" TEXT NOT NULL, "recipient_id" UUID, "shared_fields" TEXT[] NOT NULL DEFAULT '{}', "source" VARCHAR(40) NOT NULL, "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "supersedes_id" UUID REFERENCES "consent_records"("id"));
CREATE INDEX "consent_user_purpose_idx" ON "consent_records" ("user_id", "purpose", "occurred_at");
CREATE TABLE "otp_security_events" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "subject_hash" VARCHAR(64) NOT NULL, "ip_hash" VARCHAR(64), "event" VARCHAR(40) NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "otp_subject_time_idx" ON "otp_security_events" ("subject_hash", "created_at");
CREATE INDEX "otp_ip_time_idx" ON "otp_security_events" ("ip_hash", "created_at");
CREATE TABLE "admin_mfa_policies" ("user_id" UUID PRIMARY KEY REFERENCES "app_users"("id") ON DELETE CASCADE, "required" BOOLEAN NOT NULL DEFAULT true, "verified_at" TIMESTAMPTZ, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);

INSERT INTO "roles" ("code", "name") VALUES
('CUSTOMER','Customer'),('VENDOR_OWNER','Vendor owner'),('VENDOR_STAFF','Vendor staff'),('VERIFIER','Verifier'),('MODERATOR','Moderator'),('SUPER_ADMIN','Super administrator');

INSERT INTO "permissions" ("code", "description") VALUES
('profile.self.read','Read own profile'),('profile.self.update','Update own profile'),('consent.self.manage','Manage own consent'),('vendor.business.manage','Manage scoped vendor business'),('verification.assigned.review','Review assigned verification cases'),('moderation.case.manage','Manage moderation cases'),('platform.admin','Manage platform configuration');

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r JOIN "permissions" p ON
  (r.code IN ('CUSTOMER','VENDOR_OWNER','VENDOR_STAFF','VERIFIER','MODERATOR','SUPER_ADMIN') AND p.code IN ('profile.self.read','profile.self.update','consent.self.manage')) OR
  (r.code IN ('VENDOR_OWNER','SUPER_ADMIN') AND p.code='vendor.business.manage') OR
  (r.code IN ('VERIFIER','SUPER_ADMIN') AND p.code='verification.assigned.review') OR
  (r.code IN ('MODERATOR','SUPER_ADMIN') AND p.code='moderation.case.manage') OR
  (r.code='SUPER_ADMIN' AND p.code='platform.admin');

ALTER TABLE "app_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "roles", "permissions", "role_permissions", "user_roles", "consent_records", "otp_security_events", "admin_mfa_policies" FROM anon, authenticated;
GRANT SELECT, UPDATE ON "app_users" TO authenticated;
CREATE POLICY "users_read_self" ON "app_users" FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_update_self" ON "app_users" FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
