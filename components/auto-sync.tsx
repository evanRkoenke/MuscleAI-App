import { useEffect, useRef } from "react";
import { useApp } from "@/lib/app-context";

/**
 * AutoSync — Automatically syncs data on app launch for paid subscribers.
 *
 * Flow:
 * 1. Waits for app state to finish loading
 * 2. Checks if user is authenticated and has a paid subscription
 * 3. Pulls cloud data first (to get latest from other devices)
 * 4. Then pushes local data to cloud (to sync any local-only changes)
 * 5. Runs once per app launch (not on every re-render)
 *
 * Must be rendered inside AppProvider.
 */
export function AutoSync() {
  const {
    loading,
    isAuthenticated,
    subscription,
    syncFromCloud,
    syncToCloud,
    restoreSubscriptionFromCloud,
  } = useApp();
  const hasRun = useRef(false);

  useEffect(() => {
    if (loading || hasRun.current) return;
    if (!isAuthenticated) return;

    hasRun.current = true;

    const runAutoSync = async () => {
      try {
        // First, restore subscription tier from server (in case it changed)
        await restoreSubscriptionFromCloud();
      } catch (e) {
        console.warn("[AutoSync] Failed to restore subscription:", e);
      }

      // Re-check subscription after restore (need to read from context)
      // Since restoreSubscriptionFromCloud updates state, we use the current
      // subscription value. If user was free and now paid, next launch will sync.
      if (subscription === "free") {
        console.log("[AutoSync] Free user — skipping cloud sync");
        return;
      }

      try {
        console.log("[AutoSync] Pulling cloud data...");
        const pullResult = await syncFromCloud();
        if (pullResult.success) {
          console.log("[AutoSync] Pull complete. Pushing local data...");
          const pushResult = await syncToCloud();
          console.log("[AutoSync] Push result:", pushResult.message);
        } else {
          console.warn("[AutoSync] Pull failed:", pullResult.message);
        }
      } catch (e) {
        console.warn("[AutoSync] Sync error:", e);
      }
    };

    // Small delay to let the app settle after launch
    const timer = setTimeout(runAutoSync, 1500);
    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, subscription]);

  return null;
}
