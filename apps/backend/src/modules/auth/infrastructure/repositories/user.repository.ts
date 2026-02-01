import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../../../../database/drizzle/schemas';
import { DATABASE_CONNECTION } from '../../../../database/database.module';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<User[]> {
    const results = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.organizationId, organizationId));

    return results.map((row: any) => this.mapToEntity(row));
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const result = await this.db
      .insert(schema.users)
      .values({
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        emailVerified: user.emailVerified,
        emailVerificationToken: user.emailVerificationToken,
        lastLoginAt: user.lastLoginAt,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.email !== undefined) updateData.email = data.email;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.emailVerificationToken !== undefined)
      updateData.emailVerificationToken = data.emailVerificationToken;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt;

    const result = await this.db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async exists(email: string): Promise<boolean> {
    const result = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return result.length > 0;
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  private mapToEntity(row: any): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role,
      organizationId: row.organizationId,
      emailVerified: row.emailVerified,
      emailVerificationToken: row.emailVerificationToken,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
