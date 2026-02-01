import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../../../../database/drizzle/schemas';
import { DATABASE_CONNECTION } from '../../../../database/database.module';
import { Organization } from '../../domain/entities/organization.entity';
import { IOrganizationRepository } from '../../domain/repositories/organization-repository.interface';

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  async findById(id: string): Promise<Organization | null> {
    const result = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const result = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async create(
    organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Organization> {
    const result = await this.db
      .insert(schema.organizations)
      .values({
        name: organization.name,
        slug: organization.slug,
        dataRetentionDays: organization.dataRetentionDays,
        retentionEnabled: organization.retentionEnabled,
        settings: organization.settings,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(
    id: string,
    data: Partial<Omit<Organization, 'id' | 'createdAt'>>,
  ): Promise<Organization> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.dataRetentionDays !== undefined) updateData.dataRetentionDays = data.dataRetentionDays;
    if (data.retentionEnabled !== undefined) updateData.retentionEnabled = data.retentionEnabled;
    if (data.settings !== undefined) updateData.settings = data.settings;

    const result = await this.db
      .update(schema.organizations)
      .set(updateData)
      .where(eq(schema.organizations.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.organizations).where(eq(schema.organizations.id, id));
  }

  async slugExists(slug: string): Promise<boolean> {
    const result = await this.db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug))
      .limit(1);

    return result.length > 0;
  }

  async findAvailableSlug(baseSlug: string): Promise<string> {
    // Check if base slug is available
    if (!(await this.slugExists(baseSlug))) {
      return baseSlug;
    }

    // Try suffixes until we find an available one
    let suffix = 2;
    while (suffix < 100) {
      const candidateSlug = `${baseSlug}-${suffix}`;
      if (!(await this.slugExists(candidateSlug))) {
        return candidateSlug;
      }
      suffix++;
    }

    // Fallback to timestamp-based slug
    return `${baseSlug}-${Date.now()}`;
  }

  private mapToEntity(row: any): Organization {
    return Organization.create({
      id: row.id,
      name: row.name,
      slug: row.slug,
      dataRetentionDays: row.dataRetentionDays,
      retentionEnabled: row.retentionEnabled,
      settings: row.settings,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
