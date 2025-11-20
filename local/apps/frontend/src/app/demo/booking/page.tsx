"use client";

import { useMemo, useState, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateSelector } from "@/components/booking/date-selector";
import { Calendar } from "@/components/booking/calendar";
import { SlotList } from "@/components/booking/slot-list";
import { BookingSummary } from "@/components/booking/booking-summary";
import type { AvailabilitySlot } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

type Service = {
  id: string;
  title: string;
  description: string;
  duration: number;
  priceAmount: number;
  priceCurrency: string;
};

// Use real AvailabilitySlot shape so UI components render time labels
type DemoSlot = AvailabilitySlot;

const demoServices: Service[] = [
  {
    id: "service-30",
    title: "30-minute Mentorship Call",
    description: "Focused discussion designed to unblock you quickly.",
    duration: 30,
    priceAmount: 2999,
    priceCurrency: "INR",
  },
  {
    id: "service-60",
    title: "60-minute Deep Dive",
    description: "Comprehensive session with actionable guidance.",
    duration: 60,
    priceAmount: 4999,
    priceCurrency: "INR",
  },
];

function generateDemoSlots(dateIso: string): DemoSlot[] {
  const base = new Date(dateIso);
  const slots: DemoSlot[] = [];
  for (let i = 9; i <= 17; i += 2) {
    const start = new Date(base);
    start.setUTCHours(i, 0, 0, 0);
    const end = new Date(base);
    end.setUTCHours(i + 1, 0, 0, 0);
    const startLocal = start.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const endLocal = end.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    slots.push({
      id: `slot-${i}`,
      instructorProfileId: "demo-instructor",
      startTimeUtc: start.toISOString(),
      endTimeUtc: end.toISOString(),
      startTimeLocal: startLocal,
      endTimeLocal: endLocal,
      timezone: "UTC",
      status: "AVAILABLE",
      isLocked: false,
      lockedUntil: null,
      hasBooking: false,
    });
  }
  return slots;
}

type Step =
  | "service"
  | "schedule"
  | "details"
  | "payment"
  | "confirm";

const themeOptions = [
  { id: "topmate", label: "Topmate-inspired" },
  { id: "calendly", label: "Calendly-inspired" },
  { id: "serene", label: "Serene Minimal" },
];

