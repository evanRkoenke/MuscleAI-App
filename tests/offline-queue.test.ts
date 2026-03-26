import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const mockStorage = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
  },
}));

import {
  loadQueue,
  saveQueue,
  enqueue,
  dequeue,
  clearQueue,
  getPendingCount,
  hasPendingEntries,
  compactQueue,
  formatQueueStatus,
  pruneFailedEntries,
  incrementRetry,
  loadQueueMeta,
  type QueueEntry,
} from "../lib/offline-queue";

describe("Offline Sync Queue", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe("Queue operations", () => {
    it("should start with an empty queue", async () => {
      const queue = await loadQueue();
      expect(queue).toEqual([]);
    });

    it("should enqueue a meal_add entry", async () => {
      await enqueue("meal_add", { id: "m1", name: "Chicken Breast", protein: 45 });
      const queue = await loadQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe("meal_add");
      expect(queue[0].data.name).toBe("Chicken Breast");
      expect(queue[0].retryCount).toBe(0);
    });

    it("should enqueue multiple entries", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("weight_add", { id: "w1", weight: 180 });
      await enqueue("profile_update", { calorieGoal: 2500 });
      const queue = await loadQueue();
      expect(queue).toHaveLength(3);
    });

    it("should dequeue a specific entry by ID", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("weight_add", { id: "w1" });
      const queue = await loadQueue();
      const firstId = queue[0].id;
      await dequeue(firstId);
      const updated = await loadQueue();
      expect(updated).toHaveLength(1);
      expect(updated[0].type).toBe("weight_add");
    });

    it("should clear the entire queue", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("meal_add", { id: "m2" });
      await clearQueue();
      const queue = await loadQueue();
      expect(queue).toEqual([]);
    });

    it("should return correct pending count", async () => {
      expect(await getPendingCount()).toBe(0);
      await enqueue("meal_add", { id: "m1" });
      expect(await getPendingCount()).toBe(1);
      await enqueue("meal_add", { id: "m2" });
      expect(await getPendingCount()).toBe(2);
    });

    it("should check if queue has pending entries", async () => {
      expect(await hasPendingEntries()).toBe(false);
      await enqueue("meal_add", { id: "m1" });
      expect(await hasPendingEntries()).toBe(true);
    });
  });

  describe("full_sync deduplication", () => {
    it("should replace existing full_sync entries", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("full_sync", { version: 1 });
      await enqueue("full_sync", { version: 2 });
      const queue = await loadQueue();
      // Should have meal_add + latest full_sync only
      const fullSyncs = queue.filter((e) => e.type === "full_sync");
      expect(fullSyncs).toHaveLength(1);
      expect(fullSyncs[0].data.version).toBe(2);
    });
  });

  describe("Queue compaction", () => {
    it("should compact queue when full_sync exists", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("weight_add", { id: "w1" });
      await enqueue("full_sync", { all: true });
      await compactQueue();
      const queue = await loadQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe("full_sync");
    });

    it("should keep only latest profile_update", async () => {
      await enqueue("profile_update", { calorieGoal: 2000 });
      await enqueue("meal_add", { id: "m1" });
      await enqueue("profile_update", { calorieGoal: 2500 });
      await compactQueue();
      const queue = await loadQueue();
      const profileUpdates = queue.filter((e) => e.type === "profile_update");
      expect(profileUpdates).toHaveLength(1);
      expect(profileUpdates[0].data.calorieGoal).toBe(2500);
    });
  });

  describe("Retry and pruning", () => {
    it("should increment retry count", async () => {
      await enqueue("meal_add", { id: "m1" });
      const queue = await loadQueue();
      const entryId = queue[0].id;
      await incrementRetry(entryId);
      await incrementRetry(entryId);
      const updated = await loadQueue();
      expect(updated[0].retryCount).toBe(2);
    });

    it("should prune entries exceeding max retries", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("meal_add", { id: "m2" });
      const queue = await loadQueue();
      // Set first entry to 6 retries
      for (let i = 0; i < 6; i++) {
        await incrementRetry(queue[0].id);
      }
      const pruned = await pruneFailedEntries(5);
      expect(pruned).toBe(1);
      const remaining = await loadQueue();
      expect(remaining).toHaveLength(1);
    });
  });

  describe("Queue metadata", () => {
    it("should track total queued count", async () => {
      await enqueue("meal_add", { id: "m1" });
      await enqueue("meal_add", { id: "m2" });
      const meta = await loadQueueMeta();
      expect(meta.totalQueued).toBe(2);
    });
  });

  describe("formatQueueStatus", () => {
    it("should format zero pending", () => {
      expect(formatQueueStatus(0)).toBe("All synced");
    });

    it("should format single pending", () => {
      expect(formatQueueStatus(1)).toBe("1 change pending");
    });

    it("should format multiple pending", () => {
      expect(formatQueueStatus(5)).toBe("5 changes pending");
    });
  });
});
