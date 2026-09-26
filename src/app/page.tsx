import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Errby · Teach. Spot mistakes. Explain your thinking.",
  description:
    "Teach a curious AI, catch its deliberate mistakes and explain your thinking. Explore a fictional Errby example and the planned teacher workflow.",
};

export default function Home() {
  return <LandingPage />;
}
