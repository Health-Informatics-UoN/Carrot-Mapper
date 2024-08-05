import "./globals.css";
import "./custom.css";
import "react-tooltip/dist/react-tooltip.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/core/sidebar";
import { getUserName } from "@/api";
import { ThemeProvider } from "@/components/theme-provider";
import { getDataUsers } from "@/api/datasets";
import { getScanReport, getScanReports } from "@/api/scanreports";

export const metadata: Metadata = {
  title: "Carrot Mapper",
  description: "Convenient And Reusable Rapid Omop Transformer",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const user = await getUserName();
  // console.log(user);
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar userName={"asdasd"} />
          <div className="mb-4">{children}</div>
        </ThemeProvider>

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
