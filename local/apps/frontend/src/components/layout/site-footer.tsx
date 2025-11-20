import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Expertisor Academy
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Connect with expert mentors worldwide. Learn, grow, and achieve your goals through personalized 1-on-1 sessions.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="rounded-full bg-gray-800 hover:bg-gray-700 h-10 w-10 p-0">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="rounded-full bg-gray-800 hover:bg-gray-700 h-10 w-10 p-0">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="rounded-full bg-gray-800 hover:bg-gray-700 h-10 w-10 p-0">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="rounded-full bg-gray-800 hover:bg-gray-700 h-10 w-10 p-0">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* For Mentees */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Mentees</h3>
            <nav className="space-y-3">
              <Link href="/instructors" className="block text-gray-400 hover:text-white transition-colors">
                Find Mentors
              </Link>
              <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
            </nav>
          </div>

          {/* For Mentors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Mentors</h3>
            <nav className="space-y-3">
              <Link href="/support" className="block text-gray-400 hover:text-white transition-colors">
                Support
              </Link>
            </nav>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact & Support</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="h-5 w-5" />
                <span>support@mentorconnect.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="h-5 w-5" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="h-5 w-5" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            <nav className="space-y-3 pt-2">
              <Link href="/support" className="block text-gray-400 hover:text-white transition-colors">
                Support
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} MentorConnect. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

