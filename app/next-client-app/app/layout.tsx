import "./globals.css";
import "./custom.css";
import "bootstrap/dist/css/bootstrap.css";
import type { Metadata } from "next";
import BootstrapClient from "@/components/BootstrapClient";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CaRROT-Mapper",
  description: "CaRROT-Mapper",
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
        <Toaster />
      </body>
    </html>
  );
}
