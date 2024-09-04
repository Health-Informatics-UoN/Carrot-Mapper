import CallToAction from "@/components/homepage/CTA";
import BentoProjects from "@/components/homepage/bentoProjects";
import Features from "@/components/homepage/features";
import Funders from "@/components/homepage/funders";
import Hero from "@/components/homepage/hero";

export default function Default() {
  return (
    <div className="space-y-12 lg:space-y-28">
      <Hero />
      <Features />
      <BentoProjects />
      <Funders />
      <CallToAction />
    </div>
  );
}
