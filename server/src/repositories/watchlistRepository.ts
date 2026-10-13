import { prisma } from '../db.js';
import type { Watchlist, WatchlistItem } from '@prisma/client';

export type WatchlistWithItems = Watchlist & {
  items: WatchlistItem[];
};

export class WatchlistRepository {
  static async listByUser(userId: string): Promise<WatchlistWithItems[]> {
    return prisma.watchlist.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { addedAt: 'asc' },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  static async findById(id: string, userId: string): Promise<WatchlistWithItems | null> {
    return prisma.watchlist.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: { addedAt: 'asc' },
        },
      },
    });
  }

  static async createWatchlist(userId: string, name: string): Promise<WatchlistWithItems> {
    const trimmedName = name.trim();
    return prisma.watchlist.create({
      data: {
        userId,
        name: trimmedName,
        isDefault: false,
      },
      include: {
        items: true,
      },
    });
  }

  static async renameWatchlist(id: string, userId: string, newName: string): Promise<Watchlist | null> {
    const existing = await prisma.watchlist.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.watchlist.update({
      where: { id },
      data: { name: newName.trim() },
    });
  }

  static async deleteWatchlist(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.watchlist.findFirst({ where: { id, userId } });
    if (!existing) return false;
    if (existing.isDefault) {
      throw new Error('Cannot delete your default watchlist');
    }

    await prisma.watchlist.delete({ where: { id } });
    return true;
  }

  static async addSymbol(
    watchlistId: string,
    userId: string,
    symbol: string,
    name?: string,
    exchange?: string
  ): Promise<WatchlistItem> {
    // Enforce ownership
    const watchlist = await prisma.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!watchlist) {
      throw new Error('Watchlist not found or unauthorized');
    }

    const normSymbol = symbol.trim().toUpperCase();

    // Check duplicate
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_symbol: {
          watchlistId,
          symbol: normSymbol,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.watchlistItem.create({
      data: {
        watchlistId,
        symbol: normSymbol,
        name: name?.trim() || null,
        exchange: exchange?.trim() || null,
      },
    });
  }

  static async removeSymbol(watchlistId: string, userId: string, symbol: string): Promise<boolean> {
    const watchlist = await prisma.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!watchlist) {
      throw new Error('Watchlist not found or unauthorized');
    }

    const normSymbol = symbol.trim().toUpperCase();
    const result = await prisma.watchlistItem.deleteMany({
      where: {
        watchlistId,
        symbol: normSymbol,
      },
    });

    return result.count > 0;
  }
}
