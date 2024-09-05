import { AnimatedBeamMapping } from "@/components/AnimatedBeamMapping";

export default function Hero() {
  return (
    <>
      <div className="flex-col overflow-hidden lg:flex lg:flex-row lg:justify-between items-center pt-10">
        <div className="flex flex-col lg:space-y-5 space-y-3 lg:w-3/5">
          <div className="lg:text-5xl text-3xl gap-5 text-center lg:text-left">
            <h1 className="text-orange-600">
              Streamlined Data Mapping to OMOP{" "}
            </h1>
            <h1> Made Easy</h1>
          </div>
          <h3 className="text-gray-600 dark:text-gray-200 sm:text-lg text-md mt-2 text-justify lg:text-left">
            Carrot automates vocabulary mapping to OMOP,{" "}
            <span className="text-orange-600">
              enabling rule reuse across datasets and flexible manual mapping
            </span>
            , streamlining data integration for faster research.
          </h3>
        </div>
        <div className="lg:w-2/5">
          <AnimatedBeamMapping />
        </div>
      </div>
    </>
  );
}
