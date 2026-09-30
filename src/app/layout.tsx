import type { Metadata } from "next";
import "./globals.css";
import { Manrope, Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { env } from "@/lib/env/server";
import { AuthSession } from "@/components/auth-session";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Errby · Teach a curious mind",
  description: "A local development preview of Errby's learning workspace.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn("font-sans", manrope.variable, figtreeHeading.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const dark=localStorage.getItem('errby-theme')==='dark';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch{}",
          }}
        />
      </head>
      <body>
        {env.ERRBY_MODE === "live" ? (
          <ClerkProvider
            dynamic
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/learn"
            signUpFallbackRedirectUrl="/learn"
            allowedRedirectOrigins={[env.ERRBY_APP_ORIGIN!]}
            appearance={{
              theme: shadcn,
              variables: {
                colorPrimary: "var(--primary)",
                colorBackground: "var(--surface)",
                colorForeground: "var(--text)",
                colorPrimaryForeground: "var(--primary-text)",
              },
            }}
          >
            <AuthSession>{children}</AuthSession>
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
