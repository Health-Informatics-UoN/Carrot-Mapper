import { AnimatedBeamMapping } from "@/components/AnimatedBeamMapping";
import AnimatedGridPattern from "@/components/magicui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import Features from "../demo-2/features";
import Funders from "../demo-2/funders";
import CallToAction from "../demo-2/CTA";

export default function Demo1() {
  return (
    <>
      {/* Hero section */}
      <div className="relative lg:flex w-full items-center justify-center lg:p-32 p-5">
        <div className="flex flex-col lg:space-y-5 space-y-3">
          <div className="lg:text-5xl text-3xl gap-5 text-center lg:text-left">
            <h1 className="text-orange-600">OMOP Transforming </h1>
            <h1> Made Easy</h1>
          </div>
          <h3 className="text-gray text-gray-600 dark:text-gray-200 sm:text-lg text-md mt-2 text-justify lg:text-left">
            Carrot-Mapper utilizes WhiteRabbit metadata to generate JSON mapping
            rules to the OMOP standard, offering{" "}
            <span className="text-orange-600">
              automated vocabulary mapping, rule reuse, and manual rule creation
            </span>
            . Data standardization efficiency for improved research
            interoperability.
          </h3>
        </div>
        <AnimatedGridPattern
          numSquares={60}
          maxOpacity={0.2}
          duration={1.2}
          repeatDelay={1}
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
          )}
        />
      </div>
      <Features />
      <Funders />
      <CallToAction />
    </>
  );
}
