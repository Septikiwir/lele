"use client";

import { useEffect, useState } from "react";
import { syncManager } from "./offline-db";

export function useOnline() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger background sync when coming back online
        try {
          await syncManager.syncPendingOperations();
        } catch (error) {
          console.error("Failed to sync pending operations:", error);
        }
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check (some browsers don't fire events reliably)
    const interval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        if (currentStatus) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, wasOffline]);

  return { isOnline, wasOffline };
}
