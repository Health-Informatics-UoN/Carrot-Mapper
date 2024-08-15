import BentoProjects from "../demo-3/bentoProjects";
import CallToAction from "./CTA";
import Features from "./features";
import Funders from "./funders";
import Hero from "./hero";

export default function Demo2() {
  return (
    <div className="space-y-7 lg:space-y-14">
      <Hero />
      <Features />
      <BentoProjects />
      <Funders />
      <CallToAction />
    </div>
  );
}
