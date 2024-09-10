import { Circle } from "@/components/AnimatedBeamMapping";
import BoxReveal from "@/components/magicui/box-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { FastForward, Lock, Recycle } from "lucide-react";

export default function Features() {
  return (
    <>
      <div className="items-center text-center justify-center w-full">
        <div className="flex flex-col justify-center space-y-2">
          <div className="lg:text-4xl flex justify-center text-2xl">
            <BoxReveal boxColor={"#empty"} duration={0.5}>
              <h1 className="font-bold">Revolutionary Features </h1>
            </BoxReveal>
          </div>
          <div className="flex text-center justify-center">
            <BoxReveal boxColor={"#empty"} duration={1}>
              <h3 className="text-gray-600 dark:text-gray-200 text-pretty sm:text-lg text-md">
                Working with OMOP Data Standardization? Carrot provides advanced
                features which can ease your tasks.
              </h3>
            </BoxReveal>
          </div>
        </div>
        <div className="flex justify-center">
          <BoxReveal boxColor={"#empty"} duration={1.5}>
            <div className="lg:flex lg:flex-row items-center lg:justify-center lg:gap-5 w-full lg:mt-5 mt-3 flex flex-col gap-2">
              <Card className="lg:w-[400px] z-10 py-3 flex flex-col items-center space-y-3">
                <div className="pt-3">
                  <Circle className="size-16 py-3 rounded-full text-red dark:bg-white bg-green-800">
                    <Recycle className="dark:text-green-800 text-white" />
                  </Circle>
                </div>
                <CardContent className="text-lg">
                  Save time by{" "}
                  <span className="text-orange-600">reusing mapping rules</span>{" "}
                  across datasets, ensuring consistency and accuracy in your
                  data integration.
                </CardContent>
              </Card>
              <Card className="lg:w-[400px] z-10 flex flex-col items-center space-y-3">
                <div className="pt-3">
                  <Circle className="size-16 py-3 rounded-full text-red dark:bg-white bg-sky-800">
                    <Lock className="dark:text-sky-800 text-white" />
                  </Circle>
                </div>
                <CardContent className="text-lg">
                  Work securely with Carrot-Mapper, which handles only{" "}
                  <span className="text-orange-600">anonymous metadata</span>,
                  keeping your sensitive information protected.
                </CardContent>
              </Card>
              <Card className="lg:w-[400px] py-3 z-10 flex flex-col items-center space-y-3">
                <div className="pt-3">
                  <Circle className="size-16 py-3 rounded-full text-red dark:bg-white bg-indigo-800">
                    <FastForward className="dark:text-indigo-800 text-white" />
                  </Circle>
                </div>
                <CardContent className="text-lg">
                  Easily create mapping rules to the OMOP standard with
                  Carrot-Mapper's{" "}
                  <span className="text-orange-600">
                    intuitive automated and manual tools
                  </span>
                  .
                </CardContent>
              </Card>
            </div>
          </BoxReveal>
        </div>
      </div>
    </>
  );
}
