import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "CampusOS AI — Intelligent Campus Scheduling & Venue Management",
  description:
    "Next-generation AI-powered academic scheduling, automated clash-free timetable generation, and venue management platform for Chitkara Institute of Technology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-navy-950 text-slate-100 min-h-screen antialiased selection:bg-blue-600/30 selection:text-blue-300">
        {children}
      </body>
    </html>
  );
}
