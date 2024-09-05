import BoxReveal from "@/components/magicui/box-reveal";
import { Button } from "@/components/ui/button";
import { Github, Rocket } from "lucide-react";
import Link from "next/link";

export default function CallToAction() {
  const deployLink = process.env.DEPLOY_LINK ?? "";
  return (
    <>
      {/* CTA section */}
      <div className="flex flex-col items-center text-center px-5 lg:px-0">
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <h1 className="sm:text-5xl text-pretty text-3xl">
            Join our community
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <div className="flex mt-3 gap-5 lg:flex-row flex-col">
            <a
              href={
                "https://github.com/Health-Informatics-UoN/Carrot-Mapper/discussions"
              }
              target="_blank"
            >
              <Button className="lg:text-lg text-md hover:bg-[#333333]/85 dark:hover:bg-gray-200 bg-[#333333] dark:bg-white dark:text-[#333333]">
                <Github className="mr-2" /> Start a GitHub Discussion
              </Button>
            </a>
            {deployLink && (
              <a href={deployLink} target="_blank">
                <Button className="lg:text-lg dark:hover:bg-gray-100 hover:bg-gray-100 text-md hover:border-orange-900 dark:hover:border-orange-900 text-orange-600 dark:text-orange-600 bg-white dark:bg-white border border-orange-600">
                  <Rocket className="mr-2" /> Deploy your own Carrot
                </Button>
              </a>
            )}
          </div>
        </BoxReveal>
      </div>
    </>
  );
}
