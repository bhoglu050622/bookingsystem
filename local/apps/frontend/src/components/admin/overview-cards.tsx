import { AdminOverview } from "@/lib/types";

type OverviewCardsProps = {
  data?: AdminOverview;
};

const cards = [
  { key: "users", label: "Total users" },
  { key: "instructors", label: "Instructors" },
  { key: "bookings", label: "Bookings" },
  { key: "upcoming", label: "Upcoming sessions" },
];

export function OverviewCards({ data }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-3xl border border-muted/60 bg-white/80 p-5 shadow-subtle"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {card.label}
          </div>
          <div className="mt-2 text-3xl font-semibold text-base-foreground">
            {data ? data[card.key as keyof AdminOverview] : "—"}
          </div>
        </div>
      ))}
      <div className="rounded-3xl border border-muted/60 bg-primary/90 p-5 text-primary-foreground shadow-subtle">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
          Lifetime revenue
        </div>
        <div className="mt-2 text-3xl font-semibold">
          ₹{((data?.revenue ?? 0) / 100).toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}

