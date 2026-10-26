import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/public-layout";
import { About, Features, FinalCta, Hero, HowItWorks, SmartAI } from "@/components/site/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartBus-AI — Your Journey. Made Smarter." },
      { name: "description", content: "Live college bus tracking, smart ETA and occupancy predictions, and alternative-bus suggestions." },
      { property: "og:title", content: "SmartBus-AI — Your Journey. Made Smarter." },
      { property: "og:description", content: "Smarter campus mobility through real-time tracking and intelligent predictions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicLayout>
      <Hero />
      <Features />
      <HowItWorks />
      <SmartAI />
      <About />
      <FinalCta />
    </PublicLayout>
  );
}
