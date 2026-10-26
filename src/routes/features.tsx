import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/public-layout";
import { Features, FinalCta, PageHeader, SmartAI } from "@/components/site/sections";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — SmartBus-AI" },
      { name: "description", content: "Live tracking, ETA and occupancy prediction, smart recommendations, alerts and fleet management." },
      { property: "og:title", content: "Features — SmartBus-AI" },
      { property: "og:description", content: "Everything a college commute needs, in one app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PublicLayout>
      <PageHeader title="Features" subtitle="Tracking, predictions and management tools built for college transport." />
      <Features />
      <SmartAI />
      <FinalCta />
    </PublicLayout>
  ),
});
