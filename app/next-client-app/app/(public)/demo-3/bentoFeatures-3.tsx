import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import BoxReveal from "@/components/magicui/box-reveal";
import { Lock, PencilRuler, Recycle, Route } from "lucide-react";

const features = [
  {
    Icon: Recycle,
    name: "REUSABLE MAPPING RULES",
    description:
      "Save time by reusing mapping rules across datasets, ensuring consistency and accuracy in your data integration.",

    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className:
      "lg:col-start-1 lg:col-end-4 lg:col-span-3 bg-gradient-to-tr from-orange-600 to-slate-50",
  },
  {
    Icon: Lock,
    name: "ANONYMOUS METADATA",
    description:
      "Work securely with Carrot, which handles only anonymous metadata, keeping your sensitive information protected.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className:
      "lg:col-end-6 lg:col-span-2 bg-gradient-to-tr from-lime-600 to-slate-50",
  },
  {
    Icon: Route,
    name: ">1M RULES CREATED",

    description:
      "More than 100 datasets across many national-scale projects have been using Carrot to create OMOP Mapping rules",
    background: <div className="gradient-background"></div>,
    className:
      "lg:col-start-1 lg:col-span-2 bg-gradient-to-tr from-sky-600 to-slate-50",
  },
  {
    Icon: PencilRuler,
    name: "INTUITIVE TOOLS",
    description:
      "Easily create mapping rules to the OMOP standard with Carrot's intuitive automated and manual tools.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className:
      "lg:col-start-3 lg:col-span-3 bg-gradient-to-tr from-purple-600 to-slate-50",
  },
];

export default async function BentoFeatures3() {
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
            <h3 className="text-gray text-gray-600 dark:text-gray-200  sm:text-lg text-md">
              Carrot provides advanced features which can ease your OMOP Data
              Standardization tasks.
            </h3>
          </BoxReveal>
        </div>
      </div>
      <BentoGrid className="lg:grid-cols-5">
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
}
