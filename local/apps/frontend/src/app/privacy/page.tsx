import { PageShell } from "@/components/layout/page-shell";

export default function PrivacyPage() {
  return (
    <PageShell className="space-y-4 text-sm text-muted-foreground">
      <h1 className="text-3xl font-semibold text-base-foreground">Privacy policy</h1>
      <p>
        We collect only the data required to power your booking experience—profile information,
        availability, and payment identifiers. Session metadata is encrypted in transit and at rest.
      </p>
      <p>
        Booking Platform never shares customer data with third parties beyond configured processors
        such as Razorpay, Google, SendGrid, and Twilio. You can request data export or deletion at
        any time by emailing privacy@booking-platform.dev.
      </p>
    </PageShell>
  );
}

