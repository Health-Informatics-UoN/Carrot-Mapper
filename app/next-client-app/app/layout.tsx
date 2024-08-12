import "./globals.css";
import "./custom.css";
import "react-tooltip/dist/react-tooltip.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getCurrentUser } from "@/api/users";

export const metadata: Metadata = {
  title: "Carrot Mapper",
  description: "Convenient And Reusable Rapid Omop Transformer",
  icons: {
    icon: "/icons/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
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
