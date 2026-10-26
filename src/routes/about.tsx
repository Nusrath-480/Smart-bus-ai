import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/public-layout";
import { About, FinalCta, PageHeader } from "@/components/site/sections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SmartBus-AI" },
      { name: "description", content: "Why we built SmartBus-AI: reliable, predictable college bus journeys for every student." },
      { property: "og:title", content: "About — SmartBus-AI" },
      { property: "og:description", content: "Smarter campus mobility through real-time tracking and intelligent predictions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PublicLayout>
      <PageHeader title="About SmartBus-AI" subtitle="Smarter campus mobility through real-time tracking and intelligent predictions." />
      <About />
      <FinalCta />
    </PublicLayout>
  ),
});
