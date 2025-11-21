import { notFound } from "next/navigation";
import { fetchInstructor } from "@/services/instructors";
import { HARDCODED_INSTRUCTORS } from "@/data/hardcoded-instructors";
import { BookingExperience } from "@/components/booking/booking-experience";
import { PageShell } from "@/components/layout/page-shell";
import { formatCurrency } from "@/lib/utils";

type InstructorPageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return HARDCODED_INSTRUCTORS.map((instructor) => ({
    slug: instructor.slug,
  }));
}

export async function generateMetadata({ params }: InstructorPageProps) {
  const { slug } = params;
  if (!slug) {
    return { title: "Instructor not found" };
  }
  const instructor = await fetchInstructor(slug).catch(() => null);

  if (!instructor) {
    return {
      title: "Instructor not found",
    };
  }

  return {
    title: `${instructor.displayName} — Book a session`,
    description: instructor.headline ?? instructor.bio ?? "Expert-led mentoring session.",
  };
}

export default async function InstructorPage({ params }: InstructorPageProps) {
  const { slug } = params;
  if (!slug) {
    notFound();
  }
  const instructor = await fetchInstructor(slug).catch(() => null);

  if (!instructor) {
    notFound();
  }

  const priceLabel = formatCurrency(
    instructor.pricingAmount,
    instructor.pricingCurrency,
  );

  return (
    <PageShell className="space-y-12">
      <section className="rounded-xl border border-muted/50 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-muted px-3 py-1 text-xs font-semibold text-primary">
                ✓ Verified Mentor
              </span>
              <h1 className="text-4xl font-semibold text-base-foreground mb-2">
                {instructor.displayName}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {instructor.headline ?? "Trusted mentor helping you ship faster."}
              </p>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              {instructor.bio ??
                "Craft tailored sessions around strategy, execution, and career growth. Bring your agenda, and we will collaborate to unblock your next milestone."}
            </p>
          </div>
          <div className="rounded-xl border-2 border-primary bg-primary-muted/30 p-6 text-center shadow-sm lg:min-w-[200px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
              Rate per session
            </div>
            <div className="text-3xl font-bold text-primary mb-1">
              {priceLabel}
            </div>
            <div className="text-sm text-muted-foreground">
              {instructor.meetingDuration}-minute session
            </div>
          </div>
        </div>
      </section>

      <BookingExperience instructor={instructor} />
    </PageShell>
  );
}

