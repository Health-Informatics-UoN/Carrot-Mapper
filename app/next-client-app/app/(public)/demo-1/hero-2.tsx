import { AnimatedBeamMapping } from "@/components/AnimatedBeamMapping";
import BoxReveal from "@/components/magicui/box-reveal";

export default function Hero2() {
  return (
    <>
      {/* Hero section */}
      <div className="flex-col flex justify-center content-start my-28">
        <div className="lg:text-4xl flex justify-center text-2xl">
          <BoxReveal boxColor={"#e6a312"} duration={0.5}>
            <h1 className="font-bold">How about this?</h1>
          </BoxReveal>
        </div>
        <div className="flex text-center justify-center px-32">
          <BoxReveal boxColor={"#e6a312"} duration={1}>
            <h3 className="text-gray-600 dark:text-gray-200 text-pretty sm:text-lg text-md mt-2 lg:text-center">
              A tool that utilizes scan reports' metadata to generate JSON
              mapping rules to the OMOP standard, offering{" "}
              <span className="text-orange-600">
                automated vocabulary mapping, rule reuse, and manual rule
                creation
              </span>
              . Also...,{" "}
              <span className="underline underline-offset-2 font-bold">
                fast, stable and secure
              </span>
              .
            </h3>
          </BoxReveal>
        </div>
        <div>
          <AnimatedBeamMapping />
        </div>
      </div>
    </>
  );
}
