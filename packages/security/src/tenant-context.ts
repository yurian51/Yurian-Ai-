export type TenantRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'DEVELOPER';

export interface TenantContext {
  userId: string;
  organizationId: string;
  workspaceId: string;
  roles: readonly TenantRole[];
  permissions: readonly string[];
  sessionId: string;
}

export function hasPermission(context: TenantContext, permission: string): boolean {
  return context.permissions.includes(permission) || context.roles.includes('OWNER');
}

export function assertTenantContext(context: TenantContext): void {
  if (!context.userId || !context.organizationId || !context.workspaceId || !context.sessionId) {
    throw new Error('TENANT_CONTEXT_REQUIRED');
  }
}
