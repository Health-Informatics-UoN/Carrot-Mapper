import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
