/**
 * Script to sync mentors from Expertisor Academy to the database
 * Run with: npx ts-node src/scripts/sync-mentors.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InstructorsService } from '../modules/instructors/instructors.service';

async function syncMentors() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const instructorsService = app.get(InstructorsService);

  try {
    console.log('Starting mentor sync from Expertisor Academy...');
    const result = await instructorsService.syncScrapedMentors();
    console.log('\n✅ Sync complete!');
    console.log(`   Created: ${result.created}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors}`);
  } catch (error) {
    console.error('❌ Error syncing mentors:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

syncMentors();

