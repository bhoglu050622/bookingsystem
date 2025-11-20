import { InstructorCard } from "@/components/instructors/instructor-card";
import type { InstructorProfile } from "@/lib/types";

type InstructorGridProps = {
  instructors: InstructorProfile[];
};

export function InstructorGrid({ instructors }: InstructorGridProps) {
  if (instructors.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-muted/80 bg-white/70 p-12 text-center text-muted-foreground">
        We&apos;re onboarding new experts right now. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {instructors.map((instructor) => (
        <InstructorCard key={instructor.id} instructor={instructor} />
      ))}
    </div>
  );
}

