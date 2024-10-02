import BoxReveal from "@/components/magicui/box-reveal";
import { Button } from "@/components/ui/button";
import { Github, Rocket } from "lucide-react";

export default function CallToAction() {
  const deployLink = process.env.DEPLOY_LINK ?? "";
  return (
    <>
      <div className="flex flex-col items-center text-center px-5 lg:gap-7 gap-4 lg:px-0">
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <h1 className="sm:text-4xl text-pretty text-2xl">
            Join our community
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <div className="flex gap-2 lg:flex-row flex-col">
            <a
              href={
                "https://github.com/Health-Informatics-UoN/Carrot-Mapper/discussions"
              }
              target="_blank"
            >
              <Button className="lg:text-lg text-md hover:bg-[#333333]/85 dark:hover:bg-gray-200 bg-[#333333] dark:bg-white dark:text-[#333333]">
                <Github className="mr-2 size-4" /> GitHub Discussions
              </Button>
            </a>
            {deployLink && (
              <a href={deployLink} target="_blank">
                <Button className="lg:text-lg dark:hover:bg-gray-100 hover:bg-gray-100 text-md hover:border-orange-900 dark:hover:border-orange-900 text-orange-600 dark:text-orange-600 bg-white dark:bg-white border border-orange-600">
                  <Rocket className="mr-2 size-4" /> Deploy your own Carrot
                </Button>
              </a>
            )}
          </div>
        </BoxReveal>
      </div>
    </>
  );
}
