SELECT pgmq.drop_queue('media_processing');
DELETE FROM role_permissions rp USING permissions p WHERE rp.permission_id=p.id AND p.code='media.moderate'; DELETE FROM permissions WHERE code='media.moderate';
DROP TABLE IF EXISTS copyright_reports,media_moderation_events,portfolio_media,portfolio_posts,media_assets,media_upload_intents;
DROP TYPE IF EXISTS "CopyrightReportStatus"; DROP TYPE IF EXISTS "PortfolioFormat"; DROP TYPE IF EXISTS "PublicationStatus"; DROP TYPE IF EXISTS "ModerationStatus"; DROP TYPE IF EXISTS "ProcessingStatus"; DROP TYPE IF EXISTS "MediaType";
