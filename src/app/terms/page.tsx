import { PageShell } from "@/components/layout/page-shell";

export default function TermsPage() {
  return (
    <PageShell className="space-y-4 text-sm text-muted-foreground">
      <h1 className="text-3xl font-semibold text-base-foreground">Terms of service</h1>
      <p>
        By using Booking Platform you agree to our acceptable use policy and acknowledge that all
        sessions are subject to instructor availability and timely payments. Instructors are
        responsible for keeping availability accurate and honouring confirmed sessions.
      </p>
      <p>
        Payments are processed through Razorpay. Refunds for cancellations follow the timeline
        defined in your workspace settings. We reserve the right to suspend access for behaviour
        that violates these terms or applicable laws.
      </p>
    </PageShell>
  );
}

