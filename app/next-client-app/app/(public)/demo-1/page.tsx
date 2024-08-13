import { AnimatedBeamMultipleOutputDemo } from "@/components/AnimatedBeam";
import { Button } from "@/components/ui/button";
import { Carrot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Demo1() {
  return (
    <>
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-8 items-center lg:px-32 p-5">
        <div className="flex flex-col lg:space-y-5 space-y-3">
          <div className="sm:text-5xl text-3xl gap-5 text-center lg:text-left">
            <h1 className="text-orange-600">OMOP Transforming </h1>
            <h1> Made Easy</h1>
          </div>
          <h3 className="text-gray text-gray-600 sm:text-lg text-md mt-2 text-justify lg:text-left">
            Carrot-Mapper utilizes WhiteRabbit metadata to generate JSON mapping
            rules to the OMOP standard, offering{" "}
            <span className="text-orange-600">
              automated vocabulary mapping, rule reuse, and manual rule creation
            </span>
            . Data standardization efficiency for improved research
            interoperability.
          </h3>
        </div>
        <div>
          <AnimatedBeamMultipleOutputDemo />
        </div>
      </div>
    </>
  );
}
