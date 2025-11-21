import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorsScraperService, ScrapedMentor } from './instructors-scraper.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InstructorsService {
  private readonly logger = new Logger(InstructorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraperService: InstructorsScraperService,
  ) {}

  async healthCheck() {
    const [totalInstructors, totalSlots] = await Promise.all([
      this.prisma.instructorProfile.count(),
      this.prisma.availabilitySlot.count(),
    ]);
    return { status: 'ok', totalInstructors, totalSlots };
  }

  create(dto: CreateInstructorDto) {
    return this.prisma.instructorProfile.create({
      data: {
        userId: dto.userId,
        slug: dto.slug,
        displayName: dto.displayName,
        headline: dto.headline,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        pricingAmount: dto.pricingAmount,
        pricingCurrency: dto.pricingCurrency,
        meetingDuration: dto.meetingDuration,
        bufferBefore: dto.bufferBefore,
        bufferAfter: dto.bufferAfter,
        calendarTimezone: dto.calendarTimezone,
        rrule: dto.rrule,
        active: dto.active ?? true,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll() {
    return this.prisma.instructorProfile.findMany({
      where: {
        active: true, // Only return active instructors
      },
      include: {
        user: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        slots: {
          orderBy: { startTime: 'asc' },
          take: 20,
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor ${id} not found`);
    }

    return instructor;
  }

  async findBySlug(slug: string) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { slug },
      include: {
        user: true,
        slots: {
          orderBy: { startTime: 'asc' },
          take: 20,
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with slug ${slug} not found`);
    }

    return instructor;
  }

  async update(id: string, dto: UpdateInstructorDto) {
    const instructor = await this.prisma.instructorProfile.findUnique({
      where: { id },
    });
    if (!instructor) {
      throw new NotFoundException(`Instructor ${id} not found`);
    }

    return this.prisma.instructorProfile.update({
      where: { id },
      data: {
        slug: dto.slug,
        displayName: dto.displayName,
        headline: dto.headline,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        pricingAmount: dto.pricingAmount,
        pricingCurrency: dto.pricingCurrency,
        meetingDuration: dto.meetingDuration,
        bufferBefore: dto.bufferBefore,
        bufferAfter: dto.bufferAfter,
        calendarTimezone: dto.calendarTimezone,
        rrule: dto.rrule,
        active: dto.active,
      },
      include: {
        user: true,
      },
    });
  }

  async syncScrapedMentors(): Promise<{ created: number; skipped: number; errors: number }> {
    this.logger.log('Starting mentor sync from Expertisor Academy...');
    
    const scrapedMentors = await this.scraperService.scrapeMentors();
    this.logger.log(`Scraped ${scrapedMentors.length} mentors`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const mentor of scrapedMentors) {
      try {
        // Generate slug from name
        const slug = mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Check if instructor with this slug already exists
        const existing = await this.prisma.instructorProfile.findUnique({
          where: { slug },
        });

        if (existing) {
          this.logger.debug(`Skipping ${mentor.name} - already exists`);
          skipped++;
          continue;
        }

        // Create user account for the mentor
        const email = `${slug}@expertisoracademy.in`;
        const passwordHash = await bcrypt.hash('changeme123', 10);

        const user = await this.prisma.user.create({
          data: {
            email,
            firstName: mentor.name.split(' ')[0] || mentor.name,
            lastName: mentor.name.split(' ').slice(1).join(' ') || '',
            role: UserRole.INSTRUCTOR,
            passwordHash,
          },
        });

        // Create instructor profile
        await this.prisma.instructorProfile.create({
          data: {
            userId: user.id,
            slug,
            displayName: mentor.name,
            headline: mentor.title || mentor.expertise?.join(', ') || 'Expert Mentor',
            bio: mentor.bio || `Professional mentor specializing in ${mentor.expertise?.join(', ') || 'various domains'}`,
            avatarUrl: mentor.avatarUrl,
            pricingAmount: mentor.price ? mentor.price * 100 : 250000, // Convert to cents
            pricingCurrency: mentor.currency || 'INR',
            meetingDuration: 30,
            bufferBefore: 0,
            bufferAfter: 0,
            calendarTimezone: 'Asia/Kolkata',
            active: true,
          },
        });

        this.logger.log(`Created instructor: ${mentor.name}`);
        created++;
      } catch (error) {
        this.logger.error(`Error syncing mentor ${mentor.name}:`, error);
        errors++;
      }
    }

    this.logger.log(`Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
    return { created, skipped, errors };
  }
}
