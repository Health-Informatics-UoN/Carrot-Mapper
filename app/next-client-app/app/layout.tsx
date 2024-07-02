import "./globals.css";
import "./custom.css";
import "bootstrap/dist/css/bootstrap.css";
import "react-tooltip/dist/react-tooltip.css";
import type { Metadata } from "next";
import BootstrapClient from "@/components/BootstrapClient";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

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
      <body style={{ paddingTop: "90px" }}>
        <Navbar />
        {children}
        <BootstrapClient />
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
