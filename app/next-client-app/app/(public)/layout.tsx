import React from "react";
import { MenuBar } from "@/components/core/menubar";
import Footer from "@/components/core/footer";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrot Mapper",
  description: "Convenient And Reusable Rapid Omop Transformer",
  keywords: [
    "OMOP CDM",
    "Data standardization",
    "Healthcare interoperability",
    "Clinical data mapping",
    "OHDSI",
    "OMOP",
    "Common data model",
    "Medical vocabulary mapping",
    "Health data conversion",
    "Observational research",
    "ETL for OMOP",
  ],
  robots: {
    index: true,
    follow: false,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": 160,
    },
  },
  icons: {
    icon: "/icons/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const csrfToken = cookieStore.get("csrftoken");
  const session = cookieStore.get("sessionid");
  const userLoggedIn: boolean = !!(session && csrfToken);
  return (
    <>
      <section className="container">
        <MenuBar userLoggedIn={userLoggedIn} />
        {children}
        <Footer />
      </section>
    </>
  );
}
