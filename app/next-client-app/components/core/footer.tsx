import Link from "next/link";
import Image from "next/image";
import { ReceiptText, ShieldQuestion } from "lucide-react";

const Footer = () => {
  return (
    <div className="sm:flex grid grid-cols-2 items-center justify-between w-full px-5 py-3">
      <Image
        src="/logos/UoN.jpg"
        alt="Logo UoN"
        height={150}
        width={150}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

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
