import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, Calendar } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-primary-dark px-6 py-20 sm:px-12 lg:py-28">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/20 via-transparent to-transparent" />
      
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 text-center lg:flex-row lg:text-left">
        <div className="flex-1 space-y-8 animate-fade-in-up">
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-sm text-white shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.9/5 from 2,000+ reviews</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-sm text-white shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Users className="h-4 w-4" />
              <span className="font-medium">10,000+ sessions booked</span>
            </div>
          </div>

          {/* Main headline */}
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Book 1-on-1 sessions with
              <span className="block bg-gradient-to-r from-white via-yellow-50 to-orange-50 bg-clip-text text-transparent mt-2">
                top industry experts
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-lg text-blue-50/90 sm:text-xl lg:mx-0 leading-relaxed">
              Get personalized mentorship, career guidance, and skill development from verified professionals who&apos;ve been where you want to go.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <Button 
              className="bg-white text-primary hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 rounded-xl"
              asChild
            >
              <Link href="/instructors" className="gap-2">
                Find your mentor
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              variant="secondary" 
              className="border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-8 py-4 text-lg font-semibold bg-transparent backdrop-blur-sm transition-all duration-300 rounded-xl"
              asChild
            >
              <Link href="/signup">Become a mentor</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8">
            <div className="text-center lg:text-left">
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-blue-100">Expert mentors</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-sm text-blue-100">Industries covered</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-2xl font-bold text-white">15 min</div>
              <div className="text-sm text-blue-100">Average booking time</div>
            </div>
          </div>
        </div>

        {/* Hero image/illustration */}
        <div className="flex-1">
          <div className="relative mx-auto max-w-md">
            <div className="absolute -inset-4 bg-gradient-to-r from-accent to-primary opacity-20 blur-2xl rounded-full" />
            <div className="relative rounded-2xl bg-white/10 p-8 backdrop-blur-sm border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg" />
                  <div>
                    <div className="font-semibold text-white">Sarah Chen</div>
                    <div className="text-sm text-blue-100">Senior Product Manager</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-50">
                    <Calendar className="h-4 w-4" />
                    <span>Available tomorrow at 2:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-50">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.9/5 (127 reviews)</span>
                  </div>
                </div>
                <Button className="w-full bg-white text-primary hover:bg-blue-50 shadow-lg">
                  Book session - $75
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

