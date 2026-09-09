CREATE TYPE "LocationType" AS ENUM ('COUNTRY','STATE','DISTRICT','CITY','LOCALITY');
CREATE TYPE "CategoryFieldType" AS ENUM ('TEXT','NUMBER','BOOLEAN','SINGLE_SELECT','MULTI_SELECT');
CREATE TYPE "DefinitionStatus" AS ENUM ('DRAFT','ACTIVE','ARCHIVED');

CREATE TABLE "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "parent_id" uuid REFERENCES "locations"("id") ON DELETE RESTRICT,
  "type" "LocationType" NOT NULL, "name" varchar(120) NOT NULL, "slug" varchar(140) NOT NULL UNIQUE,
  "country_code" varchar(2), "timezone" varchar(80), "postal_codes" text[] NOT NULL DEFAULT '{}',
  "latitude" decimal(9,6), "longitude" decimal(9,6), "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
  "centroid" geography(Point,4326) GENERATED ALWAYS AS (CASE WHEN longitude IS NULL OR latitude IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision),4326)::geography END) STORED,
  CONSTRAINT "locations_coordinates_check" CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);
CREATE INDEX "locations_parent_type_active_sort_idx" ON "locations"("parent_id","type","active","sort_order");
CREATE INDEX "locations_centroid_gist_idx" ON "locations" USING gist ("centroid");

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "parent_id" uuid REFERENCES "categories"("id") ON DELETE RESTRICT,
  "name" varchar(120) NOT NULL, "slug" varchar(140) NOT NULL UNIQUE, "description" varchar(500),
  "active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "categories_parent_active_sort_idx" ON "categories"("parent_id","active","sort_order");

CREATE TABLE "category_field_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
  "key" varchar(80) NOT NULL, "label" varchar(120) NOT NULL, "field_type" "CategoryFieldType" NOT NULL,
  "required" boolean NOT NULL DEFAULT false, "filterable" boolean NOT NULL DEFAULT false, "comparable" boolean NOT NULL DEFAULT false,
  "unit" varchar(40), "config" jsonb NOT NULL DEFAULT '{}', "version" integer NOT NULL DEFAULT 1,
  "status" "DefinitionStatus" NOT NULL DEFAULT 'DRAFT', "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("category_id","key","version")
);
CREATE INDEX "category_fields_category_status_idx" ON "category_field_definitions"("category_id","status");
CREATE UNIQUE INDEX "category_fields_one_active_idx" ON "category_field_definitions"("category_id","key") WHERE "status" = 'ACTIVE';

ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "category_field_definitions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "locations", "categories", "category_field_definitions" FROM anon, authenticated;

INSERT INTO "permissions" ("code","description") VALUES
 ('locations.manage','Create and update the supported location hierarchy'),
 ('taxonomy.manage','Create categories and version dynamic field definitions') ON CONFLICT ("code") DO NOTHING;
INSERT INTO "role_permissions" ("role_id","permission_id")
SELECT r.id,p.id FROM "roles" r CROSS JOIN "permissions" p
WHERE r.code='SUPER_ADMIN' AND p.code IN ('locations.manage','taxonomy.manage') ON CONFLICT DO NOTHING;

