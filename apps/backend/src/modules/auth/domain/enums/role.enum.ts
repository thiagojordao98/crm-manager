export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

export const RoleHierarchy: Record<Role, number> = {
  [Role.VIEWER]: 0,
  [Role.AGENT]: 1,
  [Role.ADMIN]: 2,
  [Role.OWNER]: 3,
};

export function isRoleHigherOrEqual(userRole: Role, requiredRole: Role): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}

export function canInvite(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN;
}

export function isValidInvitationRole(role: string): role is 'admin' | 'agent' | 'viewer' {
  return role === 'admin' || role === 'agent' || role === 'viewer';
}
