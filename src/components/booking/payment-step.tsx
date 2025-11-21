"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { InstructorProfile } from "@/lib/types";

type PaymentStepProps = {
  instructor: InstructorProfile;
  onPaymentSuccess: () => void;
};

export function PaymentStep({ instructor, onPaymentSuccess }: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing (instant success)
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setIsProcessing(false);
    onPaymentSuccess();
  };

  return (
    <div className="rounded-xl border border-muted/50 bg-white p-8 shadow-sm">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-base-foreground mb-2">Complete Payment</h2>
          <p className="text-sm text-muted-foreground">
            Please complete payment to proceed with booking a time slot.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-muted/50 bg-muted/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mentor</p>
                <p className="text-lg font-semibold text-base-foreground">{instructor.displayName}</p>
              </div>
              {instructor.avatarUrl && (
                <img
                  src={instructor.avatarUrl}
                  alt={instructor.displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
            </div>
            
            <div className="pt-4 border-t border-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Session Duration</span>
                <span className="text-sm font-medium text-base-foreground">{instructor.meetingDuration} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(instructor.pricingAmount, instructor.pricingCurrency)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handlePayNow}
            disabled={isProcessing}
            className="w-full py-6 text-base font-semibold"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
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
                Processing Payment...
              </span>
            ) : (
              "Pay Now"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This is a mock payment. No charges will be applied.
          </p>
        </div>
      </div>
    </div>
  );
}

