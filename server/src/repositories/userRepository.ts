import { prisma } from '../db.js';
import type { User } from '@prisma/client';

export class UserRepository {
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return prisma.user.findUnique({ where: { email: normalized } });
  }

  /**
   * Creates a user and seeds their default watchlist in a single atomic transaction.
   */
  static async createUserWithDefaultWatchlist(email: string, passwordHash: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    return prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
          },
        });

        // Default Watchlist for the user
        await tx.watchlist.create({
          data: {
            userId: user.id,
            name: 'My Watchlist',
            isDefault: true,
            items: {
              create: [
                { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'US' },
                { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'US' },
                { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'US' },
              ],
            },
          },
        });

        return user;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );
  }
}
