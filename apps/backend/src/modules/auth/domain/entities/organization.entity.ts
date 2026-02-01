export class Organization {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string | null,
    public readonly dataRetentionDays: number,
    public readonly retentionEnabled: boolean,
    public readonly settings: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(data: {
    id: string;
    name: string;
    slug?: string | null;
    dataRetentionDays?: number;
    retentionEnabled?: boolean;
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }): Organization {
    return new Organization(
      data.id,
      data.name,
      data.slug ?? null,
      data.dataRetentionDays ?? 730,
      data.retentionEnabled ?? true,
      data.settings ?? {},
      data.createdAt,
      data.updatedAt,
    );
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove consecutive hyphens
  }

  static generateUniqueSlug(name: string, suffix?: number): string {
    const baseSlug = Organization.generateSlug(name);
    return suffix ? `${baseSlug}-${suffix}` : baseSlug;
  }
}