export default function DemoBookingPage() {
  const [step, setStep] = useState<Step>("service");
  const [theme, setTheme] = useState<string>("topmate");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(
    useMemo(() => {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d.toISOString();
    }, [])
  );
  const [slots, setSlots] = useState<DemoSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [meetLink, setMeetLink] = useState<string>("");
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setSlots(generateDemoSlots(selectedDateIso));
  }, [selectedDateIso]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!calendarConnected) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [calendarConnected]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) ?? null,
    [slots, selectedSlotId]
  );

  const canContinueService = !!selectedService;
  const canContinueSchedule = !!selectedSlotId;
  const canContinueDetails = clientName.trim().length > 0 && /.+@.+/.test(clientEmail);

  const handlePay = async () => {
    setIsProcessingPayment(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessingPayment(false);
    setConfirmed(true);
    setStep("confirm");
  };

  const generateMeetCode = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const code = Math.abs(hash).toString(36).padEnd(10, "0").substring(0, 10);
    return `${code.substring(0, 3)}-${code.substring(3, 7)}-${code.substring(7, 10)}`;
  };

  const handleAddToCalendar = () => {
    if (!selectedSlot) return;
    const seed = `${selectedSlot.id}-${selectedSlot.startTimeUtc}`;
    const code = generateMeetCode(seed);
    const link = `https://meet.google.com/${code}`;
    setMeetLink(link);
    // lock until 5 minutes before meeting start
    const start = new Date(selectedSlot.startTimeUtc);
    const unlock = new Date(start.getTime() - 5 * 60 * 1000);
    setUnlockTime(unlock);
    setCalendarConnected(true);
  };

  return (
    <PageShell className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-3xl font-semibold">Demo Booking Experience</h1>
        <div className="flex items-center gap-2">
          <Select value={theme} onChange={(e) => setTheme(e.currentTarget.value)}>
            {themeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Button variant="ghost" onClick={() => setStep("service")}>Restart</Button>
        </div>
      </div>

      <Card className="p-6 rounded-xl shadow-subtle animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={step === "service" ? "font-semibold text-primary" : ""}>Service</span>
            <span>→</span>
            <span className={step === "schedule" ? "font-semibold text-primary" : ""}>Schedule</span>
            <span>→</span>
            <span className={step === "details" ? "font-semibold text-primary" : ""}>Your Info</span>
            <span>→</span>
            <span className={step === "payment" ? "font-semibold text-primary" : ""}>Payment</span>
            <span>→</span>
            <span className={step === "confirm" ? "font-semibold text-primary" : ""}>Confirm</span>
          </div>
          <div>
            {step !== "confirm" && (
              <Button
                variant="primary"
                disabled={
                  (step === "service" && !canContinueService) ||
                  (step === "schedule" && !canContinueSchedule) ||
                  (step === "details" && !canContinueDetails)
                }
                onClick={() => {
                  if (step === "service" && canContinueService) setStep("schedule");
                  else if (step === "schedule" && canContinueSchedule) setStep("details");
                  else if (step === "details" && canContinueDetails) setStep("payment");
                }}
              >
                Continue
              </Button>
            )}
          </div>
        </div>

        {step === "service" && (
          <div className="grid gap-4 md:grid-cols-2">
            {demoServices.map((svc) => (
              <button
                key={svc.id}
                className={`rounded-xl border p-5 text-left hover:shadow-subtle ${
                  selectedService?.id === svc.id ? "border-primary bg-primary-muted" : ""
                }`}
                onClick={() => setSelectedService(svc)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-base-foreground">{svc.title}</h3>
                  <span className="text-sm font-medium text-primary">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: svc.priceCurrency,
                    }).format(svc.priceAmount / 100)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{svc.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Duration: {svc.duration} minutes</p>
              </button>
            ))}
          </div>
        )}

        {step === "schedule" && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pick a date</h3>
                <Button variant="ghost">Switch to calendar</Button>
              </div>
              <DateSelector selected={selectedDateIso} onChange={setSelectedDateIso} />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Available slots</h3>
                {slots.length === 0 ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                ) : (
                  <SlotList
                    slots={slots}
                    selectedSlotId={selectedSlotId}
                    onSelect={(slot) => setSelectedSlotId(slot.id)}
                    isLoading={false}
                  />
                )}
              </div>
            </div>
            <div className="space-y-4">
              <BookingSummary
                instructor={{
                  id: "demo-instructor",
                  displayName: "Demo Mentor",
                  pricingAmount: selectedService?.priceAmount ?? 2999,
                  pricingCurrency: selectedService?.priceCurrency ?? "INR",
                  meetingDuration: selectedService?.duration ?? 30,
                } as any}
                slot={selectedSlot ?? undefined}
                paymentCompleted={step === "confirm"}
                amountPaid={selectedService?.priceAmount ?? 2999}
                currency={selectedService?.priceCurrency ?? "INR"}
              />
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setStep("details")}
                disabled={!canContinueSchedule}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Your name</label>
              <Input placeholder="Jane Doe" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input placeholder="jane@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setStep("payment")}
                disabled={!canContinueDetails}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Complete Payment</h3>
            <div className="rounded-xl border bg-muted/40 p-6">
              <p className="text-sm text-muted-foreground mb-3">This is a mock payment screen for demo purposes.</p>
              <Button
                variant="primary"
                className="w-full py-6 text-base font-semibold"
                onClick={handlePay}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? "Processing…" : "Pay Now"}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">No charges will be applied.</p>
            </div>
          </div>
        )}

        {step === "confirm" && confirmed && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-subtle animate-fade-in">
              ✓
            </div>
            <h3 className="text-2xl font-semibold">Booking Confirmed</h3>
            <p className="text-sm text-muted-foreground">A confirmation email has been sent to {clientEmail}.</p>
            <div className="grid gap-3 md:grid-cols-2 max-w-xl mx-auto">
              <Button variant="primary" onClick={handleAddToCalendar}>Add to Calendar</Button>
              <Button variant="ghost" onClick={() => setStep("service")}>Book another</Button>
            </div>
            {calendarConnected && (
              <div className="rounded-xl border bg-white p-6 shadow-subtle max-w-xl mx-auto text-left animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-base-foreground">Calendar Connected</h4>
                  <span className="text-xs rounded-full bg-primary-muted px-2 py-1 text-primary font-semibold">Mock</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Your event has been added to the calendar. A unique meeting link has been generated.</p>
                <div className="rounded-lg border bg-muted/40 p-4 mb-4">
                  <div className="text-xs text-muted-foreground mb-1">Meeting link</div>
                  <a href={meetLink} className="text-sm font-semibold text-primary break-all" target="_blank" rel="noreferrer">
                    {meetLink}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {unlockTime && now < unlockTime ? (
                      <span>
                        Locked • Opens in {Math.max(0, Math.floor((unlockTime.getTime() - now.getTime()) / 60000))}m {Math.max(0, Math.floor(((unlockTime.getTime() - now.getTime()) % 60000) / 1000))}s
                      </span>
                    ) : (
                      <span className="text-success">Unlocked • You can join now</span>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    disabled={unlockTime ? now < unlockTime : true}
                    onClick={() => window.open(meetLink, "_blank")}
                  >
                    Join Meeting
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
