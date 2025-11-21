import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Booking Platform — Sessions, simplified",
  description:
    "Topmate-style booking flows with multi-instructor scheduling, payments, and Meet automation.",
  metadataBase: new URL("https://booking-platform.example.com"),
  openGraph: {
    title: "Booking Platform",
    description:
      "Powerful scheduling and payments with a delightful booking experience for experts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> 
        <ErrorBoundary>
          <Providers>
            <div className="flex min-h-screen flex-col bg-base">
              <SiteHeader />
              <div className="flex-1 pb-16 pt-8">{children}</div>
              <SiteFooter />
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
