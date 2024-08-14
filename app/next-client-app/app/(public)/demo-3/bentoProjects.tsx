import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import BoxReveal from "@/components/magicui/box-reveal";

const features = [
  {
    name: "CO-CONNECT",
    description:
      "Save time by reusing mapping rules across datasets, ensuring consistency and accuracy in your data integration.",
    href: "/",
    cta: "Learn more",
    background: (
      <img
        className="opacity-60 absolute -right-20 -top-20"
        src="/logos/coconnect1.png"
      />
    ),
    className: "lg:col-start-1 lg:col-end-4 lg:col-span-3",
  },
  {
    name: "East Midlands SDE",
    description:
      "Save time by reusing mapping rules across datasets, ensuring consistency and accuracy in your data integration.",
    href: "/",
    cta: "Learn more",
    background: (
      <img
        className="opacity-60 absolute -right-20 -top-20"
        src="/logos/sde.png"
      />
    ),
    className: "lg:col-end-7 lg:col-span-3",
  },
  {
    name: "NOTTINGHAM BRC",
    description:
      "Work securely with Carrot-Mapper, which handles only anonymous metadata, keeping your sensitive information protected.",
    background: <img className="opacity-60" src="/logos/nbrc.png" />,
    className: "lg:col-start-1 lg:col-span-2",
    href: "/",
    cta: "Learn more",
  },
  {
    name: "BY-COVID",
    href: "/",
    cta: "Learn more",
    description:
      "More than 100 datasets across many national-scale projects have been using Carrot to create OMOP Mapping rules",
    background: (
      <img
        className="opacity-60 absolute -right-20 -top-20"
        src="/logos/bycovid.png"
      />
    ),
    className: "lg:col-start-3 lg:col-span-2",
  },
  {
    name: "ALLEVIATE",
    description:
      "Easily create mapping rules to the OMOP standard with Carrot-Mapper's intuitive automated and manual tools.",
    background: (
      <img
        className="opacity-60 absolute -right-20 -top-20"
        src="/logos/alleviate.jpeg"
      />
    ),
    className: "lg:col-start-5 lg:col-span-2",
    href: "/",
    cta: "Learn more",
  },
];

export default async function BentoProjects() {
  return (
    <div>
      <div className="flex flex-col justify-center space-y-2 mb-5">
        <div className="lg:text-4xl flex justify-center text-2xl">
          <BoxReveal boxColor={"#empty"} duration={0.5}>
            <h1 className="font-bold">Carrot has been used in...</h1>
          </BoxReveal>
        </div>
        <div className="flex text-center justify-center">
          <BoxReveal boxColor={"#empty"} duration={1}>
            <h3 className="text-gray text-gray-600 dark:text-gray-200  sm:text-lg text-md">
              ...several projects across the nation with the large impacts
            </h3>
          </BoxReveal>
        </div>
      </div>
      <BentoGrid className="lg:grid-cols-6">
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
}
