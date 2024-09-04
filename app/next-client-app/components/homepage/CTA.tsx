import BoxReveal from "@/components/magicui/box-reveal";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  return (
    <>
      {/* CTA section */}
      <div className="z-10 bg-gradient-to-b from-indigo-900 to-cyan-600 flex flex-col items-center text-white rounded-3xl text-center px-5 lg:px-0 slideInEffect">
        <BoxReveal boxColor={"#e6a312"} duration={0.5}>
          <h1 className="text-white sm:text-5xl text-pretty text-3xl mt-10">
            Get Started with Carrot today!
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <h1 className="text-white opacity-80 sm:text-2xl text-pretty text-md my-2">
            Learn more and start using Carrot for your research projects now.
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <Button className="sm:text-lg text-md my-10 bg-amber-500">
            Contact us <ArrowRight className="ml-2" />
          </Button>
        </BoxReveal>
      </div>
    </>
  );
}
