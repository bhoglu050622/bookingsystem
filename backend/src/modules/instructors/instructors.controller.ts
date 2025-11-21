import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { InstructorsScraperService } from './instructors-scraper.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('instructors')
export class InstructorsController {
  constructor(
    private readonly instructorsService: InstructorsService,
    private readonly scraperService: InstructorsScraperService,
  ) {}

  @Get('health')
  healthCheck() {
    return this.instructorsService.healthCheck();
  }

  @Get('scrape')
  async scrapeMentors() {
    return this.scraperService.scrapeMentors();
  }

  @Post('sync')
  async syncMentors() {
    return this.instructorsService.syncScrapedMentors();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateInstructorDto) {
    return this.instructorsService.create(dto);
  }

  @Get()
  async findAll(@Query('useScraped') useScraped?: string) {
    // If useScraped=true, return scraped data instead of DB data
    if (useScraped === 'true') {
      const scraped = await this.scraperService.scrapeMentors();
      
      // Filter out invalid mentor entries (same as frontend mock API)
      const invalidNames = [
        'Industry Specialized',
        'Our Mentors',
        'Why Creator',
        'Embrace New',
        'Expertisor Academy',
        'Works Course',
        'Full Stack',
        'Our Mentors',
      ];
      
      const validMentors = scraped.filter((mentor) => {
        return mentor.name && !invalidNames.includes(mentor.name);
      });
      
      // Convert to instructor profile format
      return validMentors.map((mentor, index) => ({
        id: `scraped-${index}`,
        userId: `scraped-user-${index}`,
        slug: mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        displayName: mentor.name,
        headline: mentor.title || mentor.expertise?.join(', ') || 'Expert Mentor',
        bio: mentor.bio || `Professional mentor specializing in ${mentor.expertise?.join(', ') || 'various domains'}`,
        avatarUrl: mentor.avatarUrl,
        pricingAmount: mentor.price ? mentor.price * 100 : 250000,
        pricingCurrency: mentor.currency || 'INR',
        meetingDuration: 30,
        bufferBefore: 0,
        bufferAfter: 0,
        calendarTimezone: 'Asia/Kolkata',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
    
    // Return DB instructors, filtering only active ones
    return this.instructorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('useScraped') useScraped?: string) {
    // If useScraped=true, search in scraped data by slug
    if (useScraped === 'true') {
      const scraped = await this.scraperService.scrapeMentors();
      
      // Filter out invalid mentor entries
      const invalidNames = [
        'Industry Specialized',
        'Our Mentors',
        'Why Creator',
        'Embrace New',
        'Expertisor Academy',
        'Works Course',
        'Full Stack',
      ];
      
      const validMentors = scraped.filter((mentor) => {
        return mentor.name && !invalidNames.includes(mentor.name);
      });
      
      // Find mentor by slug
      const mentor = validMentors.find((m) => {
        const mentorSlug = m.slug || m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return mentorSlug === id;
      });
      
      if (!mentor) {
        throw new NotFoundException(`Instructor with slug ${id} not found in scraped data`);
      }
      
      // Convert to instructor profile format
      const index = validMentors.indexOf(mentor);
      return {
        id: `scraped-${index}`,
        userId: `scraped-user-${index}`,
        slug: mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        displayName: mentor.name,
        headline: mentor.title || mentor.expertise?.join(', ') || 'Expert Mentor',
        bio: mentor.bio || `Professional mentor specializing in ${mentor.expertise?.join(', ') || 'various domains'}`,
        avatarUrl: mentor.avatarUrl,
        pricingAmount: mentor.price ? mentor.price * 100 : 250000,
        pricingCurrency: mentor.currency || 'INR',
        meetingDuration: 30,
        bufferBefore: 0,
        bufferAfter: 0,
        calendarTimezone: 'Asia/Kolkata',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    // For database lookup, try to find by slug first, then by ID
    try {
      return await this.instructorsService.findBySlug(id);
    } catch (slugError) {
      // If not found by slug, try by ID
      try {
        return await this.instructorsService.findOne(id);
      } catch (idError) {
        throw new NotFoundException(`Instructor with identifier ${id} not found`);
      }
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInstructorDto) {
    return this.instructorsService.update(id, dto);
  }
}
