import type { InstructorProfile, AvailabilitySlot } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type BookingSummaryProps = {
  instructor: InstructorProfile;
  slot?: AvailabilitySlot | null;
  paymentCompleted?: boolean;
  amountPaid?: number;
  currency?: string;
};

export function BookingSummary({ instructor, slot, paymentCompleted, amountPaid, currency }: BookingSummaryProps) {
  return (
    <div className="rounded-xl border border-muted/50 bg-white p-6 shadow-sm lg:sticky lg:top-24 animate-fade-in">
      <h3 className="text-lg font-semibold text-base-foreground mb-6">Booking Summary</h3>
      <dl className="space-y-4 text-sm">
        <div className="flex justify-between items-center pb-3 border-b border-muted/50">
          <dt className="text-muted-foreground font-medium">Mentor</dt>
          <dd className="font-semibold text-base-foreground">{instructor.displayName}</dd>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-muted/50">
          <dt className="text-muted-foreground font-medium">Duration</dt>
          <dd className="font-semibold text-base-foreground">{instructor.meetingDuration} min</dd>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-muted/50">
          <dt className="text-muted-foreground font-medium">Price</dt>
          <dd className="font-bold text-primary text-xl">
            {formatCurrency(instructor.pricingAmount, instructor.pricingCurrency)}
          </dd>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-muted/50">
          <dt className="text-muted-foreground font-medium">Payment</dt>
          <dd className={`font-semibold ${paymentCompleted ? "text-success" : "text-muted-foreground"}`}>
            {paymentCompleted
              ? `Paid • ${formatCurrency(amountPaid ?? instructor.pricingAmount, currency ?? instructor.pricingCurrency)}`
              : "Not paid"}
          </dd>
        </div>
        <div className="flex justify-between items-start pt-2">
          <dt className="text-muted-foreground font-medium">Time</dt>
          <dd className="font-semibold text-base-foreground text-right">
            {slot ? (
              <span>
                {slot.startTimeLocal}
                <span className="block text-xs text-muted-foreground mt-1 font-normal">{slot.timezone}</span>
              </span>
            ) : (
              <span className="text-muted-foreground italic font-normal">Select a time</span>
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-6 pt-4 border-t border-muted/50">
        <p className="text-xs text-muted-foreground">
          You can reschedule or cancel up to 24 hours before the session.
        </p>
      </div>
    </div>
  );
}
