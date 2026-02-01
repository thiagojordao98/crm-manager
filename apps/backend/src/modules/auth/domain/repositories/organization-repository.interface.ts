import { Organization } from '../entities/organization.entity';

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  create(organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
  update(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt'>>): Promise<Organization>;
  delete(id: string): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
  findAvailableSlug(baseSlug: string): Promise<string>;
}
