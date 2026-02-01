export class Password {
  private static readonly MIN_LENGTH = 8;
  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly NUMBER_REGEX = /[0-9]/;

  private constructor(private readonly value: string) {}

  static create(password: string): Password {
    const errors = Password.validate(password);
    if (errors.length > 0) {
      throw new Error(`Password validation failed: ${errors.join(', ')}`);
    }
    return new Password(password);
  }

  static validate(password: string): string[] {
    const errors: string[] = [];

    if (!password || password.length < Password.MIN_LENGTH) {
      errors.push(`Password must be at least ${Password.MIN_LENGTH} characters long`);
    }

    if (!Password.UPPERCASE_REGEX.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!Password.NUMBER_REGEX.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return errors;
  }

  static isStrong(password: string): boolean {
    return Password.validate(password).length === 0;
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return '********'; // Never expose actual password
  }
}
