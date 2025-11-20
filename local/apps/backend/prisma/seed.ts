import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.info('Seed skipped: users already exist.');
    return;
  }

  // Demo password: "demo123"
  // Generate proper bcrypt hash for demo password
  const bcrypt = require('bcrypt');
  const passwordHash = bcrypt.hashSync('demo123', 10);

  const instructorUser = await prisma.user.create({
    data: {
      email: 'mentor@example.com',
      firstName: 'Mentor',
      lastName: 'One',
      role: UserRole.INSTRUCTOR,
      passwordHash,
      instructor: {
        create: {
          slug: 'mentor-one',
          displayName: 'Mentor One',
          headline: 'Product Strategy Expert',
          bio: 'Helping founders build user-first products.',
          pricingAmount: 2500,
          pricingCurrency: 'INR',
          meetingDuration: 30,
          calendarTimezone: 'Asia/Kolkata',
        },
      },
    },
    include: {
      instructor: true,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      firstName: 'Student',
      lastName: 'One',
      role: UserRole.USER,
      passwordHash,
      timezone: 'Asia/Kolkata',
    },
  });

  const now = new Date();
  
  // Add null check for instructor
  if (!instructorUser.instructor) {
    throw new Error('Instructor profile not created properly');
  }
  
  const slots = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(now.getTime());
    start.setUTCDate(start.getUTCDate() + index + 1);
    start.setUTCHours(9, 0, 0, 0);
    const end = new Date(start.getTime());
    end.setUTCMinutes(end.getUTCMinutes() + instructorUser.instructor!.meetingDuration);
    return {
      instructorProfileId: instructorUser.instructor!.id,
      startTime: start,
      endTime: end,
      timezone: 'Asia/Kolkata',
      createdByRule: true,
    };
  });

  await prisma.availabilitySlot.createMany({ data: slots });

  console.info('Seed complete:', {
    instructors: 1,
    users: 2,
    slots: slots.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

