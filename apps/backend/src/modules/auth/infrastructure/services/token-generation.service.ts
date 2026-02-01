import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenGenerationService {
  private readonly TOKEN_LENGTH = 32; // 32 bytes = 256 bits

  generate(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('base64url');
  }

  generateWithLength(length: number): string {
    return randomBytes(length).toString('base64url');
  }
}
