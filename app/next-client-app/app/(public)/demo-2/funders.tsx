import BoxReveal from "@/components/magicui/box-reveal";
import Image from "next/image";

export default function Funders() {
  return (
    <>
      {/* Funders section */}

      <div className="items-center text-center justify-center slideInEffect">
        <div className="flex flex-col space-y-2">
          <div className="lg:text-4xl text-2xl gap-5">
            <h1 className="font-bold">Our Funders </h1>
          </div>
          <h3 className="text-gray text-gray-600 dark:text-gray-200 sm:text-lg text-md">
            Carrot comes to life and helps a lot of researchers across UK thanks
            to our brilliant funders.
          </h3>
        </div>

        <div className="lg:flex lg:flex-row items-center lg:gap-5 mt-5 flex flex-col lg:justify-between">
          <div>
            {" "}
            <Image
              src="/logos/nhs-e.jpg"
              alt="Logo UoN"
              height={200}
              width={200}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div>
            <Image
              src="/logos/nihr.jpg"
              alt="Logo CCN"
              height={400}
              width={400}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div>
            <Image
              src="/logos/UKRI.png"
              alt="Logo UKRI"
              height={400}
              width={400}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div>
            <Image
              src="/logos/horizon.jpg"
              alt="Logo ALVE"
              height={200}
              width={200}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      </div>
    </>
  );
}
