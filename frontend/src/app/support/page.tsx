import { PageShell } from "@/components/layout/page-shell";

export default function SupportPage() {
  return (
    <PageShell className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-base-foreground">Support</h1>
        <p className="text-sm text-muted-foreground">
          Get help with bookings, instructor onboarding, and integrations.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-muted/70 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-base-foreground">Knowledge base</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse setup guides, API docs, and best practices for running your booking workflow.
          </p>
        </div>
        <div className="rounded-3xl border border-muted/70 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-base-foreground">Contact us</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reach out at support@booking-platform.dev and we&apos;ll respond within one business day.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

