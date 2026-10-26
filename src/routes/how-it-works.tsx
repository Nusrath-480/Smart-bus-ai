import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/public-layout";
import { FinalCta, HowItWorks, PageHeader, SmartAI } from "@/components/site/sections";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — SmartBus-AI" },
      { name: "description", content: "Sign in, track your bus, check predicted occupancy, and find an alternative when needed." },
      { property: "og:title", content: "How It Works — SmartBus-AI" },
      { property: "og:description", content: "Four simple steps to a smarter college commute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PublicLayout>
      <PageHeader title="How It Works" subtitle="From sign-in to boarding — the SmartBus-AI journey in four steps." />
      <HowItWorks />
      <SmartAI />
      <FinalCta />
    </PublicLayout>
  ),
});
