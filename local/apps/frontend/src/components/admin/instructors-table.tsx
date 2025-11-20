import { AdminInstructor } from "@/lib/types";
import { Button } from "@/components/ui/button";

type InstructorsTableProps = {
  instructors: AdminInstructor[];
  onToggleActive: (id: string, active: boolean) => void;
};

export function InstructorsTable({ instructors, onToggleActive }: InstructorsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-muted/70 bg-white/80 shadow-subtle">
      <table className="min-w-full divide-y divide-muted/40 text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Instructor</th>
            <th className="px-4 py-3 text-left font-semibold">Pricing</th>
            <th className="px-4 py-3 text-left font-semibold">Duration</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted/40 text-base-foreground">
          {instructors.map((instructor) => (
            <tr key={instructor.id}>
              <td className="px-4 py-4">
                <div className="font-semibold">{instructor.displayName}</div>
                <div className="text-xs text-muted-foreground">{instructor.user.email}</div>
              </td>
              <td className="px-4 py-4">
                ₹{(instructor.pricingAmount / 100).toLocaleString("en-IN")} {instructor.pricingCurrency}
              </td>
              <td className="px-4 py-4">{instructor.meetingDuration} min</td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {instructor.active ? "Active" : "Paused"}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <Button
                  variant="secondary"
                  onClick={() => onToggleActive(instructor.id, !instructor.active)}
                >
                  {instructor.active ? "Pause" : "Activate"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

