import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import BoxReveal from "@/components/magicui/box-reveal";

const features = [
  {
    name: "CO-CONNECT",
    description:
      "CO-CONNECT developed Carrot to streamline COVID-19 data access and integration across the UK, aiding researchers in developing therapies and treatments.",
    background: <img className="w-[150px]" src="/logos/coconnect1.png" />,
    href: "https://fed-a.org/co-connect-home/",
    cta: "Learn more",
    className: "lg:col-start-1 lg:col-end-4 lg:col-span-3",
  },
  {
    name: "ALLEVIATE",
    description:
      "Alleviate has utilized Carrot to support the creation of its UK-wide pain data hub in collaboration with Health Data Research UK (HDR UK).",
    background: (
      <img className="opacity-80 p-5 w-[300px]" src="/logos/alleviate.jpeg" />
    ),
    href: "https://alleviate.ac.uk/",
    cta: "Learn more",
    className: "lg:col-end-7 lg:col-span-3",
  },
  {
    name: "NOTTINGHAM BRC",
    description:
      "The Nottingham BRC has leveraged Carrot in its mission to advance health informatics by driving translational research and innovation.",
    background: (
      <img className="opacity-80 p-5 dark:bg-white" src="/logos/nbrc.png" />
    ),
    href: "https://nottinghambrc.nihr.ac.uk/research/informatics",
    cta: "Learn more",
    className: "lg:col-start-1 lg:col-span-2",
  },
  {
    name: "BY-COVID",
    description:
      "The BY-COVID project uses Carrot to enable open data sharing on SARS-CoV-2 and other infectious diseases, boosting research and public health efforts across Europe.",
    background: <img className="w-[300px]" src="/logos/bycovid.png" />,
    href: "https://by-covid.org/about",
    cta: "Learn more",
    className: "lg:col-start-3 lg:col-span-2",
  },
  {
    name: "East Midlands SDE",
    description:
      "The East Midlands SDE project uses Carrot to transform data for Cohort Discovery.",
    background: <img className="p-2 w-[200px]" src="/logos/sde.png" />,
    href: "https://www.emsde.net/emsde/",
    cta: "Learn more",
    className: "lg:col-start-5 lg:col-span-2",
  },
];

export default async function BentoProjects() {
  return (
    <div>
      <div className="flex flex-col justify-center space-y-2 mb-5">
        <div className="lg:text-4xl flex justify-center text-2xl">
          <BoxReveal boxColor={"#empty"} duration={0.5}>
            <h1 className="font-bold">Supporting Researchers</h1>
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
