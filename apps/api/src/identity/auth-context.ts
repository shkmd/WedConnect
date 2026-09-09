export interface AuthContext { userId: string; accessToken: string; }
export interface AuthenticatedRequest { auth: AuthContext; headers: { authorization?: string; cookie?: string }; }
