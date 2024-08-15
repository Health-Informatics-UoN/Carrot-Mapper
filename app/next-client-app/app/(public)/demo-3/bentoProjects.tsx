import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import BoxReveal from "@/components/magicui/box-reveal";

const features = [
  {
    name: "NOTTINGHAM BRC",
    description:
      "The Nottingham BRC has leveraged Carrot in its mission to advance health informatics by driving translational research and innovation. Carrot has been instrumental in managing and utilizing big data within the Nottingham University Hospitals NHS Trust and University of Nottingham’s “safe haven” environment.",
    background: (
      <img className="opacity-80 p-5 dark:bg-white" src="/logos/nbrc.png" />
    ),
    href: "https://nottinghambrc.nihr.ac.uk/research/informatics",
    cta: "Learn more",
    className: "lg:col-start-1 lg:col-end-4 lg:col-span-3",
  },
  {
    name: "ALLEVIATE",
    description:
      "Alleviate has utilized Carrot to support the creation of its UK-wide pain data hub in collaboration with Health Data Research UK (HDR UK). By standardizing and curating diverse pain-related datasets, including text, genetic, and imaging data, Carrot has facilitated the discovery and analysis of complex pain conditions.",
    background: (
      <img className="opacity-80 p-5 w-[300px]" src="/logos/alleviate.jpeg" />
    ),
    href: "https://alleviate.ac.uk/",
    cta: "Learn more",
    className: "lg:col-end-7 lg:col-span-3",
  },
  {
    name: "CO-CONNECT",
    description:
      "CO-CONNECT utilized Carrot to streamline the access and integration of COVID-19 data across the UK, supporting researchers in developing potential therapies and treatments.",
    background: <img className="opacity-80" src="/logos/coconnect1.png" />,
    href: "https://fed-a.org/co-connect-home/",
    cta: "Learn more",
    className: "lg:col-start-1 lg:col-span-2",
  },
  {
    name: "BY-COVID",
    description:
      "The BeYond-COVID (BY-COVID) project leverages Carrot to facilitate comprehensive open data sharing on SARS-CoV-2 and other infectious diseases, enhancing research and public health efforts across Europe.",
    background: (
      <img
        className="opacity-80 w-[300px] dark:bg-white"
        src="/logos/bycovid.png"
      />
    ),
    href: "https://by-covid.org/about",
    cta: "Learn more",
    className: "lg:col-start-3 lg:col-span-2",
  },
  {
    name: "East Midlands SDE",
    description:
      "The East Midlands Secure Data Environment (SDE) project, in collaboration with EMRAD, utilizes Carrot to support the establishment of a secure and controlled platform for data access by authorized researchers.",
    background: (
      <img
        className="opacity-80 p-5 w-[200px] dark:bg-white"
        src="/logos/sde.png"
      />
    ),
    href: "https://digital.nhs.uk/services/secure-data-environment-service",
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
        <div className="flex text-center justify-center">
          <BoxReveal boxColor={"#empty"} duration={1}>
            <h3 className="text-gray text-gray-600 dark:text-gray-200  sm:text-lg text-md">
              Many important research projects across the nation have been using
              <span className="text-orange-600"> Carrot</span>.
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
