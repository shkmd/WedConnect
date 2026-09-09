-- Manual rollback for development/staging only. Review data loss before execution.
DROP TABLE IF EXISTS "admin_mfa_policies";
DROP TABLE IF EXISTS "otp_security_events";
DROP TABLE IF EXISTS "consent_records";
DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "role_permissions";
DROP TABLE IF EXISTS "permissions";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "app_users";
DROP TYPE IF EXISTS "ConsentAction";
DROP TYPE IF EXISTS "ScopeType";
DROP TYPE IF EXISTS "RoleCode";
DROP TYPE IF EXISTS "AccountStatus";
