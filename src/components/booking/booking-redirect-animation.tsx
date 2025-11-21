"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BookingRedirectAnimationProps = {
  onComplete?: () => void;
};

export function BookingRedirectAnimation({ onComplete }: BookingRedirectAnimationProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    // Animate progress from 0% to 100% over 2.5 seconds
    const duration = 2500;
    const startTime = Date.now();
    const interval = 50; // Update every 50ms

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        setTimeout(updateProgress, interval);
      } else {
        // Show checkmark for a moment before redirecting
        setShowCheckmark(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
          router.push("/dashboard?booking=success");
        }, 500);
      }
    };

    updateProgress();
  }, [router, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="w-full max-w-md px-6">
        <div className="text-center space-y-6">
          {!showCheckmark ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative w-20 h-20">
                  <svg
                    className="animate-spin h-20 w-20 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-base-foreground mb-2">
                Creating your booking...
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Please wait while we confirm your session
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round(progress)}% complete
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-base-foreground mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

