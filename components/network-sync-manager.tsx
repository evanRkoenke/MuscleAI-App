import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useApp } from "@/lib/app-context";

/**
 * NetworkSyncManager — Monitors connectivity and flushes the offline queue
 * when the device comes back online.
 *
 * Behavior:
 * 1. Listens for network state changes via expo-network
 * 2. When connectivity is restored, flushes the offline queue
 * 3. Also checks on app foreground (AppState change)
 * 4. Only runs for authenticated paid users
 *
 * Must be rendered inside AppProvider.
 */
export function NetworkSyncManager() {
  const {
    isAuthenticated,
    subscription,
    syncToCloud,
  } = useApp();
  const isFlushing = useRef(false);
  const wasOffline = useRef(false);
  const lastFlush = useRef(0);

  const shouldSync = isAuthenticated && subscription !== "free";

  const flushQueue = useCallback(async () => {
    if (!shouldSync || isFlushing.current) return;
    // Debounce: don't flush more than once every 30 seconds
    const now = Date.now();
    if (now - lastFlush.current < 30000) return;

    try {
      const { loadQueue, clearQueue, saveQueueMeta, loadQueueMeta } = await import("@/lib/offline-queue");
      const queue = await loadQueue();
      if (queue.length === 0) return;

      isFlushing.current = true;
      lastFlush.current = now;

      console.log(`[NetworkSync] Flushing ${queue.length} queued entries...`);

      const meta = await loadQueueMeta();
      meta.lastFlushAttempt = new Date().toISOString();
      await saveQueueMeta(meta);

      // Push all local data to cloud (full sync covers all queued changes)
      const result = await syncToCloud();

      if (result.success) {
        console.log("[NetworkSync] Queue flushed successfully");
        await clearQueue();
        meta.lastFlushSuccess = new Date().toISOString();
        await saveQueueMeta(meta);
      } else {
        console.warn("[NetworkSync] Flush failed:", result.message);
      }
    } catch (error) {
      console.warn("[NetworkSync] Flush error:", error);
    } finally {
      isFlushing.current = false;
    }
  }, [shouldSync, syncToCloud]);

  // Listen for network state changes
  useEffect(() => {
    if (!shouldSync) return;

    let cleanup: (() => void) | undefined;

    const setupListener = async () => {
      try {
        // Dynamic import to avoid issues on web
        const Network = await import("expo-network");

        // Check initial state
        const initialState = await Network.getNetworkStateAsync();
        wasOffline.current = !initialState.isInternetReachable;

        // Listen for changes
        const subscription = Network.addNetworkStateListener((state) => {
          const isOnline = state.isInternetReachable ?? state.isConnected;

          if (isOnline && wasOffline.current) {
            console.log("[NetworkSync] Connectivity restored, flushing queue...");
            flushQueue();
          }

          wasOffline.current = !isOnline;
        });

        cleanup = () => subscription.remove();
      } catch (error) {
        // expo-network may not be available on web
        console.warn("[NetworkSync] Could not set up network listener:", error);
      }
    };

    setupListener();

    return () => {
      if (cleanup) cleanup();
    };
  }, [shouldSync, flushQueue]);

  // Also check on app foreground
  useEffect(() => {
    if (!shouldSync) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        // Small delay to let network settle after wake
        setTimeout(flushQueue, 2000);
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [shouldSync, flushQueue]);

  return null;
}