INSERT INTO "locations" (id,parent_id,type,name,slug,country_code,timezone,latitude,longitude,sort_order) VALUES
('10000000-0000-4000-8000-000000000001',NULL,'COUNTRY','India','india','IN','Asia/Kolkata',20.593684,78.962880,1),
('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','STATE','Tamil Nadu','tamil-nadu','IN','Asia/Kolkata',11.127123,78.656891,1),
('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','DISTRICT','Coimbatore District','coimbatore-district','IN','Asia/Kolkata',11.016844,76.955832,1),
('10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000003','CITY','Coimbatore','coimbatore','IN','Asia/Kolkata',11.016844,76.955832,1),
('10000000-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000004','LOCALITY','R. S. Puram','rs-puram','IN','Asia/Kolkata',11.008700,76.950500,1),
('10000000-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000004','LOCALITY','Saibaba Colony','saibaba-colony','IN','Asia/Kolkata',11.026100,76.942700,2),
('10000000-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000004','LOCALITY','Gandhipuram','gandhipuram','IN','Asia/Kolkata',11.017600,76.967400,3),
('10000000-0000-4000-8000-000000000104','10000000-0000-4000-8000-000000000004','LOCALITY','Peelamedu','peelamedu','IN','Asia/Kolkata',11.029800,77.021800,4),
('10000000-0000-4000-8000-000000000105','10000000-0000-4000-8000-000000000004','LOCALITY','Saravanampatti','saravanampatti','IN','Asia/Kolkata',11.080000,76.998000,5),
('10000000-0000-4000-8000-000000000106','10000000-0000-4000-8000-000000000004','LOCALITY','Vadavalli','vadavalli','IN','Asia/Kolkata',11.025900,76.903800,6),
('10000000-0000-4000-8000-000000000107','10000000-0000-4000-8000-000000000004','LOCALITY','Singanallur','singanallur','IN','Asia/Kolkata',11.000700,77.029600,7),
('10000000-0000-4000-8000-000000000108','10000000-0000-4000-8000-000000000004','LOCALITY','Race Course','race-course','IN','Asia/Kolkata',11.001600,76.977400,8),
('10000000-0000-4000-8000-000000000109','10000000-0000-4000-8000-000000000004','LOCALITY','Town Hall','town-hall','IN','Asia/Kolkata',10.992500,76.961400,9),
('10000000-0000-4000-8000-000000000110','10000000-0000-4000-8000-000000000004','LOCALITY','Kuniyamuthur','kuniyamuthur','IN','Asia/Kolkata',10.952800,76.954300,10);

INSERT INTO "categories" (name,slug,sort_order) VALUES
('Wedding Planners','wedding-planners',1),('Venues','venues',2),('Photography','photography',3),('Videography','videography',4),('Bridal Makeup','bridal-makeup',5),('Groom Makeup','groom-makeup',6),('Hairstyling','hairstyling',7),('Mehendi','mehendi',8),('Saree Draping','saree-draping',9),('Catering','catering',10),('Cakes & Desserts','cakes-desserts',11),('Decoration','decoration',12),('Florists','florists',13),('Lighting & Sound','lighting-sound',14),('DJs','djs',15),('Musicians','musicians',16),('Choreographers','choreographers',17),('Anchors','anchors',18),('Bridal Wear','bridal-wear',19),('Groom Wear','groom-wear',20),('Jewellery','jewellery',21),('Invitations','invitations',22),('Digital Invitations','digital-invitations',23),('Wedding Websites','wedding-websites',24),('Return Gifts','return-gifts',25),('Wedding Transportation','wedding-transportation',26),('Priests & Officiants','priests-officiants',27),('Ceremony Material Suppliers','ceremony-material-suppliers',28),('Honeymoon Planners','honeymoon-planners',29),('Guest Accommodation','guest-accommodation',30),('Event Security','event-security',31),('Valet Parking','valet-parking',32),('Live Streaming','live-streaming',33),('Photo Booths','photo-booths',34);

INSERT INTO "category_field_definitions" (category_id,key,label,field_type,required,filterable,comparable,unit,config,version,status)
SELECT id,'starting_price','Starting price','NUMBER'::"CategoryFieldType",true,true,true,'INR','{"min":0}'::jsonb,1,'ACTIVE'::"DefinitionStatus" FROM categories WHERE slug='photography'
UNION ALL SELECT id,'services','Services','MULTI_SELECT',true,true,true,NULL,'{"options":["Traditional","Candid","Pre-wedding","Albums"]}'::jsonb,1,'ACTIVE' FROM categories WHERE slug='photography'
UNION ALL SELECT id,'capacity','Guest capacity','NUMBER',true,true,true,'guests','{"min":1}'::jsonb,1,'ACTIVE' FROM categories WHERE slug='venues'
UNION ALL SELECT id,'venue_type','Venue type','SINGLE_SELECT',true,true,true,NULL,'{"options":["Banquet hall","Hotel","Resort","Outdoor"]}'::jsonb,1,'ACTIVE' FROM categories WHERE slug='venues'
UNION ALL SELECT id,'price_per_plate','Price per plate','NUMBER',true,true,true,'INR','{"min":0}'::jsonb,1,'ACTIVE' FROM categories WHERE slug='catering'
UNION ALL SELECT id,'cuisines','Cuisines','MULTI_SELECT',true,true,true,NULL,'{"options":["South Indian","North Indian","Continental","Chinese"]}'::jsonb,1,'ACTIVE' FROM categories WHERE slug='catering';
