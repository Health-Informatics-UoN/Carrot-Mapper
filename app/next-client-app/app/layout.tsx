import "./globals.css";
import "./custom.css";
import "bootstrap/dist/css/bootstrap.css";
import "react-tooltip/dist/react-tooltip.css";
import type { Metadata } from "next";
import BootstrapClient from "@/components/BootstrapClient";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/ui/layout/sidebar";

export const metadata: Metadata = {
  title: "Carrot Mapper",
  description: "Convenient And Reusable Rapid Omop Transformer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="mt-[50px] mb-4">{children}</div>
        <BootstrapClient />
        {/* <Sidebar /> */}
        {/* <div className="ml-[230px] mb-4">{children}</div> */}

        <Toaster
          toastOptions={{
            classNames: {
              error: "bg-red-700 text-white",
              success: "bg-green-700 text-white",
              warning: "text-yellow-400",
              info: "bg-blue-800 text-white",
            },
          }}
        />
      </body>
    </html>
  );
}
