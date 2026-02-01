export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(data: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      data.id,
      data.userId,
      data.token,
      data.expiresAt,
      data.ipAddress ?? null,
      data.userAgent ?? null,
      data.createdAt,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isExpired();
  }
}
