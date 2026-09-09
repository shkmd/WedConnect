DELETE FROM role_permissions rp USING permissions p WHERE rp.permission_id=p.id AND p.code='sponsored.manage'; DELETE FROM permissions WHERE code='sponsored.manage';
DROP TABLE IF EXISTS vendor_sponsored_placements,vendor_category_field_values,vendor_discovery_profiles; ALTER TABLE vendor_businesses DROP COLUMN IF EXISTS public_visible;
