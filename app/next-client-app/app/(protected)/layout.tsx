import "../globals.css";
import "../custom.css";
import "react-tooltip/dist/react-tooltip.css";
import { Sidebar } from "../../components/core/sidebar";
import React from "react";
import { getCurrentUser } from "../../api/users";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <>
      <Sidebar userName={user.username} />
      <section className="container my-6">{children}</section>
    </>
  );
}
