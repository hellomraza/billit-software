"use client";

import { openDB } from "idb";
import type { StateStorage } from "zustand/middleware";

const DB_NAME = "billing-app-db";
const STORE_NAME = "zustand-store";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

// Zustand persist + createJSONStorage expects string values.
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string) => {
    const db = await dbPromise;
    const value = await db.get(STORE_NAME, name);

    if (typeof value === "string") {
      return value;
    }

    return null;
  },

  setItem: async (name: string, value: string) => {
    const db = await dbPromise;
    await db.put(STORE_NAME, value, name);
  },

  removeItem: async (name: string) => {
    const db = await dbPromise;
    await db.delete(STORE_NAME, name);
  },
};
