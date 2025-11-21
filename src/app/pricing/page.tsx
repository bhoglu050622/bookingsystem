import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    description: "For creators getting started with 1:1 sessions.",
    features: [
      "Single instructor profile",
      "Up to 20 bookings / month",
      "Email reminders",
    ],
  },
  {
    name: "Growth",
    price: "₹4,999",
    badge: "Popular",
    description: "Multi-instructor teams with automation and payments.",
    features: [
      "Unlimited instructors",
      "Automated payments & refunds",
      "Google Meet automation",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    price: "Let’s talk",
    description: "For marketplaces and academies with custom workflows.",
    features: [
      "Dedicated success manager",
      "Advanced analytics",
      "Webhook notifications",
      "SLA-backed support",
    ],
  },
];

export default function PricingPage() {
  return (
    <PageShell className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-base-foreground">Flexible plans for every team</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Start for free and upgrade when you need multi-instructor automation, payments, and CRM integrations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="rounded-3xl border border-muted/70 bg-white/80 p-8 shadow-subtle"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-base-foreground">{plan.name}</h2>
              {plan.badge ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {plan.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
            <div className="mt-6 text-3xl font-semibold text-base-foreground">{plan.price}</div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary/70" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={plan.badge ? "primary" : "secondary"}>
              Choose plan
            </Button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

