import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { InstructorProfile } from "@/lib/types";
import { Star, Video, Clock, CheckCircle } from "lucide-react";

type InstructorCardProps = {
  instructor: InstructorProfile;
  className?: string;
};

export function InstructorCard({ instructor, className }: InstructorCardProps) {
  const priceLabel = formatCurrency(instructor.pricingAmount, instructor.pricingCurrency);
  
  // Mock data for demo purposes
  const rating = 4.8;
  const reviewCount = Math.floor(Math.random() * 100) + 20;
  const isOnline = Math.random() > 0.5;
  const nextAvailable = "Tomorrow, 2:00 PM";

  return (
    <Card className={cn("group relative overflow-hidden rounded-xl border border-muted/50 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/50 animate-fade-in-up", className)}>
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-muted/50 to-accent-muted/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative">
        {/* Header with avatar and status */}
        <CardHeader className="p-0 mb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {instructor.displayName.slice(0, 2).toUpperCase()}
              </div>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-white" />
              )}
            </div>
            
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-base-foreground group-hover:text-primary transition-colors">
                {instructor.displayName}
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                {instructor.headline ?? "Expert instructor"}
              </CardDescription>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-base-foreground">{rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Bio */}
        <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
          {instructor.bio ?? "Personalised mentoring sessions to help you move faster."}
        </p>
        
        {/* Key features */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-success" />
            <span>Verified expert</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4 text-primary" />
            <span>HD video calls</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-accent" />
            <span>Available {nextAvailable}</span>
          </div>
        </div>
        
        {/* Footer with price and CTA */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="text-2xl font-bold text-base-foreground">
              {priceLabel}
            </div>
            <div className="text-sm text-muted-foreground">
              for {instructor.meetingDuration} min session
            </div>
          </div>
          
          <Link
            href={`/instructors/${instructor.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary-hover hover:shadow-lg active:scale-95"
          >
            Book Session
          </Link>
        </div>
      </div>
    </Card>
  );
}

