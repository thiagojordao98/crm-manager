import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByOrganizationId(organizationId: string): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>;
  delete(id: string): Promise<void>;
  exists(email: string): Promise<boolean>;
  updateLastLoginAt(userId: string): Promise<void>;
}
