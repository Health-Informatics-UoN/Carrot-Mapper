import CallToAction from "../demo-2/CTA";
import Funders from "../demo-2/funders";
import Hero from "../demo-2/hero";
import BentoFeatures from "./bentoFeatures";
import BentoProjects from "./bentoProjects";

export default function Demo3() {
  return (
    <div className="space-y-12 lg:space-y-28">
      <Hero />
      <BentoFeatures />
      <BentoProjects />
      <Funders />
      <CallToAction />
    </div>
  );
}
