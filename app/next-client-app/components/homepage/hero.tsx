import { AnimatedBeamMapping } from "@/components/AnimatedBeamMapping";

export default function Hero() {
  return (
    <>
      <div className="flex-col overflow-hidden lg:flex lg:flex-row lg:justify-between items-center pt-10">
        <div className="flex flex-col lg:space-y-5 space-y-3 lg:w-3/5">
          <div className="lg:text-5xl text-3xl gap-5 text-center lg:text-left">
            <h1 className="text-orange-600">OMOP Transforming </h1>
            <h1> Made Easy</h1>
          </div>
          <h3 className="text-gray-600 dark:text-gray-200 sm:text-lg text-md mt-2 text-justify lg:text-left">
            Carrot utilizes scan reports' metadata to generate JSON mapping
            rules to the OMOP standard, offering{" "}
            <span className="text-orange-600">
              automated vocabulary mapping, rule reuse, and manual rule creation
            </span>
            . Data standardization efficiency for improved research
            interoperability.
          </h3>
        </div>
        <div className="lg:w-2/5">
          <AnimatedBeamMapping />
        </div>
      </div>
    </>
  );
}