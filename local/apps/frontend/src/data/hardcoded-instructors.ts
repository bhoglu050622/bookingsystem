import type { InstructorProfile } from "@/lib/types";
import hardcodedMentorsJson from "./hardcoded-mentors.json";

const hardcodedMentorsData: any[] = Array.isArray(hardcodedMentorsJson) 
  ? hardcodedMentorsJson 
  : (hardcodedMentorsJson as any).default || [];

// Convert hardcoded mentors to InstructorProfile format
export const HARDCODED_INSTRUCTORS: InstructorProfile[] = (hardcodedMentorsData.length > 0 ? hardcodedMentorsData : [
  // Fallback mentors if JSON fails to load
  {
    name: "Anton Francis",
    slug: "anton-francis",
    avatarUrl: "https://www.expertisoracademy.in/assets/sivaraman-DAnNxvky.svg",
  },
  {
    name: "Mano Sundar",
    slug: "mano-sundar",
    title: "Engineer | Smart India Hackathon Expert",
    bio: "Associate Engineer | Smart India Hackathon Expert",
    avatarUrl: "https://www.expertisoracademy.in/assets/manosundar-_zTgK265.svg",
  },
  {
    name: "Elavarasan Sakthivel",
    slug: "elavarasan-sakthivel",
    title: "Mechanical Design Engineer | SolidWorks Expert",
    bio: "Mechanical Engineer | Mechanical Design Engineer | SolidWorks Expert",
    avatarUrl: "https://www.expertisoracademy.in/assets/elavarasan-DKfDEGtP.svg",
  },
])
  .filter((mentor) => {
    // Filter out non-mentor entries (like "Industry Specialized", "Our Mentors", etc.)
    const invalidNames = [
      "Industry Specialized",
      "Our Mentors",
      "Why Creator",
      "Embrace New",
      "Expertisor Academy",
      "Works Course",
    ];
    return mentor.name && !invalidNames.includes(mentor.name);
  })
  .map((mentor, index) => ({
    id: `scraped-${index}`,
    userId: `scraped-user-${index}`,
    slug: mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    displayName: mentor.name,
    headline: mentor.title || mentor.expertise?.join(", ") || "Expert Mentor",
    bio:
      mentor.bio ||
      `Professional mentor specializing in ${mentor.expertise?.join(", ") || "various domains"}`,
    avatarUrl: mentor.avatarUrl || null,
    pricingAmount: mentor.price ? mentor.price * 100 : 250000, // Convert to paise
    pricingCurrency: mentor.currency || "INR",
    meetingDuration: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    calendarTimezone: "Asia/Kolkata",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

