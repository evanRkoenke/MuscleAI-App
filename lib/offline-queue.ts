/**
 * Muscle AI — Offline Sync Queue
 *
 * Buffers data mutations when the device is offline and automatically
 * pushes them to the cloud when connectivity is restored.
 *
 * Queue entries are persisted in AsyncStorage so they survive app restarts.
 * Each entry represents a data change (meal added, weight logged, etc.)
 * that needs to be synced to the server.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "muscle_ai_offline_queue";
const QUEUE_META_KEY = "muscle_ai_offline_queue_meta";

export type QueueEntryType =
  | "meal_add"
  | "meal_remove"
  | "weight_add"
  | "weight_remove"
  | "gains_card_save"
  | "gains_card_remove"
  | "profile_update"
  | "full_sync";

export interface QueueEntry {
  id: string;
  type: QueueEntryType;
  data: any;
  timestamp: string;
  retryCount: number;
}

export interface QueueMeta {
  totalQueued: number;
  lastFlushAttempt: string | null;
  lastFlushSuccess: string | null;
}

/**
 * Generate a unique ID for queue entries
 */
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Load the offline queue from AsyncStorage
 */
export async function loadQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save the offline queue to AsyncStorage
 */
export async function saveQueue(queue: QueueEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load queue metadata
 */
export async function loadQueueMeta(): Promise<QueueMeta> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_META_KEY);
    if (!raw) return { totalQueued: 0, lastFlushAttempt: null, lastFlushSuccess: null };
    return JSON.parse(raw);
  } catch {
    return { totalQueued: 0, lastFlushAttempt: null, lastFlushSuccess: null };
  }
}

/**
 * Save queue metadata
 */
export async function saveQueueMeta(meta: QueueMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Add an entry to the offline queue
 */
export async function enqueue(type: QueueEntryType, data: any): Promise<void> {
  const queue = await loadQueue();
  const entry: QueueEntry = {
    id: generateId(),
    type,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  // For full_sync, replace any existing full_sync entry
  if (type === "full_sync") {
    const filtered = queue.filter((e) => e.type !== "full_sync");
    filtered.push(entry);
    await saveQueue(filtered);
  } else {
    queue.push(entry);
    await saveQueue(queue);
  }

  const meta = await loadQueueMeta();
  meta.totalQueued++;
  await saveQueueMeta(meta);
}

/**
 * Remove a specific entry from the queue (after successful processing)
 */
export async function dequeue(entryId: string): Promise<void> {
  const queue = await loadQueue();
  const filtered = queue.filter((e) => e.id !== entryId);
  await saveQueue(filtered);
}

/**
 * Clear the entire queue
 */
export async function clearQueue(): Promise<void> {
  await saveQueue([]);
}

/**
 * Get the number of pending entries
 */
export async function getPendingCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

/**
 * Increment retry count for a failed entry
 */
export async function incrementRetry(entryId: string): Promise<void> {
  const queue = await loadQueue();
  const entry = queue.find((e) => e.id === entryId);
  if (entry) {
    entry.retryCount++;
    await saveQueue(queue);
  }
}

/**
 * Remove entries that have exceeded max retries
 */
export async function pruneFailedEntries(maxRetries: number = 5): Promise<number> {
  const queue = await loadQueue();
  const before = queue.length;
  const filtered = queue.filter((e) => e.retryCount < maxRetries);
  await saveQueue(filtered);
  return before - filtered.length;
}

/**
 * Check if the queue has any pending entries
 */
export async function hasPendingEntries(): Promise<boolean> {
  const queue = await loadQueue();
  return queue.length > 0;
}

/**
 * Compact the queue by merging redundant operations.
 * For example, multiple profile_update entries can be merged into one.
 * Multiple meal_add/remove for the same ID can be collapsed.
 */
export async function compactQueue(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length <= 1) return;

  // If there's a full_sync, it supersedes all individual operations
  const hasFullSync = queue.some((e) => e.type === "full_sync");
  if (hasFullSync) {
    const fullSync = queue.filter((e) => e.type === "full_sync").pop()!;
    await saveQueue([fullSync]);
    return;
  }

  // Keep only the latest profile_update
  const profileUpdates = queue.filter((e) => e.type === "profile_update");
  const otherEntries = queue.filter((e) => e.type !== "profile_update");
  if (profileUpdates.length > 1) {
    otherEntries.push(profileUpdates[profileUpdates.length - 1]);
    await saveQueue(otherEntries);
  }
}

/**
 * Format queue status for display
 */
export function formatQueueStatus(count: number): string {
  if (count === 0) return "All synced";
  if (count === 1) return "1 change pending";
  return `${count} changes pending`;
}
