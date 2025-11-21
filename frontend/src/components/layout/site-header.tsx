'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

type SiteHeaderProps = {
  className?: string;
};

const baseNavigation = [
  { label: "Find Mentors", href: "/instructors" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteHeader({ className }: SiteHeaderProps) {
  const { user } = useAuthState();
  const { logout } = useAuthActions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userLabel = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-muted shadow-sm",
        className,
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="text-xl font-bold text-base-foreground">
            Topmate
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {baseNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
          
          {/* Search */}
          <button className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-muted-foreground hover:bg-primary-muted hover:text-primary transition-all">
            <Search className="h-4 w-4" />
            <span>Search mentors</span>
          </button>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {userLabel?.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">Dashboard</span>
              </Link>
              <Button 
                variant="ghost" 
                onClick={logout}
                className="text-muted-foreground hover:text-primary"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Sign in
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-primary hover:bg-primary-dark text-white shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-4 space-y-4">
            {baseNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-muted-foreground hover:text-primary transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {!user && (
              <div className="pt-4 space-y-3">
                <Link 
                  href="/auth/login"
                  className="block w-full text-center py-2 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

