import type { Metadata } from "next";
import "./globals.css";
import { Manrope, Figtree } from "next/font/google";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({subsets:['latin'],variable:'--font-heading'});

const manrope = Manrope({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Errby · Teach a curious mind",
  description: "A local development preview of Errby's learning workspace.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", manrope.variable, figtreeHeading.variable)}>
      <body>{children}</body>
    </html>
  );
}
