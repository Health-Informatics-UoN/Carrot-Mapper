import "../globals.css";
import "../custom.css";
import "react-tooltip/dist/react-tooltip.css";
import { Sidebar } from "../../components/core/sidebar";
import React from "react";
import { getCurrentUser } from "../../api/users";
import { MenuBar } from "@/components/core/menubar";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <div>
          <MenuBar userName={user.username} />
          {children}
        </div>
      </body>
    </html>
  );
}
