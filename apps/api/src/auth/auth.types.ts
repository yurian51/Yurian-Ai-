export interface AuthenticatedPrincipal {
  userId: string;
  sessionId: string;
  organizationId: string;
  workspaceId?: string;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
