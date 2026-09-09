DELETE FROM role_permissions rp USING permissions p WHERE rp.permission_id=p.id AND p.code='vendor.moderate';
DELETE FROM permissions WHERE code='vendor.moderate';
DROP TABLE IF EXISTS vendor_moderation_events,vendor_terms_acceptances,vendor_packages,vendor_services,vendor_service_areas,vendor_categories,vendor_members,vendor_businesses;
DROP TYPE IF EXISTS "PricingType"; DROP TYPE IF EXISTS "VendorMemberRole"; DROP TYPE IF EXISTS "VendorStatus"; DROP TYPE IF EXISTS "ProfessionalType";
