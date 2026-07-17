import { openDB, DBSchema, IDBPDatabase } from "idb";

interface OfflineMutation {
  id: string;
  type: "create" | "update" | "delete";
  resource: string; // e.g., "tasks", "comments", "projects"
  data: any;
  timestamp: number;
  retries: number;
  priority: "high" | "normal" | "low";
}

interface OfflineQueueDB extends DBSchema {
  mutations: {
    key: string;
    value: OfflineMutation;
    indexes: { "by-resource": string; "by-priority": string; "by-timestamp": number };
  };
  pendingReads: {
    key: string;
    value: { id: string; url: string; options: RequestInit; timestamp: number };
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "agency-os-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineQueueDB>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineQueueDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("mutations")) {
          const mutationStore = db.createObjectStore("mutations", { keyPath: "id" });
          mutationStore.createIndex("by-resource", "resource");
          mutationStore.createIndex("by-priority", "priority");
          mutationStore.createIndex("by-timestamp", "timestamp");
        }
        if (!db.objectStoreNames.contains("pendingReads")) {
          const readStore = db.createObjectStore("pendingReads", { keyPath: "id" });
          readStore.createIndex("by-timestamp", "timestamp");
        }
      }
    });
  }
  return dbPromise;
}

export async function queueMutation(
  type: OfflineMutation["type"],
  resource: string,
  data: any,
  priority: "high" | "normal" | "low" = "normal"
): Promise<string> {
  const db = await getDB();
  const id = `${resource}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const mutation: OfflineMutation = {
    id,
    type,
    resource,
    data,
    timestamp: Date.now(),
    retries: 0,
    priority
  };

  await db.add("mutations", mutation);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncQueue();
  }
  
  return id;
}

export async function getQueuedMutations(): Promise<OfflineMutation[]> {
  const db = await getDB();
  return db.getAllFromIndex("mutations", "by-timestamp");
}

export async function getMutationsByResource(resource: string): Promise<OfflineMutation[]> {
  const db = await getDB();
  return db.getAllFromIndex("mutations", "by-resource", resource);
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("mutations", id);
}

export async function incrementRetry(id: string): Promise<void> {
  const db = await getDB();
  const mutation = await db.get("mutations", id);
  if (mutation) {
    mutation.retries++;
    await db.put("mutations", mutation);
  }
}

export async function clearOldMutations(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const db = await getDB();
  const mutations = await db.getAllFromIndex("mutations", "by-timestamp");
  const cutoff = Date.now() - maxAge;
  let deleted = 0;
  
  for (const mutation of mutations) {
    if (mutation.timestamp < cutoff) {
      await db.delete("mutations", mutation.id);
      deleted++;
    }
  }
  return deleted;
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const db = await getDB();
  const mutations = await db.getAllFromIndex("mutations", "by-timestamp");
  
  let synced = 0;
  let failed = 0;

  for (const mutation of mutations) {
    if (mutation.retries >= 5) {
      // Max retries exceeded, remove
      await db.delete("mutations", mutation.id);
      failed++;
      continue;
    }

    try {
      await executeMutation(mutation);
      await db.delete("mutations", mutation.id);
      synced++;
    } catch (error) {
      await incrementRetry(mutation.id);
      failed++;
    }
  }

  return { synced, failed };
}

async function executeMutation(mutation: OfflineMutation): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = `${baseUrl}/api/offline/${mutation.resource}`;
  
  let method: string;
  let body: any;

  switch (mutation.type) {
    case "create":
      method = "POST";
      body = mutation.data;
      break;
    case "update":
      method = "PATCH";
      body = mutation.data;
      break;
    case "delete":
      method = "DELETE";
      body = { id: mutation.data.id };
      break;
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Mutation failed: ${response.status}`);
  }
}

// Queue failed reads for retry
export async function queueFailedRead(url: string, options: RequestInit): Promise<void> {
  const db = await getDB();
  const id = `read-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.add("pendingReads", { id, url, options, timestamp: Date.now() });
}

export async function retryPendingReads(): Promise<void> {
  if (!navigator.onLine) return;
  
  const db = await getDB();
  const reads = await db.getAllFromIndex("pendingReads", "by-timestamp");
  
  for (const read of reads) {
    try {
      const response = await fetch(read.url, read.options);
      if (response.ok) {
        await db.delete("pendingReads", read.id);
      }
    } catch {
      // Keep in queue
    }
  }
}

// Register background sync
export function registerBackgroundSync(): void {
  if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      (registration as any).sync.register("offline-mutations").catch(console.error);
    });
  }
}

// Listen for online/offline
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncQueue();
    retryPendingReads();
  });
}
