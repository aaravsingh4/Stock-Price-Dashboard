import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository.js';
import type { User } from '@prisma/client';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return Boolean(email && emailRegex.test(email.trim()));
  }

  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    return { valid: true };
  }

  static async register(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || 'Invalid password');
    }

    const normalized = email.trim().toLowerCase();
    const existing = await UserRepository.findByEmail(normalized);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await UserRepository.createUserWithDefaultWatchlist(normalized, passwordHash);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async authenticate(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
    if (!this.validateEmail(email) || !password) {
      throw new Error('Invalid email or password');
    }

    const normalized = email.trim().toLowerCase();
    const user = await UserRepository.findByEmail(normalized);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async getProfile(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
