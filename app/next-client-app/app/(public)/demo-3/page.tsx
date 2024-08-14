import CallToAction from "../demo-2/CTA";
import Features from "../demo-2/features";
import Funders from "../demo-2/funders";
import Hero from "../demo-2/hero";
import BentoFeatures from "./bentoFeatures";
import BentoProjects from "./bentoProjects";

export default function Demo3() {
  return (
    <div className="space-y-7 lg:space-y-14">
      <Hero />
      <Features />
      <BentoFeatures />
      <BentoProjects />
      <Funders />
      <CallToAction />
    </div>
  );
}
