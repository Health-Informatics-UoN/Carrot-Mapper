import "react-tooltip/dist/react-tooltip.css";
import React from "react";
import { getCurrentUser } from "@/api/users";
import { MenuBar } from "@/components/core/menubar";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <>
      <section className="container mb-5">
        <MenuBar user={user} />
        {children}
      </section>
    </>
  );
}
