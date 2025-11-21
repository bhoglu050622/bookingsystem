import { Suspense } from "react";
import { InstructorShowcase } from "@/components/instructors/instructor-showcase";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Browse instructors",
};

export default function InstructorsPage() {
  return (
    <PageShell className="flex flex-col gap-10 min-h-screen">
      <div className="flex flex-col gap-3 animate-fade-in-up">
        <h1 className="text-4xl font-semibold text-base-foreground tracking-tight">
          Find Your Perfect Mentor
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Browse verified experts across product, design, engineering, and more. Book 1-on-1 sessions tailored to your goals.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-48 rounded-3xl" />}>
        <InstructorShowcase />
      </Suspense>
    </PageShell>
  );
}

