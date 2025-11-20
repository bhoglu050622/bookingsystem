"use client";

import { Suspense } from "react";
import { useInstructors } from "@/hooks/use-instructors";
import { InstructorGrid } from "@/components/instructors/instructor-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

function InstructorGridSkeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-80 rounded-2xl" />
      ))}
    </div>
  );
}

function InstructorGridContent() {
  const { data = [], isLoading } = useInstructors();

  if (isLoading) {
    return <InstructorGridSkeleton />;
  }

  return <InstructorGrid instructors={data} />;
}

export function InstructorShowcase() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50/50">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Trending Mentors
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-base-foreground sm:text-4xl mb-4">
            Connect with Industry Leaders
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Get personalized guidance from verified experts who have helped thousands advance their careers
          </p>
        </div>

        {/* Instructor Grid */}
        <Suspense fallback={<InstructorGridSkeleton />}>
          <InstructorGridContent />
        </Suspense>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link 
            href="/instructors"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition-colors"
          >
            View all mentors
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

