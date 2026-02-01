export class Invitation {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly organizationId: string,
    public readonly role: 'admin' | 'agent' | 'viewer',
    public readonly token: string,
    public readonly invitedBy: string | null,
    public readonly expiresAt: Date,
    public readonly acceptedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(data: {
    id: string;
    email: string;
    organizationId: string;
    role: 'admin' | 'agent' | 'viewer';
    token: string;
    invitedBy?: string | null;
    expiresAt: Date;
    acceptedAt?: Date | null;
    createdAt: Date;
  }): Invitation {
    return new Invitation(
      data.id,
      data.email,
      data.organizationId,
      data.role,
      data.token,
      data.invitedBy ?? null,
      data.expiresAt,
      data.acceptedAt ?? null,
      data.createdAt,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isAccepted(): boolean {
    return this.acceptedAt !== null;
  }

  isPending(): boolean {
    return !this.isAccepted() && !this.isExpired();
  }

  canBeAccepted(): boolean {
    return this.isPending();
  }
}
