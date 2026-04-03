import { useEffect, useRef } from "react";
import { useApp } from "@/lib/app-context";

/**
 * AutoSync — Automatically syncs data on app launch for paid subscribers.
 *
 * Flow:
 * 1. Waits for app state to finish loading
 * 2. Checks if user is authenticated
 * 3. Restores subscription tier from server (in case it changed)
 * 4. If user has a paid subscription, pulls then pushes cloud data
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
  // Track subscription in a ref so the async function always reads the latest value
  const subscriptionRef = useRef(subscription);
  subscriptionRef.current = subscription;

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

      // Wait a tick for the state update from restoreSubscriptionFromCloud to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Read the latest subscription from the ref (not the stale closure value)
      const currentSubscription = subscriptionRef.current;

      if (currentSubscription === "none") {
        console.log("[AutoSync] No subscription — skipping cloud sync");
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
