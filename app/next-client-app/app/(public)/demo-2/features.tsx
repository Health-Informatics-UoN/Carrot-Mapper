import { Circle } from "@/components/AnimatedBeamMapping";
import { Card, CardContent } from "@/components/ui/card";
import { FastForward, Lock, Recycle } from "lucide-react";

export default function Features() {
  return (
    <>
      {/* Features section */}
      <div className="items-center text-center justify-center lg:px-40 px-5 fadeInEffect">
        <div className="flex flex-col space-y-2">
          <div className="lg:text-4xl text-2xl">
            <h1 className="font-bold">Revolutionary Features </h1>
          </div>
          <h3 className="text-gray text-gray-600 dark:text-gray-200 sm:text-lg text-md">
            Working with OMOP Data Standardization? Carrot provides advanced
            features which can ease your tasks.
          </h3>
        </div>

        <div className="lg:flex lg:flex-row items-center lg:gap-5 lg:mt-5 mt-3 flex flex-col gap-2 lg:justify-center">
          <Card className="w-[400px] py-3 flex flex-col items-center space-y-3">
            <div className="pt-3">
              <Circle className="size-16 py-3 rounded-full text-red dark:bg-white bg-green-800">
                <Recycle className="dark:text-green-800 text-white" />
              </Circle>
            </div>
            <CardContent className="text-lg">
              Save time by{" "}
              <span className="text-orange-600">reusing mapping rules</span>{" "}
              across datasets, ensuring consistency and accuracy in your data
              integration.
            </CardContent>
          </Card>
          <Card className="w-[400px] z-10 flex flex-col items-center space-y-3">
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
          <Card className="w-[400px] py-3 flex flex-col items-center space-y-3">
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
      </div>
    </>
  );
}
