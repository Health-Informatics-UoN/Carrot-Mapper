import React from "react";
import { MenuBar } from "@/components/core/menubar";
import Footer from "@/components/core/footer";
import { cookies } from "next/headers";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const csrfToken = cookieStore.get("csrftoken");
  const session = cookieStore.get("sessionid");
  const userIsLogged: boolean = !!(session && csrfToken);
  return (
    <>
      <section className="container">
        <MenuBar userIsLogged={userIsLogged} />
        {children}
        <Footer />
      </section>
    </>
  );
}
