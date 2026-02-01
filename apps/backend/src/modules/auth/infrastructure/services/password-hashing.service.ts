import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHashingService {
  private readonly SALT_ROUNDS = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async needsRehash(hash: string): Promise<boolean> {
    const rounds = this.getRounds(hash);
    return rounds < this.SALT_ROUNDS;
  }

  private getRounds(hash: string): number {
    const parts = hash.split('$');
    if (parts.length < 3) return 0;
    return parseInt(parts[2], 10);
  }
}
