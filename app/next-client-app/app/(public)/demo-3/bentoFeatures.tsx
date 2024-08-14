import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Lock, PencilRuler, Recycle, Route } from "lucide-react";

const features = [
  {
    Icon: Recycle,
    name: "REUSABLE MAPPING RULES",
    description:
      "Save time by reusing mapping rules across datasets, ensuring consistency and accuracy in your data integration.",

    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className:
      "lg:col-start-1 lg:col-end-4 lg:col-span-3 gradient-background-1",
  },
  {
    Icon: Lock,
    name: "ANONYMOUS METADATA",
    description:
      "Work securely with Carrot-Mapper, which handles only anonymous metadata, keeping your sensitive information protected.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-end-6 lg:col-span-2 gradient-background-2",
  },
  {
    Icon: Route,
    name: ">1M RULES CREATED",

    description:
      "More than 100 datasets across many national-scale projects have been using Carrot to create OMOP Mapping rules",
    background: <div className="gradient-background"></div>,
    className: "lg:col-start-1 lg:col-span-2 gradient-background-3",
  },
  {
    Icon: PencilRuler,
    name: "INTUITIVE TOOLS",
    description:
      "Easily create mapping rules to the OMOP standard with Carrot-Mapper's intuitive automated and manual tools.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-span-3 gradient-background-4",
  },
];

export default async function BentoFeatures() {
  return (
    <BentoGrid className="lg:grid-cols-5">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}
