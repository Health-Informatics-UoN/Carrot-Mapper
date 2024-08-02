import "./globals.css";
import "./custom.css";
import "react-tooltip/dist/react-tooltip.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/core/sidebar";
import { getUser } from "@/api";

export const metadata: Metadata = {
  title: "Carrot Mapper",
  description: "Convenient And Reusable Rapid Omop Transformer",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const user = await getUser();

  return (
    <html lang="en">
      <body>
        <Sidebar userName={"dsf"} />
        <div className="mb-4">{children}</div>
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
