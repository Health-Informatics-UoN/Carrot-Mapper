import React from "react";
import { getCurrentUser } from "@/api/users";
import { MenuBar } from "@/components/core/menubar";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <>
      <MenuBar userName={user.username} />
      <section>{children}</section>
    </>
  );
}
