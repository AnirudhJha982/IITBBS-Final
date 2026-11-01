"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, AlertTriangle } from "lucide-react";

export function PwaRegistrar() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("VetoGrid Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("VetoGrid Service Worker registration failed:", err);
        });
    }

    // 2. Track Online/Offline Status
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
      <div>
        <p className="font-semibold text-amber-200">Offline Mode Active</p>
        <p className="text-[11px] text-amber-300/80">
          Viewing cached timetable &amp; schedule data (Read-Only). Booking modifications require a live connection.
        </p>
      </div>
    </div>
  );
}

