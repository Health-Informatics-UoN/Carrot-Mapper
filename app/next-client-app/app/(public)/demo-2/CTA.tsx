import { AnimatedBeamMapping } from "@/components/AnimatedBeamMapping";
import AnimatedGridPattern from "@/components/magicui/animated-grid-pattern";
import BoxReveal from "@/components/magicui/box-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  return (
    <>
      {/* CTA section */}
      <div className="z-50 bg-gradient-to-b from-indigo-900 to-cyan-600 flex flex-col items-center text-white rounded-3xl p-5 text-center lg:pb-20 pb-10">
        <BoxReveal boxColor={"#e6a312"} duration={0.5}>
          <h1 className="text-white sm:text-5xl text-3xl sm:mt-7 mt-5">
            Get Started with Carrot today!
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <h1 className="text-white opacity-80 sm:text-2xl text-xl sm:mt-2 my-2">
            Learn more and start using Carrot for your research projects.
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <Button className="sm:text-lg text-md mt-5  bg-amber-500">
            Contact us <ArrowRight className="ml-2" />
          </Button>
        </BoxReveal>
      </div>
    </>
  );
}