CREATE TYPE "ProfessionalType" AS ENUM ('FREELANCER','SOLE_PROPRIETOR','STUDIO','AGENCY','REGISTERED_COMPANY','VENUE_PROPERTY','PERFORMER','BOUTIQUE_RENTAL');
CREATE TYPE "VendorStatus" AS ENUM ('DRAFT','SUBMITTED','CHANGES_REQUESTED','APPROVED','REJECTED','SUSPENDED');
CREATE TYPE "VendorMemberRole" AS ENUM ('OWNER','STAFF');
CREATE TYPE "PricingType" AS ENUM ('FIXED','STARTING_FROM','CUSTOM_QUOTE');

CREATE TABLE "vendor_businesses" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(160) NOT NULL, "slug" varchar(180) NOT NULL UNIQUE,
 "professional_type" "ProfessionalType" NOT NULL, "description" text, "years_experience" integer,
 "languages" text[] NOT NULL DEFAULT '{}', "base_city_id" uuid REFERENCES "locations"("id") ON DELETE RESTRICT,
 "outstation_available" boolean NOT NULL DEFAULT false, "status" "VendorStatus" NOT NULL DEFAULT 'DRAFT',
 "onboarding_step" integer NOT NULL DEFAULT 2, "completion_percent" integer NOT NULL DEFAULT 10,
 "submitted_at" timestamptz, "approved_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "vendor_years_check" CHECK (years_experience IS NULL OR years_experience BETWEEN 0 AND 100),
 CONSTRAINT "vendor_progress_check" CHECK (completion_percent BETWEEN 0 AND 100 AND onboarding_step BETWEEN 1 AND 14)
);
CREATE INDEX "vendor_businesses_status_updated_idx" ON "vendor_businesses"("status","updated_at");

CREATE TABLE "vendor_members" ("business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,"user_id" uuid NOT NULL REFERENCES "app_users"("id") ON DELETE RESTRICT,"role" "VendorMemberRole" NOT NULL DEFAULT 'STAFF',"active" boolean NOT NULL DEFAULT true,"created_at" timestamptz NOT NULL DEFAULT now(),PRIMARY KEY("business_id","user_id"));
CREATE INDEX "vendor_members_user_active_idx" ON "vendor_members"("user_id","active");
CREATE TABLE "vendor_categories" ("business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,"category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,"is_primary" boolean NOT NULL DEFAULT false,PRIMARY KEY("business_id","category_id"));
CREATE UNIQUE INDEX "vendor_categories_one_primary_idx" ON "vendor_categories"("business_id") WHERE is_primary;
CREATE TABLE "vendor_service_areas" ("business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,"location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE RESTRICT,PRIMARY KEY("business_id","location_id"));
CREATE TABLE "vendor_services" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,"category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,"name" varchar(140) NOT NULL,"description" varchar(1000),"pricing_type" "PricingType" NOT NULL,"price" decimal(12,2),"active" boolean NOT NULL DEFAULT true,"sort_order" integer NOT NULL DEFAULT 0,CONSTRAINT "vendor_service_price_check" CHECK ((pricing_type='CUSTOM_QUOTE' AND price IS NULL) OR (pricing_type<>'CUSTOM_QUOTE' AND price IS NOT NULL AND price>=0)));
CREATE INDEX "vendor_services_business_active_sort_idx" ON "vendor_services"("business_id","active","sort_order");
CREATE TABLE "vendor_packages" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,"service_id" uuid REFERENCES "vendor_services"("id") ON DELETE SET NULL,"name" varchar(140) NOT NULL,"description" varchar(1200),"price" decimal(12,2) NOT NULL CHECK(price>=0),"inclusions" text[] NOT NULL DEFAULT '{}',"active" boolean NOT NULL DEFAULT true);
CREATE INDEX "vendor_packages_business_active_idx" ON "vendor_packages"("business_id","active");
CREATE TABLE "vendor_terms_acceptances" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE RESTRICT,"user_id" uuid NOT NULL REFERENCES "app_users"("id") ON DELETE RESTRICT,"version" varchar(40) NOT NULL,"terms_hash" varchar(64) NOT NULL,"accepted_at" timestamptz NOT NULL DEFAULT now(),UNIQUE("business_id","version"));
CREATE TABLE "vendor_moderation_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE RESTRICT,"actor_user_id" uuid NOT NULL,"from_status" "VendorStatus" NOT NULL,"to_status" "VendorStatus" NOT NULL,"reason" varchar(1000),"created_at" timestamptz NOT NULL DEFAULT now());
CREATE INDEX "vendor_moderation_events_business_created_idx" ON "vendor_moderation_events"("business_id","created_at");

ALTER TABLE "vendor_businesses" ENABLE ROW LEVEL SECURITY; ALTER TABLE "vendor_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_categories" ENABLE ROW LEVEL SECURITY; ALTER TABLE "vendor_service_areas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_services" ENABLE ROW LEVEL SECURITY; ALTER TABLE "vendor_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_terms_acceptances" ENABLE ROW LEVEL SECURITY; ALTER TABLE "vendor_moderation_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "vendor_businesses","vendor_members","vendor_categories","vendor_service_areas","vendor_services","vendor_packages","vendor_terms_acceptances","vendor_moderation_events" FROM anon,authenticated;

INSERT INTO "permissions" (code,description) VALUES ('vendor.moderate','Review and decide vendor onboarding submissions') ON CONFLICT(code) DO NOTHING;
INSERT INTO "role_permissions" (role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN ('VERIFIER','MODERATOR','SUPER_ADMIN') AND p.code='vendor.moderate' ON CONFLICT DO NOTHING;
