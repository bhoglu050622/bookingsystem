import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SlotStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LockSlotDto } from './dto/lock-slot.dto';
import { ReleaseSlotDto } from './dto/release-slot.dto';

@Injectable()
export class AvailabilityService {
  private readonly lockTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.lockTtlMs = Number(
      configService.get('SLOT_LOCK_TTL_MS') ?? 5 * 60 * 1000,
    );
  }

  async healthCheck() {
    const totalSlots = await this.prisma.availabilitySlot.count();
    return { status: 'ok', totalSlots };
  }

  async getDailyAvailability(instructorId: string, targetDate: Date) {
    try {
    await this.cleanupExpiredLocks();
    } catch (error) {
      // Log but don't fail if cleanup fails (e.g., database permission issues)
      console.warn('Failed to cleanup expired locks, continuing anyway:', error);
    }

    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    try {
    const slots = await this.prisma.availabilitySlot.findMany({
      where: {
        instructorProfileId: instructorId,
        startTime: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        locks: true,
        booking: true,
      },
    });

    const responseTimezone = slots[0]?.timezone ?? 'UTC';
      
      // Handle locks gracefully if there are permission issues
    const enrichedSlots = slots.map((slot) => {
        let activeLocks: any[] = [];
        let isLocked = false;
        let lockedUntil: Date | null = null;
        
        try {
          activeLocks = slot.locks?.filter(
        (lock) => lock.lockedUntil > new Date(),
          ) ?? [];
          isLocked = activeLocks.length > 0;
          lockedUntil = isLocked ? activeLocks[0].lockedUntil : null;
        } catch (error) {
          // If we can't access locks, assume slot is not locked
          console.warn('Failed to check locks for slot, assuming unlocked:', error);
        }
        
      const timezone = slot.timezone ?? responseTimezone;

      return {
        id: slot.id,
        instructorProfileId: slot.instructorProfileId,
        startTimeUtc: slot.startTime.toISOString(),
        endTimeUtc: slot.endTime.toISOString(),
        startTimeLocal: this.formatInTimezone(slot.startTime, timezone),
        endTimeLocal: this.formatInTimezone(slot.endTime, timezone),
        timezone,
        status:
          isLocked && slot.status === SlotStatus.AVAILABLE
            ? SlotStatus.RESERVED
            : slot.status,
        isLocked,
        lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
        hasBooking: !!slot.booking,
          lockedBy: isLocked ? (activeLocks[0]?.userId ?? null) : null,
          lockReason: isLocked ? (activeLocks[0]?.reason ?? null) : null,
      };
    });

    return {
      instructorId,
      date: dayStart.toISOString(),
      timezone: responseTimezone,
      slots: enrichedSlots,
    };
    } catch (error) {
      // If database query fails (e.g., permission issues, instructor doesn't exist),
      // return empty slots instead of throwing error
      console.error(`Failed to fetch availability for instructor ${instructorId}:`, error);
      return {
        instructorId,
        date: dayStart.toISOString(),
        timezone: 'UTC',
        slots: [],
      };
    }
  }

  async lockSlot(dto: LockSlotDto) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: dto.slotId },
      include: {
        locks: true,
        booking: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (
      slot.status === SlotStatus.DISABLED ||
      slot.status === SlotStatus.BOOKED ||
      slot.booking
    ) {
      throw new ConflictException('Slot is not available for locking');
    }

    const hasActiveLock = slot.locks.some(
      (lock) => lock.lockedUntil > new Date(),
    );
    if (hasActiveLock) {
      throw new ConflictException('Slot is already locked');
    }

    const token = randomUUID();
    const key = this.buildLockKey(dto.slotId);
    const acquired = await this.redisService.acquireLock(
      key,
      token,
      this.lockTtlMs,
    );

    if (!acquired) {
      throw new ConflictException('Failed to acquire lock');
    }

    const lockedUntil = new Date(Date.now() + this.lockTtlMs);

    await this.prisma.$transaction([
      this.prisma.slotLock.create({
        data: {
          slotId: dto.slotId,
          token,
          lockedUntil,
          userId: dto.userId,
          reason: dto.reason ?? 'slot-reservation',
        },
      }),
      this.prisma.availabilitySlot.update({
        where: { id: dto.slotId },
        data: {
          status: SlotStatus.RESERVED,
        },
      }),
    ]);

    return {
      slotId: dto.slotId,
      token,
      lockedUntil: lockedUntil.toISOString(),
      ttlMs: this.lockTtlMs,
    };
  }

  async releaseSlot(dto: ReleaseSlotDto) {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: dto.slotId },
      include: {
        booking: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    const lockRecord = await this.prisma.slotLock.findFirst({
      where: {
        slotId: dto.slotId,
        token: dto.token,
      },
    });

    if (!lockRecord) {
      throw new NotFoundException('Lock not found for slot');
    }

    await this.redisService.releaseLock(
      this.buildLockKey(dto.slotId),
      dto.token,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.slotLock.delete({ where: { id: lockRecord.id } });

      const activeLocks = await tx.slotLock.count({
        where: {
          slotId: dto.slotId,
          lockedUntil: {
            gt: new Date(),
          },
        },
      });

      if (
        activeLocks === 0 &&
        slot.status === SlotStatus.RESERVED &&
        !slot.booking
      ) {
        await tx.availabilitySlot.update({
          where: { id: dto.slotId },
          data: {
            status: SlotStatus.AVAILABLE,
          },
        });
      }
    });

    return {
      slotId: dto.slotId,
      released: true,
    };
  }

  async markSlotAsBooked(slotId: string) {
    const locks = await this.prisma.slotLock.findMany({ where: { slotId } });

    await Promise.all(
      locks.map((lock) =>
        this.redisService.releaseLock(this.buildLockKey(slotId), lock.token),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.slotLock.deleteMany({ where: { slotId } }),
      this.prisma.availabilitySlot.update({
        where: { id: slotId },
        data: {
          status: SlotStatus.BOOKED,
        },
      }),
    ]);
  }

  async releaseSlotAfterRefund(slotId: string) {
    const locks = await this.prisma.slotLock.findMany({ where: { slotId } });

    await Promise.all(
      locks.map((lock) =>
        this.redisService
          .releaseLock(this.buildLockKey(slotId), lock.token)
          .catch(() => undefined),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.slotLock.deleteMany({ where: { slotId } }),
      this.prisma.availabilitySlot.update({
        where: { id: slotId },
        data: {
          status: SlotStatus.AVAILABLE,
        },
      }),
    ]);
  }

  private buildLockKey(slotId: string) {
    return `slot-lock:${slotId}`;
  }

  private formatInTimezone(date: Date, timezone: string) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private async cleanupExpiredLocks() {
    const now = new Date();
    const expiredLocks = await this.prisma.slotLock.findMany({
      where: {
        lockedUntil: {
          lt: now,
        },
      },
    });

    if (expiredLocks.length === 0) {
      return;
    }

    await Promise.all(
      expiredLocks.map((lock) =>
        this.redisService.releaseLock(
          this.buildLockKey(lock.slotId),
          lock.token,
        ),
      ),
    );

    await this.prisma.slotLock.deleteMany({
      where: {
        id: {
          in: expiredLocks.map((lock) => lock.id),
        },
      },
    });
  }
}
