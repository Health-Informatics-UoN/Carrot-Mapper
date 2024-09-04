import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import BoxReveal from "@/components/magicui/box-reveal";

const features = [
  {
    name: "FAST & RELIABLE",
    description:
      "Carrot is designed for speed, allowing you to process and map large datasets to the OMOP standard quickly and efficiently.",
    className:
      "lg:col-start-1 lg:col-end-3 lg:row-span-2 bg-[url('/qa2.png')] bg-no-repeat bg-center bg-contain",
  },
  {
    name: "REUSABLE MAPPING RULES",
    description:
      "Save time by reusing mapping rules across datasets, ensuring consistency and accuracy in your data integration.",
    className:
      "lg:col-start-3 lg:col-end-6 lg:col-span-3 bg-[url('/we2.png')] bg-no-repeat bg-center bg-contain",
  },
  {
    name: "ANONYMOUS METADATA",
    description:
      "Work securely with Carrot, which handles only anonymous metadata, keeping your sensitive information protected.",
    className:
      "lg:col-end-8 lg:col-span-2 bg-[url('/ty2.png')] bg-no-repeat bg-center bg-contain",
  },
  {
    name: ">1M RULES CREATED",
    special: true,
    description: "",
    className:
      "lg:col-start-3 lg:col-span-2 bg-[url('/rt.png')] bg-no-repeat bg-center bg-cover",
  },
  {
    name: "INTUITIVE TOOLS",
    description:
      "Easily create mapping rules to the OMOP standard with Carrot's intuitive automated and manual tools.",
    className:
      "lg:col-start-5 lg:col-span-3 bg-[url('/cv2.png')] bg-no-repeat bg-center bg-contain",
  },
];

export default async function BentoFeatures() {
  return (
    <div>
      <div className="flex flex-col justify-center space-y-2 mb-5">
        <div className="lg:text-4xl flex justify-center text-2xl">
          <BoxReveal boxColor={"#empty"} duration={0.5}>
            <h1 className="font-bold">Why Carrot? </h1>
          </BoxReveal>
        </div>
        <div className="flex text-center justify-center">
          <BoxReveal boxColor={"#empty"} duration={1}>
            <h3 className="text-gray-600 dark:text-gray-200 text-pretty sm:text-lg text-md">
              Carrot provides advanced features which can ease your OMOP Data
              Standardization tasks.
            </h3>
          </BoxReveal>
        </div>
      </div>
      <BentoGrid className="lg:grid-cols-7 slideInEffect">
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
}
