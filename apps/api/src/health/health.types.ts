export type DependencyStatus = 'up' | 'down' | 'not_configured';
export interface DependencyCheck { name: 'postgres'; status: DependencyStatus; latencyMs?: number; }
