import { CornerLeftDown } from "lucide-react";
import Image from "next/image";

export default function Hero1() {
  return (
    <>
      {/* Hero section */}
      <div className="flex-col flex mt-24 mb-40">
        <div className="flex flex-col lg:space-y-5 space-y-3 lg:w-3/5 mb-10">
          <div className="lg:text-5xl text-3xl gap-5 text-center lg:text-left">
            <h1> Feeling Lost Doing </h1>
            <span className="text-orange-600">OMOP Transforming?</span>
          </div>
          <h3 className="text-gray text-gray-600 dark:text-gray-200 sm:text-lg text-md mt-2 text-justify lg:text-left">
            Hundreds of researchers around the world said the same thing.
          </h3>
        </div>
        <div className="flex justify-between">
          <Image
            src="/yH.gif"
            alt="GIF"
            height={600}
            width={600}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="flex items-end">
            <CornerLeftDown className="animate-bounce" size={50} />
            <h1 className="text-xl">
              Solution may be found here (or may not :D)
            </h1>
          </div>
        </div>
        {/* <AnimatedGridPattern
          numSquares={60}
          maxOpacity={0.15}
          duration={1.2}
          repeatDelay={1}
          className={cn(
            "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
          )}
        /> */}
      </div>
    </>
  );
}
