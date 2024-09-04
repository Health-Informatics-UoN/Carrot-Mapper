import Link from "next/link";
import Image from "next/image";
import {
  CircleUserRound,
  PersonStanding,
  ReceiptText,
  ShieldQuestion,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-24 mb-5 bg-white rounded-lg shadow dark:bg-gray-900">
      <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <Image
            src="/logos/UoN-light.png"
            width={200}
            height={200}
            alt="UoN Logo"
            className="dark:hidden"
          />
          <Image
            src="/logos/UoN-dark.png"
            width={200}
            height={200}
            alt="UoN Logo"
            className="hidden dark:block"
          />

          <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
            <li>
              <a href="#" className="hover:underline me-4 md:me-6 flex">
                <CircleUserRound className="mr-2" /> About
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6 flex">
                <ShieldQuestion className="mr-2" /> Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline me-4 md:me-6 flex">
                <ReceiptText className="mr-2" />
                Licensing
              </a>
            </li>
          </ul>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
          &copy; {new Date().getFullYear()}{" "}
          <a href="https://flowbite.com/" className="hover:underline">
            University of Nottingham
          </a>
          . All Rights Reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
