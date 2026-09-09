export interface WorkerConfig { databaseUrl?: string; healthPort: number; supabaseUrl?: string; supabaseSecretKey?: string; }
export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const config: WorkerConfig = { healthPort: Number(env.WORKER_HEALTH_PORT ?? 4001) };
  if (env.DATABASE_URL) config.databaseUrl = env.DATABASE_URL;
  if (env.SUPABASE_URL) config.supabaseUrl = env.SUPABASE_URL;
  if (env.SUPABASE_SECRET_KEY) config.supabaseSecretKey = env.SUPABASE_SECRET_KEY;
  return config;
}
