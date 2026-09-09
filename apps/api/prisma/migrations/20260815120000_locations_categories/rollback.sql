DELETE FROM "role_permissions" rp USING "permissions" p WHERE rp.permission_id=p.id AND p.code IN ('locations.manage','taxonomy.manage');
DELETE FROM "permissions" WHERE code IN ('locations.manage','taxonomy.manage');
DROP TABLE IF EXISTS "category_field_definitions";
DROP TABLE IF EXISTS "categories";
DROP TABLE IF EXISTS "locations";
DROP TYPE IF EXISTS "DefinitionStatus";
DROP TYPE IF EXISTS "CategoryFieldType";
DROP TYPE IF EXISTS "LocationType";
