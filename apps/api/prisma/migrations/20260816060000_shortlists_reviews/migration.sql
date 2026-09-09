CREATE TYPE "ReviewStatus" AS ENUM ('PENDING','APPROVED','REJECTED','HIDDEN');

CREATE TABLE "customer_shortlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "customer_id" uuid NOT NULL REFERENCES "app_users"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL, "event_label" varchar(120), "city_label" varchar(120),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(), "updated_at" timestamptz(6) NOT NULL DEFAULT now()
);
CREATE INDEX "customer_shortlists_customer_id_updated_at_idx" ON "customer_shortlists"("customer_id","updated_at");

CREATE TABLE "customer_shortlist_items" (
  "shortlist_id" uuid NOT NULL REFERENCES "customer_shortlists"("id") ON DELETE CASCADE,
  "business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,
  "note" varchar(500), "created_at" timestamptz(6) NOT NULL DEFAULT now(), PRIMARY KEY("shortlist_id","business_id")
);
CREATE INDEX "customer_shortlist_items_business_id_idx" ON "customer_shortlist_items"("business_id");

CREATE TABLE "shortlist_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "shortlist_id" uuid NOT NULL REFERENCES "customer_shortlists"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL UNIQUE, "expires_at" timestamptz(6), "revoked_at" timestamptz(6), "created_at" timestamptz(6) NOT NULL DEFAULT now()
);
CREATE INDEX "shortlist_shares_shortlist_id_created_at_idx" ON "shortlist_shares"("shortlist_id","created_at");

CREATE TABLE "vendor_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "customer_id" uuid NOT NULL REFERENCES "app_users"("id") ON DELETE RESTRICT,
  "business_id" uuid NOT NULL REFERENCES "vendor_businesses"("id") ON DELETE CASCADE,
  "lead_recipient_id" uuid NOT NULL UNIQUE REFERENCES "lead_recipients"("id") ON DELETE RESTRICT,
  "rating" integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5), "title" varchar(120) NOT NULL, "body" varchar(2000) NOT NULL,
  "event_date" date, "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING', "vendor_reply" varchar(1200),
  "vendor_replied_at" timestamptz(6), "published_at" timestamptz(6), "created_at" timestamptz(6) NOT NULL DEFAULT now(), "updated_at" timestamptz(6) NOT NULL DEFAULT now()
);
CREATE INDEX "vendor_reviews_business_id_status_published_at_idx" ON "vendor_reviews"("business_id","status","published_at");
CREATE INDEX "vendor_reviews_customer_id_created_at_idx" ON "vendor_reviews"("customer_id","created_at");

CREATE TABLE "review_moderation_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "review_id" uuid NOT NULL REFERENCES "vendor_reviews"("id") ON DELETE CASCADE,
  "actor_user_id" uuid NOT NULL REFERENCES "app_users"("id") ON DELETE RESTRICT, "from_status" "ReviewStatus" NOT NULL,
  "to_status" "ReviewStatus" NOT NULL, "reason" varchar(1000), "created_at" timestamptz(6) NOT NULL DEFAULT now()
);
CREATE INDEX "review_moderation_events_review_id_created_at_idx" ON "review_moderation_events"("review_id","created_at");

INSERT INTO "permissions"("code","description") VALUES ('review.moderate','Moderate customer reviews') ON CONFLICT ("code") DO NOTHING;
INSERT INTO "role_permissions"("role_id","permission_id")
SELECT r.id,p.id FROM "roles" r CROSS JOIN "permissions" p WHERE r.code IN ('MODERATOR','SUPER_ADMIN') AND p.code='review.moderate' ON CONFLICT DO NOTHING;

ALTER TABLE "customer_shortlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_shortlist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shortlist_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendor_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_moderation_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "customer_shortlists","customer_shortlist_items","shortlist_shares","vendor_reviews","review_moderation_events" FROM anon, authenticated;
