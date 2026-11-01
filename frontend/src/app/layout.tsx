import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { PwaRegistrar } from "@/components/shared/PwaRegistrar";

export const metadata: Metadata = {
  title: "VetoGrid — Intelligent Campus Scheduling & Venue Management",
  description:
    "Next-generation AI-powered academic scheduling, automated clash-free timetable generation, and venue management platform for Chitkara Institute of Technology.",
  manifest: "/manifest.json",
  icons: { icon: "/vetogrid-eagle.svg", apple: "/vetogrid-eagle.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VetoGrid",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F2E7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-navy-950 text-slate-900 min-h-screen antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          {children}
          <PwaRegistrar />
        </AuthProvider>
      </body>
    </html>
  );
}
