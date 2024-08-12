import { AnimatedBeamMultipleOutputDemo } from "@/components/AnimatedBeam";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Default() {
  return (
    <>
      <div className="sm:grid sm:grid-cols-2 sm:justify-between content-stretch gap-8 items-center sm:px-40 p-5">
        <div>
          <div className="items-center">
            <h1 className="sm:text-5xl text-md">
              OMOP Transforming Made Easy with Carrot
            </h1>
            <h3 className="opacity-80 sm:text-lg text-xs mt-2 text-left">
              Carrot-Mapper is a web application that transforms healthcare
              datasets to the OMOP common data model. It utilizes WhiteRabbit
              metadata to generate JSON mapping rules, offering automated
              vocabulary mapping, rule reuse, and manual rule creation. This
              tool enhances data standardization efficiency for improved
              research interoperability.
            </h3>
            <div className="place-self-end">
              <Link href={"#"}>
                <Button className="sm:text-lg text-xs place-self-end sm:mt-5 mt-2 border border-secondary">
                  learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div>
          <AnimatedBeamMultipleOutputDemo />
        </div>
      </div>
    </>
  );
}
