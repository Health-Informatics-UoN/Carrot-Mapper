import Link from "next/link";
import Image from "next/image";
import { ReceiptText, ShieldQuestion } from "lucide-react";

const Footer = () => {
  return (
    <div className="sm:flex grid grid-cols-2 items-center justify-between w-full px-5 py-3">
      <div className="relative w-[250px] h-[100px] ">
        <Image
          src="/logos/UoN.jpg"
          alt="Logo UoN"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="relative w-[125px] h-[125px] ">
        <Image
          src="/logos/coconnect1.png"
          alt="Logo CCN"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="relative w-[250px] h-[100px] ">
        <Image
          src="/logos/UKRI.png"
          alt="Logo UKRI"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="relative w-[250px] h-[100px] ">
        <Image
          src="/logos/alleviate.jpeg"
          alt="Logo ALVE"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-col justify-end">
        <p className="font-bold">Links</p>
        <ul>
          <li>
            <Link href="#" className="flex items-center">
              <ShieldQuestion size={15} className="mr-1" /> Privacy Policy
            </Link>
          </li>

          <li>
            <Link href="#" className="flex items-center">
              <ReceiptText size={15} className="mr-1" /> Terms and Conditions
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
