import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";

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
    <html lang="en">
      <body className="bg-navy-950 text-slate-100 min-h-screen antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
