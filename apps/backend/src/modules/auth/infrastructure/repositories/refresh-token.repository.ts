import { Injectable, Inject } from '@nestjs/common';
import { eq, lt, asc } from 'drizzle-orm';
import * as schema from '../../../../database/drizzle/schemas';
import { DATABASE_CONNECTION } from '../../../../database/database.module';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.token, token))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const results = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.userId, userId));

    return results.map((row: any) => this.mapToEntity(row));
  }

  async create(refreshToken: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
    const result = await this.db
      .insert(schema.refreshTokens)
      .values({
        userId: refreshToken.userId,
        token: refreshToken.token,
        expiresAt: refreshToken.expiresAt,
        ipAddress: refreshToken.ipAddress,
        userAgent: refreshToken.userAgent,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(token: string): Promise<void> {
    await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(schema.refreshTokens)
      .where(lt(schema.refreshTokens.expiresAt, new Date()));
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: schema.refreshTokens.id })
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.userId, userId));

    return result.length;
  }

  async deleteOldestByUserId(userId: string): Promise<void> {
    const oldest = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(eq(schema.refreshTokens.userId, userId))
      .orderBy(asc(schema.refreshTokens.createdAt))
      .limit(1);

    if (oldest[0]) {
      await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.id, oldest[0].id));
    }
  }

  private mapToEntity(row: any): RefreshToken {
    return RefreshToken.create({
      id: row.id,
      userId: row.userId,
      token: row.token,
      expiresAt: row.expiresAt,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    });
  }
}
