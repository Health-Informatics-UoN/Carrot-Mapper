import React from "react";
import { getCurrentUser } from "@/api/users";
import { MenuBar } from "@/components/core/menubar";
import Footer from "@/components/core/footer";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <>
      <section className="container">
        <MenuBar userName={user.username} />
        {children}
        <Footer />
      </section>
    </>
  );
}
