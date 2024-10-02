import "react-tooltip/dist/react-tooltip.css";
import { Sidebar } from "@/components/core/sidebar";
import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/auth/options";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(options);
  const username = session?.user?.name;

  return (
    <>
      <Sidebar userName={username} />
      <section className="container my-6">{children}</section>
    </>
  );
}
