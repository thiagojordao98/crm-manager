export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly name: string,
    public readonly role: 'owner' | 'admin' | 'agent' | 'viewer',
    public readonly organizationId: string,
    public readonly emailVerified: boolean | null,
    public readonly emailVerificationToken: string | null,
    public readonly lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(data: {
    id: string;
    email: string;
    passwordHash: string | null;
    name: string;
    role: 'owner' | 'admin' | 'agent' | 'viewer';
    organizationId: string;
    emailVerified?: boolean | null;
    emailVerificationToken?: string | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.passwordHash,
      data.name,
      data.role,
      data.organizationId,
      data.emailVerified ?? null,
      data.emailVerificationToken ?? null,
      data.lastLoginAt ?? null,
      data.createdAt,
      data.updatedAt,
    );
  }

  isOwner(): boolean {
    return this.role === 'owner';
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  canInvite(): boolean {
    return this.role === 'owner' || this.role === 'admin';
  }

  hasRoleOrHigher(role: 'owner' | 'admin' | 'agent' | 'viewer'): boolean {
    const hierarchy = ['viewer', 'agent', 'admin', 'owner'];
    const userRoleIndex = hierarchy.indexOf(this.role);
    const requiredRoleIndex = hierarchy.indexOf(role);
    return userRoleIndex >= requiredRoleIndex;
  }
}
