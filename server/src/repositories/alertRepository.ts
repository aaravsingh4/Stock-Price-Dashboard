import { prisma } from '../db.js';
import { AlertCondition, AlertStatus, Prisma } from '@prisma/client';
import type { PriceAlert, PriceAlertHistory } from '@prisma/client';

export class AlertRepository {
  static async listByUser(userId: string): Promise<PriceAlert[]> {
    return prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async listActiveAlerts(): Promise<PriceAlert[]> {
    return prisma.priceAlert.findMany({
      where: { status: AlertStatus.ACTIVE },
    });
  }

  static async listActiveBySymbol(symbol: string): Promise<PriceAlert[]> {
    return prisma.priceAlert.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        status: AlertStatus.ACTIVE,
      },
    });
  }

  static async createAlert(
    userId: string,
    symbol: string,
    condition: AlertCondition,
    targetPrice: number
  ): Promise<PriceAlert> {
    return prisma.priceAlert.create({
      data: {
        userId,
        symbol: symbol.toUpperCase().trim(),
        condition,
        targetPrice: new Prisma.Decimal(targetPrice),
        status: AlertStatus.ACTIVE,
      },
    });
  }

  static async deleteAlert(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.priceAlert.findFirst({ where: { id, userId } });
    if (!existing) return false;

    await prisma.priceAlert.delete({ where: { id } });
    return true;
  }

  static async updateStatus(id: string, userId: string, status: AlertStatus): Promise<PriceAlert | null> {
    const existing = await prisma.priceAlert.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.priceAlert.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Atomic trigger operation: transition alert to TRIGGERED and write history record
   * with deduplication identifier in a single transaction.
   */
  static async triggerAlertTransaction(
    alertId: string,
    observedPrice: number,
    eventTime?: Date
  ): Promise<{ alert: PriceAlert; history: PriceAlertHistory } | null> {
    return prisma.$transaction(async (tx) => {
      // Find alert and verify it's still ACTIVE (prevents duplicate triggers across concurrent events)
      const alert = await tx.priceAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert || alert.status !== AlertStatus.ACTIVE) {
        return null;
      }

      const now = new Date();
      const dedupId = `${alert.id}-${alert.symbol}-${now.getTime()}-${Math.floor(observedPrice * 100)}`;

      const updatedAlert = await tx.priceAlert.update({
        where: { id: alertId },
        data: {
          status: AlertStatus.TRIGGERED,
          triggeredAt: now,
          triggeredPrice: new Prisma.Decimal(observedPrice),
          eventTime: eventTime || now,
        },
      });

      const history = await tx.priceAlertHistory.create({
        data: {
          userId: alert.userId,
          alertId: alert.id,
          symbol: alert.symbol,
          condition: alert.condition,
          targetPrice: alert.targetPrice,
          observedPrice: new Prisma.Decimal(observedPrice),
          eventTime: eventTime || now,
          triggeredAt: now,
          dedupId,
        },
      });

      return { alert: updatedAlert, history };
    });
  }

  static async listHistory(userId: string, limit: number = 50): Promise<PriceAlertHistory[]> {
    return prisma.priceAlertHistory.findMany({
      where: { userId },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
    });
  }
}
