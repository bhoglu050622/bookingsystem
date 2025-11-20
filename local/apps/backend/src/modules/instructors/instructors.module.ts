import { Module } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { InstructorsController } from './instructors.controller';
import { InstructorsScraperService } from './instructors-scraper.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InstructorsController],
  providers: [InstructorsService, InstructorsScraperService],
  exports: [InstructorsService],
})
export class InstructorsModule {}
