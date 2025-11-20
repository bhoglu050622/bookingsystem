import { Shield, Calendar, Video, Clock, Heart, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Experts",
    description: "All mentors are thoroughly vetted with proven industry experience and track records.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Calendar,
    title: "Instant Booking",
    description: "Book sessions in under 2 minutes with real-time availability and automated scheduling.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Video,
    title: "HD Video Calls",
    description: "Crystal clear video sessions with screen sharing and recording capabilities.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Clock,
    title: "Flexible Timing",
    description: "Schedule sessions at your convenience with 24/7 availability across time zones.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Heart,
    title: "Personalized Match",
    description: "AI-powered matching connects you with the perfect mentor for your goals.",
    color: "from-rose-500 to-pink-500"
  },
  {
    icon: TrendingUp,
    title: "Proven Results",
    description: "95% of users report achieving their career goals within 3 months.",
    color: "from-indigo-500 to-purple-500"
  }
];

export function FeatureGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl font-bold tracking-tight text-base-foreground sm:text-4xl mb-4">
            Why choose our platform?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need for successful mentorship and career growth
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 border border-muted shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                
                {/* Icon */}
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-base-foreground mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Arrow indicator */}
                <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more
                  <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

