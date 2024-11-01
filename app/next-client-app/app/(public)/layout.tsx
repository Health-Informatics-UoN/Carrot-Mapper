import React from "react";
import { MenuBar } from "@/components/core/menubar";
import Footer from "@/components/core/footer";
import { getCurrentUser } from "@/api/users";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <>
      <section className="container">
        <MenuBar user={user} />
        {children}
        <Footer />
      </section>
    </>
  );
}
