import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  create(refreshToken: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken>;
  delete(token: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
  countByUserId(userId: string): Promise<number>;
  deleteOldestByUserId(userId: string): Promise<void>;
}
