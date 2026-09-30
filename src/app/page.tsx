import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Errby — Learn by teaching",
  description:
    "Explore Errby’s approach to learning through explanation: teach a concept, work through misunderstandings, and review progress against lesson goals.",
};

export default function Home() {
  return <LandingPage />;
}
