import BoxReveal from "@/components/magicui/box-reveal";
import { Button } from "@/components/ui/button";
import { Github, Rocket } from "lucide-react";
import Link from "next/link";

export default function CallToAction() {
  const deployLink: string = "";
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
          <h1 className="opacity-80 sm:text-2xl text-pretty text-md my-4">
            Start a Github discussion or deploy your own Carrot today!
          </h1>
        </BoxReveal>
        <BoxReveal boxColor={"#e6a312"} duration={1.0}>
          <div className="flex gap-5">
            <Link
              href={
                "https://github.com/Health-Informatics-UoN/Carrot-Mapper/discussions"
              }
            >
              <Button className="lg:text-lg text-md hover:bg-orange-600/80 dark:hover:bg-orange-600/80 bg-orange-600 dark:bg-orange-600 dark:text-white">
                <Github className="mr-2" /> GitHub Discussions
              </Button>
            </Link>
            {deployLink !== "" && (
              <Link href={deployLink}>
                <Button className="lg:text-lg text-md hover:border-orange-900 dark:hover:border-orange-900 text-orange-600 dark:text-orange-600 bg-white dark:bg-white border border-orange-600">
                  <Rocket className="mr-2" /> Deploy your own Carrot
                </Button>
              </Link>
            )}
          </div>
        </BoxReveal>
      </div>
    </>
  );
}
