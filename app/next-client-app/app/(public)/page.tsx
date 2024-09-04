import CallToAction from "@/components/homepage/CTA";
import BentoProjects from "@/components/homepage/bentoProjects";
import Features from "@/components/homepage/features";
import Funders from "@/components/homepage/funders";
import Hero from "@/components/homepage/hero";
import { cn } from "@/lib/utils";
import AnimatedGridPattern from "@/components/magicui/animated-grid-pattern";

export default function Default() {
  return (
    <>
      {/* Background */}
      <AnimatedGridPattern
        numSquares={60}
        maxOpacity={0.15}
        duration={1.2}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-full skew-y-12 mt-[200px] overflow-hidden"
        )}
      />{" "}
      {/* Content */}
      <div className="space-y-12 lg:space-y-32">
        <Hero />
        {process.env.ENABLE_FEATURES_SECTION === "true" && <Features />}
        {process.env.ENABLE_PROJECTS_SECTION === "true" && <BentoProjects />}
        {process.env.ENABLE_FUNDERS_SECTION === "true" && <Funders />}
        <CallToAction />
      </div>
    </>
  );
}
