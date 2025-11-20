import { PrismaClient, SlotStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Read the JSON file directly
const hardcodedMentorsPath = path.join(__dirname, '../data/hardcoded-mentors.json');
const hardcodedMentorsJson = JSON.parse(fs.readFileSync(hardcodedMentorsPath, 'utf-8'));

const prisma = new PrismaClient();

const hardcodedMentorsData: any[] = Array.isArray(hardcodedMentorsJson) 
  ? hardcodedMentorsJson 
  : (hardcodedMentorsJson as any).default || [];

async function main() {
  console.log('Starting to seed scraped instructors...');

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

  const validMentors = hardcodedMentorsData.filter((mentor) => {
    return mentor.name && !invalidNames.includes(mentor.name);
  });

  console.log(`Found ${validMentors.length} valid mentors to seed`);

  // Create or update instructors
  for (let index = 0; index < validMentors.length; index++) {
    const mentor = validMentors[index];
    const instructorId = `scraped-${index}`;
    const slug = mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if instructor already exists
    let instructor = await prisma.instructorProfile.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      // Create a user for this instructor
      const user = await prisma.user.create({
        data: {
          email: `instructor-${index}@example.com`,
          firstName: mentor.name.split(' ')[0] || 'Instructor',
          lastName: mentor.name.split(' ').slice(1).join(' ') || '',
          role: 'INSTRUCTOR',
          passwordHash: '$2b$10$dummy', // Dummy hash, won't be used
        },
      });

      // Create instructor profile
      instructor = await prisma.instructorProfile.create({
        data: {
          id: instructorId,
          userId: user.id,
          slug,
          displayName: mentor.name,
          headline: mentor.title || mentor.expertise?.join(', ') || 'Expert Mentor',
          bio: mentor.bio || `Professional mentor specializing in ${mentor.expertise?.join(', ') || 'various domains'}`,
          avatarUrl: mentor.avatarUrl || null,
          pricingAmount: mentor.price ? mentor.price * 100 : 250000,
          pricingCurrency: mentor.currency || 'INR',
          meetingDuration: 30,
          bufferBefore: 0,
          bufferAfter: 0,
          calendarTimezone: 'Asia/Kolkata',
        },
      });

      console.log(`Created instructor: ${instructor.displayName} (${instructorId})`);
    } else {
      console.log(`Instructor already exists: ${instructor.displayName} (${instructorId})`);
    }

    // Create availability slots for the next 30 days
    const now = new Date();
    const slots = [];

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const slotDate = new Date(now);
      slotDate.setUTCDate(slotDate.getUTCDate() + dayOffset);
      slotDate.setUTCHours(0, 0, 0, 0);

      // Create 6 slots per day (9 AM, 11 AM, 1 PM, 3 PM, 5 PM, 7 PM)
      for (let hour = 9; hour <= 19; hour += 2) {
        const startTime = new Date(slotDate);
        startTime.setUTCHours(hour, 0, 0, 0);
        
        // Skip past slots
        if (startTime < now) continue;

        const endTime = new Date(startTime);
        endTime.setUTCMinutes(endTime.getUTCMinutes() + instructor.meetingDuration);

        slots.push({
          instructorProfileId: instructor.id,
          startTime,
          endTime,
          timezone: instructor.calendarTimezone,
          status: SlotStatus.AVAILABLE,
        });
      }
    }

    // Check existing slots count
    const existingSlotsCount = await prisma.availabilitySlot.count({
      where: { instructorProfileId: instructor.id },
    });

    if (existingSlotsCount === 0 && slots.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: slots,
        skipDuplicates: true,
      });
      console.log(`Created ${slots.length} availability slots for ${instructor.displayName}`);
    } else {
      console.log(`Skipped creating slots for ${instructor.displayName} (${existingSlotsCount} slots already exist)`);
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((error) => {
    console.error('Error seeding scraped instructors:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

