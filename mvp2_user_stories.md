# MVP 2 — Multi-Tab Billing

## User Story Breakdown with Tasks and Subtasks

**Version:** 1.0  
**Based on:** MVP 2 PRD (Single Source of Truth)  
**Depends on:** MVP 1 fully deployed and stable  
**Last Updated:** 2026-04-13

---

## How to Read This Document

Each **User Story** represents a complete, shippable piece of value from the user's perspective.  
Each **Task** is a discrete unit of work — labelled `[BE]` (backend) or `[FE]` (frontend).  
Each **Subtask** is a specific, actionable implementation step with instructions, expected output, and acceptance criteria.  
Complete tasks in the order listed within each story. Stories can be worked in parallel where noted.

---

## Story Map Overview

| #     | User Story                                               | Priority    |
| ----- | -------------------------------------------------------- | ----------- |
| US-01 | Draft API — Server-side draft persistence                | Must have   |
| US-02 | IndexedDB Upgrade — Client draft cache schema            | Must have   |
| US-03 | Tab Bar UI — Create, switch, close, rename tabs          | Must have   |
| US-04 | Draft Sync Engine — Debounced save to server             | Must have   |
| US-05 | Load Drafts on Login — Restore tabs from server          | Must have   |
| US-06 | Cross-Tab Stock Awareness — Aggregate warnings           | Must have   |
| US-07 | Saved Drafts Panel — Reopen and discard closed drafts    | Must have   |
| US-08 | Offline Behavior — Read-only mode for synced drafts      | Must have   |
| US-09 | Post-Finalization Tab Behavior — Clear tab, keep it open | Must have   |
| US-10 | Settings Screen — Saved drafts count and link            | Should have |

---

---

## US-01 — Draft API: Server-Side Draft Persistence

**As a shopkeeper, I want my draft bills to be saved to the server so that I never lose a bill when I switch devices or refresh the browser.**

**Scope:** Backend only. No frontend changes in this story.  
**Dependency:** Must be complete before US-04 (sync engine).

---

### T-01.1 — `[BE]` Create the Draft database schema

**What:** Define and migrate the new `Draft` table/collection in the database.

**How:**  
Create a new model named `Draft` with exactly these fields:

| Field         | Type                  | Constraints                                           |
| ------------- | --------------------- | ----------------------------------------------------- |
| id            | UUID / ObjectId       | PK, auto-generated                                    |
| clientDraftId | string (UUID)         | Required, unique per tenant — used as idempotency key |
| tenantId      | ref → Tenant          | Required                                              |
| outletId      | ref → Outlet          | Required                                              |
| tabLabel      | string                | Optional, max 50 chars, default null                  |
| items         | JSON / array          | Required, can be empty array                          |
| customerName  | string                | Optional                                              |
| customerPhone | string                | Optional                                              |
| paymentMethod | enum: CASH, CARD, UPI | Optional, nullable                                    |
| isDeleted     | boolean               | Default: false                                        |
| createdAt     | timestamp             | Auto                                                  |
| updatedAt     | timestamp             | Auto on every update                                  |
| syncedAt      | timestamp             | Nullable — set by server when it processes a sync     |

**Constraints to enforce:**

- `clientDraftId` must be unique per `tenantId`. Two different tenants can have the same `clientDraftId` value (it is client-generated UUID), but one tenant cannot have duplicate `clientDraftId` values.
- No unique constraint on `(tenantId, outletId)` — multiple drafts per outlet are explicitly allowed.

**Items array element shape:**

```json
{
  "productId": "uuid",
  "productName": "string",
  "quantity": 1,
  "unitPrice": 150.0,
  "gstRate": 18
}
```

Items are not validated against live products at the time of draft save. They are advisory client state.

**Expected output:** Database migration file applied. `Draft` model/schema file created. No API routes yet.

---

- [ ] **ST-01.1.1** Define the `Draft` model with all fields, types, and constraints listed above. Create the schema/model file in the models directory.
  - **Expected output:** `Draft` model file. Running the migration or syncing the schema creates the table/collection with correct columns and indexes.
- [ ] **ST-01.1.2** Add a compound index on `(tenantId, isDeleted)` for efficient queries when fetching all active drafts for a tenant.
  - **Expected output:** Index created. Query `{ tenantId: X, isDeleted: false }` uses the index.

- [ ] **ST-01.1.3** Add a unique index on `(tenantId, clientDraftId)` to enforce idempotency.
  - **Expected output:** Attempting to insert a second draft with the same `(tenantId, clientDraftId)` returns a duplicate key error.

---

### T-01.2 — `[BE]` Create the Draft upsert endpoint (sync)

**What:** `POST /drafts/sync` — receives a full draft payload from the client and upserts it. This is the primary sync endpoint called by the client after every debounced change.

**How:**  
This endpoint must be idempotent. The `clientDraftId` is the idempotency key. If a draft with this `clientDraftId` already exists for this tenant, update it. If not, create it.

**Request shape:**

```json
{
  "clientDraftId": "uuid-v4",
  "outletId": "uuid",
  "tabLabel": "Bill 1",
  "items": [
    {
      "productId": "uuid",
      "productName": "Rice 1kg",
      "quantity": 2,
      "unitPrice": 60.0,
      "gstRate": 5
    }
  ],
  "customerName": null,
  "customerPhone": null,
  "paymentMethod": "CASH"
}
```

**Server behavior:**

1. Authenticate request — extract `tenantId` from JWT.
2. Validate `outletId` belongs to this tenant (security check — reject if not).
3. Upsert Draft where `clientDraftId = X AND tenantId = Y`:
   - If exists: update all fields (`tabLabel`, `items`, `customerName`, `customerPhone`, `paymentMethod`, `updatedAt`, `syncedAt = now`). Set `isDeleted = false` (never allow sync to delete — deletion is a separate endpoint).
   - If not exists: create new record with all fields. Set `syncedAt = now`.
4. Return the saved draft object.

**Response 200/201:**

```json
{
  "id": "server-uuid",
  "clientDraftId": "client-uuid",
  "tenantId": "uuid",
  "outletId": "uuid",
  "tabLabel": "Bill 1",
  "items": [...],
  "customerName": null,
  "customerPhone": null,
  "paymentMethod": "CASH",
  "isDeleted": false,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "syncedAt": "ISO timestamp"
}
```

**Response 400:** `outletId` not found or doesn't belong to tenant.  
**Response 401:** Not authenticated.

**Expected output:** `POST /drafts/sync` endpoint live. Calling it twice with the same `clientDraftId` updates rather than creates a duplicate.

---

- [ ] **ST-01.2.1** Create the route handler for `POST /drafts/sync`. Wire authentication middleware.
  - **Expected output:** Route exists. Returns 401 when called without a valid JWT.

- [ ] **ST-01.2.2** Implement the upsert logic: find draft by `(tenantId, clientDraftId)`. If found, update. If not found, create. Return the resulting document.
  - **Expected output:** Calling the endpoint twice with the same `clientDraftId` results in one database record, not two.

- [ ] **ST-01.2.3** Add the outlet ownership validation: reject with 400 if `outletId` does not belong to the authenticated tenant.
  - **Expected output:** Sending a random `outletId` returns a 400 error.

- [ ] **ST-01.2.4** Write a unit test: create a draft, call sync again with same `clientDraftId` and different `tabLabel`, verify the `tabLabel` was updated and no duplicate was created.
  - **Expected output:** Test passes. DB has exactly one draft record after two sync calls with same `clientDraftId`.

---

### T-01.3 — `[BE]` Create the Get All Drafts endpoint

**What:** `GET /drafts` — returns all non-deleted drafts for the authenticated tenant's default outlet, ordered by `updatedAt` ascending.

**How:**  
This endpoint is called on login and page load to restore all open tabs.

**Query behavior:**

- Filter: `tenantId = authenticated tenant AND isDeleted = false`
- For MVP 2, also filter by `outletId = default outlet` (since multi-outlet is MVP 4)
- Order: `updatedAt ASC` (oldest first — consistent ordering across devices)
- No pagination. Return all drafts. A tenant is unlikely to have more than 10–20 open drafts.

**Response 200:**

```json
{
  "drafts": [
    {
      "id": "server-uuid",
      "clientDraftId": "client-uuid",
      "tabLabel": "Bill 1",
      "items": [...],
      "customerName": null,
      "customerPhone": null,
      "paymentMethod": null,
      "isDeleted": false,
      "createdAt": "...",
      "updatedAt": "...",
      "syncedAt": "..."
    }
  ]
}
```

**Expected output:** `GET /drafts` endpoint live. Returns empty `{ drafts: [] }` when no active drafts exist.

---

- [ ] **ST-01.3.1** Create the route handler for `GET /drafts`. Authenticate with JWT. Query all drafts where `tenantId = X AND isDeleted = false`, ordered by `updatedAt ASC`.
  - **Expected output:** Returns correct list for authenticated tenant. Returns empty array for new tenant.

- [ ] **ST-01.3.2** Ensure the endpoint does NOT return deleted drafts (`isDeleted = true`).
  - **Expected output:** A draft that was soft-deleted via the delete endpoint does not appear in this response.

---

### T-01.4 — `[BE]` Create the Delete Draft endpoint

**What:** `DELETE /drafts/:clientDraftId` — soft-deletes a draft by setting `isDeleted = true`.

**How:**  
This is called when the user explicitly discards a bill from the Saved Drafts panel.  
Soft delete only — never hard delete drafts. The record remains in the database for audit purposes.

**Server behavior:**

1. Authenticate.
2. Find draft by `(clientDraftId, tenantId)`. If not found: return 404.
3. Set `isDeleted = true`, `updatedAt = now`.
4. Return 200 with updated draft.

**Response 200:** Updated draft object with `isDeleted: true`.  
**Response 404:** Draft not found.  
**Response 401:** Not authenticated.

**Expected output:** `DELETE /drafts/:clientDraftId` endpoint live. Draft disappears from `GET /drafts` after deletion. Record still exists in DB with `isDeleted = true`.

---

- [ ] **ST-01.4.1** Create the route handler for `DELETE /drafts/:clientDraftId`. Find by `(clientDraftId, tenantId)`, set `isDeleted = true`, save, return updated document.
  - **Expected output:** Draft no longer returned by `GET /drafts` after delete.

- [ ] **ST-01.4.2** Confirm hard delete is impossible through this endpoint. The endpoint must only set `isDeleted = true` and never call a destroy/remove operation on the database record.
  - **Expected output:** Database record still exists after the delete endpoint is called.

---

### T-01.5 — `[BE]` Wire the delete-draft call into invoice finalization

**What:** When an invoice is successfully finalized, the backend must soft-delete the draft that was used to create that invoice.

**How:**  
The invoice creation request (existing `POST /tenants/:tenantId/invoices`) already receives a `clientGeneratedId`. In MVP 2, the client will also send a `clientDraftId` in the invoice creation payload so the server knows which draft to delete.

**Change to invoice creation request payload:**
Add optional field: `"clientDraftId": "uuid"`

**Change to invoice creation handler behavior:**
After the atomic commit (invoice created, stock updated), if `clientDraftId` is present in the request:

- Find the draft by `(clientDraftId, tenantId)`.
- Set `isDeleted = true`.
- This happens inside or immediately after the transaction. If the draft is not found, do not error — it may have already been deleted or never synced.

**Expected output:** After creating an invoice, the associated draft is automatically soft-deleted and disappears from `GET /drafts`.

---

- [ ] **ST-01.5.1** Update the invoice creation request schema to accept an optional `clientDraftId` field.
  - **Expected output:** Sending `clientDraftId` in the request body does not cause a validation error.

- [ ] **ST-01.5.2** After successful invoice creation, if `clientDraftId` is present, soft-delete the corresponding draft. Handle gracefully if draft is not found.
  - **Expected output:** After finalizing invoice from the billing screen, the draft no longer appears in `GET /drafts`.

---

---

## US-02 — Zustand Store: Client Draft State with IndexedDB Persistence

**As a developer, I need the client-side draft state to support multiple simultaneous drafts with sync metadata, persisted to IndexedDB via the existing Zustand + persist middleware + custom storage adapter pattern already established in MVP 1.**

**Scope:** Frontend only. No backend changes.  
**Dependency:** US-01 must be complete (need to know the server draft shape).

---

### Architecture Overview

The project already uses this pattern for MVP 1's single-bill store:

```
Zustand Store (in-memory React state)
  ↓ (persist middleware — automatically serializes on every state change)
indexedDBStorage adapter (lib/indexedDbStorage.ts — already exists)
  ↓
IndexedDB (via idb — stores the entire serialized store under one key)
```

MVP 2 follows the exact same pattern. The MVP 1 `useBillingStore` (single draft, key: `"billing-draft"`) is **replaced** by a new `useBillingTabsStore` (multiple drafts, key: `"billing-tabs-v2"`). The `indexedDBStorage` adapter file is **not changed** — it is reused as-is.

**Why a new store key (`billing-tabs-v2`) instead of upgrading `billing-draft`:**  
The shape of the persisted data changes fundamentally (from a single flat bill to an array of drafts + tab metadata). Using a new key avoids any risk of the persist middleware trying to rehydrate the old shape into the new store. The MVP 1 data under `"billing-draft"` can be read once during migration and then the key can be ignored.

---

### T-02.1 — `[FE]` Define all TypeScript types for the draft system

**What:** Create a shared types file for all draft-related types. These types are used by the Zustand store, the sync engine, and all billing components.

**Where to create:** `types/draft.ts`

**Types to define:**

```typescript
export interface DraftItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
}

export type SyncStatus = "SYNCED" | "PENDING_SYNC" | "SYNC_FAILED";
export type SyncFailureType = "NETWORK" | "SERVER" | null;
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "";

export interface LocalDraft {
  // Server-synced fields
  id?: string; // Server-assigned UUID. Undefined until first sync succeeds
  clientDraftId: string; // Client-generated UUID. Used as the stable identity key
  tenantId: string;
  outletId: string;
  tabLabel: string;
  items: DraftItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  isDeleted: boolean;
  createdAt: string; // ISO timestamp — set at creation, never changes
  updatedAt: string; // ISO timestamp — server time after successful sync
  syncedAt?: string; // ISO timestamp of last successful server sync

  // Local-only metadata (not sent to server)
  localUpdatedAt: string; // ISO timestamp of last local change — drives sync scheduling
  syncStatus: SyncStatus;
  syncFailureType: SyncFailureType; // distinguishes network vs server error
  isOfflineCreated: boolean; // true if created while device was offline
}

// A tab is a draft that is currently open in the tab bar
// "Saved drafts" are LocalDrafts where isDeleted = false but clientDraftId
// is NOT in openTabIds. The store holds both open and saved drafts together.
export interface BillingTabsState {
  drafts: LocalDraft[]; // ALL drafts: open tabs + saved (closed) drafts
  openTabIds: string[]; // clientDraftIds of drafts currently in the tab bar (ordered)
  activeTabId: string; // clientDraftId of the currently active tab
  tabCounter: number; // increments on every createTab(), never decrements

  // Actions — all synchronous, all update state + trigger persist to IndexedDB automatically
  createTab: (tenantId: string, outletId: string) => void;
  switchTab: (clientDraftId: string) => void;
  closeTab: (clientDraftId: string) => void;
  renameTab: (clientDraftId: string, label: string) => void;
  updateDraftItems: (clientDraftId: string, items: DraftItem[]) => void;
  updateDraftCustomer: (
    clientDraftId: string,
    name: string,
    phone: string,
  ) => void;
  updateDraftPayment: (clientDraftId: string, method: PaymentMethod) => void;
  clearAndResetTab: (
    clientDraftId: string,
    tenantId: string,
    outletId: string,
  ) => void;
  markDraftDeleted: (clientDraftId: string) => void;
  reopenDraft: (clientDraftId: string) => void;
  updateSyncStatus: (
    clientDraftId: string,
    status: SyncStatus,
    failureType?: SyncFailureType,
    serverData?: { id?: string; syncedAt?: string; updatedAt?: string },
  ) => void;
  hydrateDraftsFromServer: (
    serverDrafts: Omit<
      LocalDraft,
      "localUpdatedAt" | "syncStatus" | "syncFailureType" | "isOfflineCreated"
    >[],
  ) => void;
  getActiveDraft: () => LocalDraft | undefined;
  getDraft: (clientDraftId: string) => LocalDraft | undefined;
  getSavedDrafts: () => LocalDraft[]; // non-deleted drafts not in openTabIds
  getPendingSyncDrafts: () => LocalDraft[];
}
```

---

- [x] **ST-02.1.1** Create `types/draft.ts` with all types listed above. Export every type.
  - **Expected output:** TypeScript file compiles with zero errors. Every type listed above is importable from `@/types/draft`.

---

### T-02.2 — `[FE]` Create the `useBillingTabsStore` Zustand store

**What:** The central Zustand store that replaces MVP 1's `useBillingStore`. It holds all draft and tab state for the entire billing screen. It is persisted to IndexedDB automatically via the `persist` middleware using the already-existing `indexedDBStorage` adapter.

**File location:** `stores/billing-tabs-store.ts`

**Critical design rules:**

- The `indexedDBStorage` adapter from `lib/indexedDbStorage.ts` is imported and used unchanged.
- The persist key is `"billing-tabs-v2"`. Never reuse `"billing-draft"` (the MVP 1 key).
- Every action is a synchronous `set()` call. The persist middleware handles writing to IndexedDB automatically after every `set()` call — there are no manual `saveDraft()` calls anywhere.
- Selector functions (`getActiveDraft`, `getDraft`, `getSavedDrafts`, `getPendingSyncDrafts`) are defined inside the store so components can call `useBillingTabsStore(s => s.getActiveDraft())` without computing derived state in components.

**Full store implementation shape:**

```typescript
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { indexedDBStorage } from "@/lib/indexedDbStorage";
import { v4 as uuidv4 } from "uuid";
import type {
  BillingTabsState,
  LocalDraft,
  DraftItem,
  PaymentMethod,
  SyncStatus,
  SyncFailureType,
} from "@/types/draft";

function makeEmptyDraft(
  tenantId: string,
  outletId: string,
  label: string,
  isOfflineCreated: boolean,
): LocalDraft {
  const now = new Date().toISOString();
  return {
    clientDraftId: uuidv4(),
    tenantId,
    outletId,
    tabLabel: label,
    items: [],
    customerName: "",
    customerPhone: "",
    paymentMethod: "",
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    localUpdatedAt: now,
    syncStatus: "PENDING_SYNC",
    syncFailureType: null,
    isOfflineCreated,
  };
}

export const useBillingTabsStore = create<BillingTabsState>()(
  persist(
    (set, get) => ({
      drafts: [],
      openTabIds: [],
      activeTabId: "",
      tabCounter: 0,

      createTab: (tenantId, outletId) => {
        const counter = get().tabCounter + 1;
        const draft = makeEmptyDraft(
          tenantId,
          outletId,
          `Bill ${counter}`,
          !navigator.onLine,
        );
        set((state) => ({
          drafts: [...state.drafts, draft],
          openTabIds: [...state.openTabIds, draft.clientDraftId],
          activeTabId: draft.clientDraftId,
          tabCounter: counter,
        }));
      },

      switchTab: (clientDraftId) => set({ activeTabId: clientDraftId }),

      closeTab: (clientDraftId) =>
        set((state) => {
          const newOpenTabIds = state.openTabIds.filter(
            (id) => id !== clientDraftId,
          );
          // If closing the active tab, activate the previous tab or the first remaining
          let newActiveTabId = state.activeTabId;
          if (state.activeTabId === clientDraftId) {
            const idx = state.openTabIds.indexOf(clientDraftId);
            newActiveTabId =
              newOpenTabIds[Math.max(0, idx - 1)] ?? newOpenTabIds[0] ?? "";
          }
          // If no tabs remain, createTab will be called by the component (see US-03)
          return { openTabIds: newOpenTabIds, activeTabId: newActiveTabId };
          // NOTE: the draft itself stays in `drafts` — it moves to Saved Drafts
        }),

      renameTab: (clientDraftId, label) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  tabLabel: label,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      updateDraftItems: (clientDraftId, items) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  items,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      updateDraftCustomer: (clientDraftId, name, phone) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  customerName: name,
                  customerPhone: phone,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      updateDraftPayment: (clientDraftId, method) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  paymentMethod: method,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      clearAndResetTab: (clientDraftId, tenantId, outletId) => {
        // Called after successful invoice finalization.
        // Replaces the finalized draft with a brand-new empty draft in the same tab slot.
        const counter = get().tabCounter + 1;
        const newDraft = makeEmptyDraft(
          tenantId,
          outletId,
          `Bill ${counter}`,
          !navigator.onLine,
        );
        set((state) => ({
          drafts: state.drafts
            .filter((d) => d.clientDraftId !== clientDraftId) // remove old draft
            .concat(newDraft), // add new empty draft
          openTabIds: state.openTabIds.map((id) =>
            id === clientDraftId ? newDraft.clientDraftId : id,
          ),
          activeTabId:
            state.activeTabId === clientDraftId
              ? newDraft.clientDraftId
              : state.activeTabId,
          tabCounter: counter,
        }));
      },

      markDraftDeleted: (clientDraftId) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId ? { ...d, isDeleted: true } : d,
          ),
          openTabIds: state.openTabIds.filter((id) => id !== clientDraftId),
          activeTabId:
            state.activeTabId === clientDraftId
              ? (state.openTabIds.filter((id) => id !== clientDraftId)[0] ?? "")
              : state.activeTabId,
        })),

      reopenDraft: (clientDraftId) =>
        set((state) => ({
          openTabIds: [...state.openTabIds, clientDraftId],
          activeTabId: clientDraftId,
        })),

      updateSyncStatus: (
        clientDraftId,
        status,
        failureType = null,
        serverData = {},
      ) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  syncStatus: status,
                  syncFailureType: failureType,
                  ...(serverData.id ? { id: serverData.id } : {}),
                  ...(serverData.syncedAt
                    ? { syncedAt: serverData.syncedAt }
                    : {}),
                  ...(serverData.updatedAt
                    ? { updatedAt: serverData.updatedAt }
                    : {}),
                }
              : d,
          ),
        })),

      hydrateDraftsFromServer: (serverDrafts) =>
        set((state) => {
          // Merge server drafts into existing local state.
          // Server drafts take priority for their content fields.
          // Local drafts that are PENDING_SYNC are NOT overwritten (local is ahead of server).
          const serverMap = new Map(
            serverDrafts.map((d) => [d.clientDraftId, d]),
          );
          const updatedDrafts = state.drafts.map((local) => {
            const server = serverMap.get(local.clientDraftId);
            if (!server) return local;
            if (local.syncStatus === "PENDING_SYNC") return local; // local is ahead
            return {
              ...local,
              ...server,
              syncStatus: "SYNCED" as SyncStatus,
              syncFailureType: null,
              isOfflineCreated: false,
              localUpdatedAt: local.localUpdatedAt,
            };
          });
          // Add server drafts that don't exist locally at all
          const localIds = new Set(state.drafts.map((d) => d.clientDraftId));
          const now = new Date().toISOString();
          const newDrafts = serverDrafts
            .filter((s) => !localIds.has(s.clientDraftId))
            .map((s) => ({
              ...s,
              localUpdatedAt: s.updatedAt ?? now,
              syncStatus: "SYNCED" as SyncStatus,
              syncFailureType: null,
              isOfflineCreated: false,
            }));
          const allDrafts = [...updatedDrafts, ...newDrafts];
          // Rebuild openTabIds: keep existing open tabs that still exist and aren't deleted
          const validOpenTabIds = state.openTabIds.filter((id) =>
            allDrafts.some((d) => d.clientDraftId === id && !d.isDeleted),
          );
          // Add server drafts that are not open and not deleted as open tabs
          // (they were open on another device — restore them)
          const serverOpenIds = serverDrafts
            .filter(
              (s) => !s.isDeleted && !validOpenTabIds.includes(s.clientDraftId),
            )
            .map((s) => s.clientDraftId);
          const newOpenTabIds = [...validOpenTabIds, ...serverOpenIds];
          return {
            drafts: allDrafts,
            openTabIds: newOpenTabIds,
            activeTabId: state.activeTabId || newOpenTabIds[0] || "",
          };
        }),

      getActiveDraft: () => {
        const { drafts, activeTabId } = get();
        return drafts.find((d) => d.clientDraftId === activeTabId);
      },

      getDraft: (clientDraftId) => {
        return get().drafts.find((d) => d.clientDraftId === clientDraftId);
      },

      getSavedDrafts: () => {
        const { drafts, openTabIds } = get();
        return drafts.filter(
          (d) => !d.isDeleted && !openTabIds.includes(d.clientDraftId),
        );
      },

      getPendingSyncDrafts: () => {
        return get().drafts.filter(
          (d) => !d.isDeleted && d.syncStatus === "PENDING_SYNC",
        );
      },
    }),
    {
      name: "billing-tabs-v2", // IndexedDB key — never collides with MVP1 "billing-draft"
      storage: indexedDBStorage, // the existing adapter — imported unchanged
    },
  ),
);
```

**Expected output:** `stores/billing-tabs-store.ts` file created. The store compiles with zero TypeScript errors. Calling any action (e.g. `createTab`) updates state in memory and the persist middleware automatically serializes the new state to IndexedDB under the key `"billing-tabs-v2"`. No manual IndexedDB calls are needed anywhere in the application.

---

- [x] **ST-02.2.1** Install `uuid` package if not already present: `npm install uuid @types/uuid`. Verify `idb` is already installed (it is used by `indexedDBStorage`).
  - **Expected output:** `uuid` is importable. `uuidv4()` works correctly.

- [x] **ST-02.2.2** Create `stores/billing-tabs-store.ts` with the full implementation above. Ensure the file starts with `"use client"` directive.
  - **Expected output:** File compiles. `useBillingTabsStore` is importable from `@/stores/billing-tabs-store`.

- [x] **ST-02.2.3** Verify the persist configuration: `name: "billing-tabs-v2"` and `storage: indexedDBStorage`. Open browser DevTools → Application → IndexedDB → `billing-app-db` → `zustand-store`. After calling `createTab()`, the key `"billing-tabs-v2"` should appear with the serialized state.
  - **Expected output:** IndexedDB entry visible after first action. State survives a full page reload.

- [x] **ST-02.2.4** Verify `closeTab` correctly leaves the draft in the `drafts` array (it only removes from `openTabIds`). The draft must be accessible via `getSavedDrafts()` after closing.
  - **Expected output:** After `closeTab("some-id")`, `getSavedDrafts()` returns that draft. `openTabIds` no longer contains it.

- [x] **ST-02.2.5** Verify `clearAndResetTab` generates a new `clientDraftId` and removes the old draft from the `drafts` array entirely. The old `clientDraftId` must not appear anywhere in state after this call.
  - **Expected output:** After `clearAndResetTab("old-id", ...)`, `getDraft("old-id")` returns `undefined`. A new draft with a fresh ID appears in `openTabIds` and as the active tab.

---

### T-02.3 — `[FE]` MVP 1 store migration: read existing draft on first load

**What:** MVP 1 users have a single draft stored in IndexedDB under the key `"billing-draft"`. On first load after the MVP 2 upgrade, this draft should be migrated into the new store as a tab so no work is lost.

**How:**  
In the billing page's `useEffect` (which runs after the Zustand store has rehydrated from `"billing-tabs-v2"`), check if the store has zero drafts AND if the MVP 1 key `"billing-draft"` exists in IndexedDB. If both are true, read the old data and create a tab from it.

```typescript
// In the billing page's initialization useEffect:
const {
  drafts,
  createTab,
  updateDraftItems,
  updateDraftCustomer,
  updateDraftPayment,
} = useBillingTabsStore();

useEffect(() => {
  if (drafts.length > 0) return; // already have data, no migration needed

  async function migrateMVP1Draft() {
    const db = await openDB("billing-app-db", 1);
    const oldDraft = await db.get("zustand-store", "billing-draft");
    if (!oldDraft || !oldDraft.state) return;

    const oldState = oldDraft.state;
    if (!oldState.items || oldState.items.length === 0) return; // empty draft, skip

    // Create a new tab and populate it with the MVP 1 draft content
    createTab(tenantId, outletId);
    // The newly created tab will be the active one — get its ID
    const newId = useBillingTabsStore.getState().activeTabId;
    updateDraftItems(newId, oldState.items);
    if (oldState.customerName || oldState.customerPhone) {
      updateDraftCustomer(
        newId,
        oldState.customerName ?? "",
        oldState.customerPhone ?? "",
      );
    }
    if (oldState.paymentMethod) {
      updateDraftPayment(newId, oldState.paymentMethod);
    }
  }

  migrateMVP1Draft();
}, []); // runs once after rehydration
```

**Expected output:** A user who had an active MVP 1 draft opens the app after the MVP 2 upgrade. Their draft appears as a tab with all items intact. The migration runs only once (after the first successful `createTab` call, `drafts.length > 0` and the migration is skipped on subsequent loads).

---

- [x] **ST-02.3.1** Implement the migration `useEffect` in the billing page component. Import `openDB` from `idb` (already installed). Read `"billing-draft"` from the existing IndexedDB store. If it contains items, call `createTab` + `updateDraftItems` etc. to populate the new store.
  - **Expected output:** A simulated MVP 1 user (manually seed `"billing-draft"` in DevTools) sees their items in a tab after upgrading.

- [x] **ST-02.3.2** Guard the migration: if `drafts.length > 0` on mount (store already has data from `"billing-tabs-v2"`), skip migration entirely.
  - **Expected output:** Refreshing the page after migration runs does not duplicate the items or run migration again.

---

---

## US-03 — Tab Bar UI: Create, Switch, Close, and Rename Tabs

**As a shopkeeper, I want a tab bar on the billing screen where I can open multiple bills simultaneously, switch between them instantly, and close ones I don't need.**

**Scope:** Frontend only. No backend changes.  
**Dependency:** US-02 must be complete (types needed). US-05 loads initial tabs — build the UI shell first without data.

---

### T-03.1 — `[FE]` Build the `BillingTabBar` component

**What:** A horizontal tab bar that sits at the very top of the billing screen content area (below the main nav, above the billing workspace). It always shows at least one tab.

**Visual design:**

- Each tab is a pill or rectangular tab showing: tab label text, an item count badge (e.g. "3 items" or just "3"), and a close button (×).
- The active tab is visually distinct: stronger background, stronger text, no close button hover needed.
- Inactive tabs are muted but clearly readable.
- A "+" button sits at the right end of the tab bar to create a new tab.
- A "Drafts" button (or folder icon) sits beside the "+" — opens the Saved Drafts Panel.
- If there are many tabs and they overflow the bar width, the tab bar scrolls horizontally (no wrapping).
- A small warning icon appears on a tab label if any item in that tab's cart exceeds the aggregate stock limit (see US-06).
- A small sync status dot appears on each tab: green = SYNCED, yellow = PENDING_SYNC, red = SYNC_FAILED.

**Component props:**

```typescript
interface BillingTabBarProps {
  tabs: TabState[]; // All open tabs
  activeTabId: string; // clientDraftId of active tab
  onTabClick: (clientDraftId: string) => void;
  onNewTab: () => void;
  onCloseTab: (clientDraftId: string) => void;
  onRenameTab: (clientDraftId: string, newLabel: string) => void;
  onOpenDraftsPanel: () => void;
}
```

**Expected output:** `components/billing/billing-tab-bar.tsx` component renders correctly with mock data. Clicking tabs calls `onTabClick`. Clicking × calls `onCloseTab`. Clicking + calls `onNewTab`. Clicking the Drafts button calls `onOpenDraftsPanel`.

---

- [x] **ST-03.1.1** Create `components/billing/billing-tab-bar.tsx`. Implement the layout: horizontal scrollable container, tab items, + button, Drafts button. Use Tailwind for styling. This is a `'use client'` component.
  - **Expected output:** Component renders without errors. Visible on the billing screen with a single placeholder tab.

- [x] **ST-03.1.2** Implement each individual tab item as a sub-component or inline. Show: label text (truncated at ~20 chars with ellipsis if too long), item count badge (hidden if count = 0), close button (×). Apply active/inactive styles.
  - **Expected output:** Tab with 0 items shows no badge. Tab with 3 items shows "3" badge. Active tab looks distinct from inactive tabs.

- [x] **ST-03.1.3** Implement the sync status indicator per tab. A small colored dot in the corner of the tab: green for SYNCED, amber for PENDING_SYNC, red for SYNC_FAILED. Add a tooltip on hover: "Saved", "Saving…", or "Save failed".
  - **Expected output:** Correct colored dot visible per tab based on `syncStatus` value.

- [x] **ST-03.1.4** Implement the stock warning icon per tab. If the `TabState` includes `hasStockWarning: boolean`, show a small amber warning icon on the tab label. This field will be computed and passed by the parent (US-06).
  - **Expected output:** Warning icon appears on a tab when `hasStockWarning = true`. No icon when false.

- [x] **ST-03.1.5** Implement horizontal overflow scroll on the tab bar. When tabs exceed the container width, the bar scrolls horizontally without wrapping. Hide the native scrollbar for a clean look.
  - **Expected output:** Creating 8+ tabs causes the bar to scroll horizontally.

---

### T-03.2 — `[FE]` Implement inline tab renaming

**What:** Double-clicking a tab label replaces it with an inline text input. Pressing Enter or clicking away confirms the rename.

**How:**

- Track `editingTabId: string | null` in local state of `BillingTabBar`.
- When `editingTabId === tab.clientDraftId`, render a small `<input>` instead of the label `<span>`.
- The input is pre-filled with the current label value.
- On blur or Enter keydown: if value is non-empty and changed, call `onRenameTab(clientDraftId, newLabel)`. If empty, revert to previous label.
- On Escape keydown: cancel edit, revert.
- Max length: 50 characters (enforce with `maxLength` attribute on input).
- Auto-select all text when the input appears (use `useEffect` + `inputRef.current.select()`).

**Expected output:** Double-clicking a tab label shows an inline input. Typing and pressing Enter updates the label displayed on the tab. The rename propagates to the parent via `onRenameTab`.

---

- [x] **ST-03.2.1** Add `editingTabId` state and `editingValue` state to the tab bar component (or a local sub-component). Render an `<input>` when editing, `<span>` otherwise. Wire `onDoubleClick` on the label span.
  - **Expected output:** Double-clicking a tab label shows a text input in its place.

- [x] **ST-03.2.2** Handle Enter key (confirm), Escape key (cancel), and blur (confirm if changed). Validate: if input is empty string, revert to original label instead of saving empty string.
  - **Expected output:** Enter saves. Escape reverts. Clicking outside the input (blur) saves.

- [x] **ST-03.2.3** Auto-select all text when the input renders. Use `useEffect` with `inputRef.current.select()`.
  - **Expected output:** When double-clicking a tab, all existing text in the input is selected immediately.

---

### T-03.3 — `[FE]` Implement tab close confirmation dialog

**What:** Clicking × on a tab with items in its cart shows a confirmation dialog before closing. Closing a tab with an empty cart closes immediately without dialog.

**How:**

- On × click: check if the tab's `items.length > 0`.
- If 0 items: immediately call `onCloseTab(clientDraftId)`.
- If > 0 items: show a dialog/modal with:
  - Title: "Close this bill?"
  - Body: "This bill has items. It will be saved to your Drafts and can be reopened any time."
  - Button: "Close Bill" (primary/destructive)
  - Button: "Keep Open" (secondary)
- "Close Bill" calls `onCloseTab(clientDraftId)`.
- "Keep Open" dismisses the dialog.

**Expected output:** Closing an empty tab works instantly. Closing a tab with items shows the confirmation dialog. The draft is not deleted — it moves to Saved Drafts.

---

- [x] **ST-03.3.1** Add local state for `closingTabId: string | null` to track which tab triggered the confirmation. When × is clicked on a tab with items, set `closingTabId` and show the dialog. When × is clicked on an empty tab, call `onCloseTab` directly.
  - **Expected output:** Dialog appears for tabs with items. No dialog for empty tabs.

- [x] **ST-03.3.2** Implement the confirmation dialog using the existing `ConfirmationDialog` component (from MVP 1) or the project's dialog primitive. Wire "Close Bill" to call `onCloseTab(closingTabId)` and reset `closingTabId`. Wire "Keep Open" to reset `closingTabId`.
  - **Expected output:** "Close Bill" removes the tab from the bar. "Keep Open" dismisses dialog and tab stays open.

---

### T-03.4 — `[FE]` Build the `useBillingTabs` hook — central tab state manager

**What:** A custom hook that owns all tab state. All tab operations (create, switch, close, rename, update cart) go through this hook. The billing page and components use this hook and never manage tab state directly.

**State this hook manages:**

```typescript
interface UseBillingTabsReturn {
  tabs: TabState[];
  activeTabId: string;
  activeDraft: LocalDraft;
  createTab: () => void;
  switchTab: (clientDraftId: string) => void;
  closeTab: (clientDraftId: string) => void;
  renameTab: (clientDraftId: string, newLabel: string) => void;
  updateActiveCart: (items: DraftItem[]) => void;
  updateActiveCustomer: (name: string, phone: string) => void;
  updateActivePayment: (method: PaymentMethod) => void;
  clearActiveTab: () => void; // Called after successful finalization
}
```

**Internal logic:**

- `tabs` is an array of `TabState` objects held in React state.
- On mount: load drafts from IndexedDB (`loadAllDrafts()`) and set tabs. If none, create one empty tab.
- `createTab()`: generates a new `clientDraftId` (UUID v4), creates a `LocalDraft` with empty items, `tabLabel` = "Bill {N}" where N is the global tab creation counter (stored in `useRef` and incremented — does NOT reset when tabs are closed), `syncStatus = PENDING_SYNC`. Saves to IndexedDB. Adds to `tabs` state. Sets it as `activeTabId`.
- `switchTab(id)`: sets `activeTabId` to the given id. No async work.
- `closeTab(id)`: removes the tab from `tabs` state. Does NOT delete the draft from IndexedDB (it's preserved in Saved Drafts). If closing the last tab, immediately creates a new empty tab.
- `renameTab(id, label)`: updates the tab label in state and in IndexedDB. Marks `syncStatus = PENDING_SYNC` to trigger server sync.
- `updateActiveCart(items)`: updates the active draft's items in state and IndexedDB. Marks `PENDING_SYNC`.
- `clearActiveTab()`: clears items, customer, payment from the active tab's draft. Resets label to a new default. Marks `PENDING_SYNC`.

**Tab counter rule:** The counter for "Bill 1", "Bill 2" etc. is a session counter — stored in a `useRef`. It increments whenever a new tab is created (via `createTab()`). It does NOT decrement when tabs are closed. So if you create 3 tabs and close the middle one, the next tab created is "Bill 4", not "Bill 3".

**Expected output:** `hooks/use-billing-tabs.ts` exists and exports `useBillingTabs`. The billing page uses this hook as the single source of tab truth.

---

- [x] **ST-03.4.1** Create `hooks/use-billing-tabs.ts`. Define the hook signature and all state fields. On mount, call `loadAllDrafts()` from IndexedDB and populate `tabs`. Handle the empty-state case (create one default tab). Mark the first tab (or the most recently updated one) as active.
  - **Expected output:** On billing page load, if IndexedDB has 2 saved drafts, 2 tabs appear. If empty, 1 empty tab appears.

- [x] **ST-03.4.2** Implement `createTab()`. Generate UUID for `clientDraftId`. Increment tab counter. Build the `LocalDraft` object with defaults. Call `saveDraft()` to IndexedDB. Add to state. Set as active.
  - **Expected output:** Clicking + creates a new empty tab that becomes active. Each new tab has a unique label ("Bill 2", "Bill 3", etc.).

- [x] **ST-03.4.3** Implement `switchTab(id)`. Update `activeTabId` in state. No async operations.
  - **Expected output:** Clicking an inactive tab makes it active. The cart area updates to show that tab's items.

- [x] **ST-03.4.4** Implement `closeTab(id)`. Remove the tab from the `tabs` array. If the closed tab was active, activate the next tab in the array (or the previous, if it was the last). If no tabs remain after closing, call `createTab()` immediately.
  - **Expected output:** Closing a tab removes it from the bar. Active tab shifts correctly. Closing the last tab creates a new empty one.

- [x] **ST-03.4.5** Implement `renameTab(id, label)`. Update `tabLabel` in the matching tab in state. Update in IndexedDB. Mark `syncStatus = PENDING_SYNC`.
  - **Expected output:** After renaming, the tab bar shows the new label. IndexedDB record shows new label. `syncStatus` is `PENDING_SYNC`.

- [x] **ST-03.4.6** Implement `updateActiveCart(items)`, `updateActiveCustomer(name, phone)`, `updateActivePayment(method)`. Each updates the corresponding field on the active draft in state and IndexedDB. Each marks `syncStatus = PENDING_SYNC` and updates `localUpdatedAt`.
  - **Expected output:** Adding a product to the cart calls `updateActiveCart` → updates state → marks PENDING_SYNC → IndexedDB updated.

- [x] **ST-03.4.7** Implement `clearActiveTab()`. Resets the active draft to: empty items array, empty customer fields, empty payment method, new default tab label, `localUpdatedAt = now`, `syncStatus = PENDING_SYNC`.
  - **Expected output:** Calling this (after finalization) results in an empty, ready-to-use tab.

---

### T-03.5 — `[FE]` Wire the tab system into the billing page

**What:** Connect `useBillingTabs` to the existing billing page and existing cart components.

**How:**  
The billing page currently renders a single bill. It needs to become a container that renders:

1. `<BillingTabBar />` at the top — connected to `useBillingTabs`.
2. The billing workspace (cart, search, summary) — connected to `activeDraft` from the hook.

The cart, product search, customer info, payment method, and finalize button all already exist from MVP 1. They just need to be connected to the active tab's draft instead of the single-draft state they used before.

**Key wiring points:**

- `BillingCart` receives `activeDraft.items` as its items. All cart mutations call `updateActiveCart`.
- Customer info fields read from `activeDraft.customerName` and `activeDraft.customerPhone`. On change, call `updateActiveCustomer`.
- Payment method reads from `activeDraft.paymentMethod`. On change, call `updateActivePayment`.
- "Clear Bill" calls `useBillingTabs.updateActiveCart([])` and resets customer/payment.
- "Finalize Invoice" reads from `activeDraft` for all its data. On success, calls `clearActiveTab()`.

**Expected output:** The billing screen behaves identically to MVP 1 for a single tab. Switching tabs instantly shows a different cart. Changes to one tab do not affect another.

---

- [x] **ST-03.5.1** Refactor `app/(dashboard)/page.tsx` (or the billing page file). Call `useBillingTabs()` at the top. Render `<BillingTabBar>` with the hook's tab state and handlers. Pass `activeDraft` down to the billing workspace.
  - **Expected output:** Tab bar appears on the billing screen. Single tab works identically to MVP 1.

- [x] **ST-03.5.2** Connect cart item mutations to `updateActiveCart`. Every `addItem`, `removeItem`, `updateQuantity` call on the cart must call `updateActiveCart(newItems)` instead of the old MVP 1 draft mutation.
  - **Expected output:** Adding a product updates the active tab's cart. The tab's item count badge updates.

- [x] **ST-03.5.3** Connect customer info and payment method inputs to `updateActiveCustomer` and `updateActivePayment`.
  - **Expected output:** Typing a customer name in Tab 1, switching to Tab 2, then switching back to Tab 1 shows the customer name intact.

- [x] **ST-03.5.4** Connect "Clear Bill" to reset only the active tab.
  - **Expected output:** Clearing Bill in Tab 1 does not affect Tab 2.

- [x] **ST-03.5.5** Connect invoice finalization success to `clearActiveTab()`. After the invoice is confirmed by the server, call `clearActiveTab()` on the hook. Also pass `clientDraftId` of the active tab in the invoice creation request body (needed for US-01.5 — server-side draft deletion).
  - **Expected output:** After invoice created successfully, the active tab clears to a fresh empty bill. The other tabs are unchanged.

---

---

## US-04 — Draft Sync Engine: Debounced Save to Server

**As a shopkeeper, I want my draft bills to automatically sync to the server so they are accessible from any device and are never lost even if I close the browser.**

**Scope:** Frontend only. Backend from US-01 must be complete.  
**Dependency:** US-01 complete, US-02 complete, US-03 complete.

---

### T-04.1 — `[FE]` Build the `useDraftSync` hook

**What:** A hook that watches for drafts with `PENDING_SYNC` status and syncs them to the server. Implements debouncing and retry with exponential backoff.

**How:**

**Debounce rule:** After any change to a draft that sets its `syncStatus = PENDING_SYNC`, the sync does NOT happen immediately. The hook waits for 1 second of inactivity (no further changes to that draft) before sending the sync request. This prevents a network call on every character typed.

**Implementation approach:**

```typescript
// Pseudo-logic of the sync hook
const pendingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

function scheduleSync(clientDraftId: string) {
  // Cancel any existing timer for this draft
  clearTimeout(pendingTimers.current.get(clientDraftId));

  // Schedule a new sync after 1 second
  const timer = setTimeout(async () => {
    await syncDraft(clientDraftId);
    pendingTimers.current.delete(clientDraftId);
  }, 1000);

  pendingTimers.current.set(clientDraftId, timer);
}
```

**Sync request:** `POST /drafts/sync` with the full draft payload. The `clientAxios` instance (reads from localStorage token) must be used since this runs in a client component context.

**On success:**

- Call `updateSyncStatus(clientDraftId, 'SYNCED', response.syncedAt)` in IndexedDB.
- Update the in-memory `tabs` state so the sync dot turns green.

**On failure (network error):**

- Call `updateSyncStatus(clientDraftId, 'SYNC_FAILED')` in IndexedDB.
- Start the retry timer: first retry after 5s, second after 10s, third after 30s, then every 60s.
- Show the persistent "Draft not saved — reconnecting…" status indicator in the UI (see T-04.2).

**On failure (server validation error — 4xx response):**

- Call `updateSyncStatus(clientDraftId, 'SYNC_FAILED')`.
- Do NOT retry automatically.
- Show "Draft could not be saved. Please refresh." UI message.

**Expected output:** `hooks/use-draft-sync.ts` exists. Exported function `useDraftSync(tabs, updateSyncStatusInTabs)`. After making a change, the sync request fires approximately 1 second later. Failed syncs are retried with exponential backoff.

---

- [x] **ST-04.1.1** Create `hooks/use-draft-sync.ts`. Set up the timer map in a `useRef`. Export a `scheduleSync(clientDraftId: string)` function from the hook. Wire this so that every call to `updateActiveCart`, `renameTab`, `updateActiveCustomer`, `updateActivePayment` in `useBillingTabs` calls `scheduleSync` with the modified draft's `clientDraftId`.
  - **Expected output:** After adding a product to the cart, exactly one network request to `POST /drafts/sync` is made approximately 1 second later. Multiple rapid changes (e.g. incrementing quantity several times) result in only one network call.

- [x] **ST-04.1.2** Implement the actual sync call: `POST /drafts/sync` using `clientAxios`. Build the payload from the `LocalDraft` object in IndexedDB (read the latest version from IndexedDB before sending, not from component state, to avoid stale closure issues).
  - **Expected output:** The sync request body matches the expected format from US-01 T-01.2. The `tabLabel`, `items`, `customerName`, `customerPhone`, `paymentMethod` are all correctly included.

- [x] **ST-04.1.3** On success: call `updateSyncStatus(clientDraftId, 'SYNCED', res.syncedAt)` in IndexedDB. Update the corresponding tab in the `useBillingTabs` state so the sync status dot updates.
- **Expected output:** After a successful sync, the tab's sync dot turns green. IndexedDB record shows `syncStatus = 'SYNCED'` and `syncedAt` timestamp.

- [x] **ST-04.1.4** On network failure: call `updateSyncStatus(clientDraftId, 'SYNC_FAILED')`. Start exponential retry: 5s → 10s → 30s → 60s → 60s... Retry continues indefinitely while the component is mounted. Each retry calls the sync function again (which reads fresh data from IndexedDB).
- **Expected output:** Disconnecting the network causes the sync dot to turn red. Reconnecting the network and waiting eventually causes a successful retry and the dot turns green.

- [x] **ST-04.1.5** On 4xx server error: call `updateSyncStatus(clientDraftId, 'SYNC_FAILED')`. Do NOT start retry. Set a flag that triggers the "Draft could not be saved. Please refresh." message instead of the reconnecting message.
- **Expected output:** 400 response from server shows the "please refresh" message, not the "reconnecting" message.

- [x] **ST-04.1.6** Cleanup: in the hook's cleanup function (`useEffect` return), cancel all pending timers and retry timers to prevent memory leaks when the billing page unmounts.
- **Expected output:** No "Can't perform a React state update on an unmounted component" warnings when navigating away from the billing page.

---

### T-04.2 — `[FE]` Build the sync status indicator UI

**What:** A small persistent status bar (or indicator in the billing screen header area) that shows the overall sync state across all open tabs.

**Display rules:**

- **All SYNCED:** No indicator shown (normal/default state is online and saved — no message needed).
- **Any PENDING_SYNC:** Show a subtle "Saving…" indicator with a loading spinner. This should not be alarming.
- **Any SYNC_FAILED (network):** Show a persistent amber/yellow bar: "Draft not saved — reconnecting…" with a small reconnecting animation.
- **Any SYNC_FAILED (server):** Show a persistent red bar: "Draft could not be saved. Please refresh the page."

**Placement:** Below the tab bar, above the billing workspace. Or alternatively, a subtle indicator in the billing page header near the "Refresh stock" button.

**Expected output:** `components/billing/sync-status-bar.tsx` component. Takes `tabs: TabState[]` as prop and derives the overall status from the worst state across all tabs.

---

- [x] **ST-04.2.1** Create `components/billing/sync-status-bar.tsx`. Accept `tabs: TabState[]`. Compute `overallStatus`: if any tab is `SYNC_FAILED`, status is FAILED. If any tab is `PENDING_SYNC` (and none are FAILED), status is PENDING. Otherwise, SYNCED.
- **Expected output:** Component renders correctly with different status values.

- [x] **ST-04.2.2** Render the correct message for each status. SYNCED: render nothing. PENDING_SYNC: render a small "Saving…" text with spinner. SYNC_FAILED (network): render amber bar with "Draft not saved — reconnecting…". SYNC_FAILED (server): render red bar with "Draft could not be saved. Please refresh."
- **Expected output:** Visual states match the spec.

- [x] **ST-04.2.3** Wire `<SyncStatusBar>` into the billing page, positioned below the tab bar.
- **Expected output:** Sync status bar is visible on the billing page. Simulating a network failure (e.g. browser DevTools → offline) causes the amber reconnecting message to appear after 1 second.

---

---

## US-05 — Load Drafts on Login: Restore Tabs from Server

**As a shopkeeper who logs in on a different device, I want to see all my previously open bills already waiting for me in tabs so I can continue where I left off.**

**Scope:** Frontend only. Backend from US-01 must be complete.  
**Dependency:** US-01, US-02, US-03 must be complete.

---

### T-05.1 — `[FE]` Fetch and restore server drafts on app load

**What:** When the billing page loads (or when a valid session is restored), fetch all non-deleted drafts from `GET /drafts` and populate the tab bar with them.

**How:**  
This happens inside `useBillingTabs` on mount (inside a `useEffect` that runs once).

**Full load procedure (step by step):**

1. Call `GET /drafts` using `clientAxios` (or create a fetch from a server component and pass as prop — see note below).
2. For each draft returned by the server:
   a. Save it to IndexedDB with `saveDraft({ ...serverDraft, syncStatus: 'SYNCED', isOfflineCreated: false, localUpdatedAt: serverDraft.updatedAt })`.
3. Load all non-deleted drafts from IndexedDB using `loadAllDrafts()`.
4. Convert each `LocalDraft` to a `TabState` and set as `tabs`.
5. Set `activeTabId` to the `clientDraftId` of the most recently updated draft.
6. If `tabs` is still empty after all this (no server drafts, no local drafts): create one empty tab.

**Ordering:** Tabs are ordered by `updatedAt` ascending (oldest first). This gives consistent ordering across devices.

**Note on fetch approach:** Fetching drafts in `useBillingTabs` using `clientAxios` on mount is the correct approach because:

- The billing page is a client component (it has interactive state).
- `useBillingTabs` already runs in the client.
- This avoids the complexity of passing server-fetched drafts as props through multiple layers.

**On load error:** If `GET /drafts` fails (network error on mount), fall back to loading from IndexedDB only. Show a subtle warning: "Could not sync latest drafts. Showing locally cached bills." This handles the case where a user opens the app with a poor connection.

**Expected output:** On the billing page, after a fresh login, all previously saved server drafts appear as tabs. A user who had "Bill 1" and "Bill 3" open yesterday sees those two tabs when they return.

---

- [x] **ST-05.1.1** Inside `useBillingTabs`, add a `useEffect` that runs once on mount. Call `GET /drafts` using `clientAxios`. On success: save all server drafts to IndexedDB, then load from IndexedDB, then set `tabs` state.
- **Expected output:** On billing page mount, tabs are populated from the server. Network request to `GET /drafts` is visible in browser DevTools.

- [x] **ST-05.1.2** Handle the fallback case: if `GET /drafts` throws, load from IndexedDB only. Show a warning banner in the sync status area: "Could not load latest drafts. Showing cached data."
- **Expected output:** With DevTools → offline, billing page still loads with whatever is in IndexedDB.

- [x] **ST-05.1.3** Handle the empty-state case: if after loading from both server and IndexedDB there are zero non-deleted drafts, call `createTab()` to ensure at least one tab is always visible.
- **Expected output:** A brand new user (no drafts) sees exactly one empty tab on the billing page.

- [x] **ST-05.1.4** Ensure the initial load does NOT create duplicate tabs. If a draft with a given `clientDraftId` is already in IndexedDB from a previous session, the server draft update overwrites it (upsert in IndexedDB). The tab appears only once.
- **Expected output:** Refreshing the billing page does not double the number of tabs.

---

---

## US-06 — Cross-Tab Stock Awareness: Aggregate Warnings

**As a shopkeeper with multiple bills open, I want to see a warning when the combined quantity of a product across all my open bills exceeds the available stock, so I know there might be a stock conflict when I finalize.**

**Scope:** Frontend only. No backend changes.  
**Dependency:** US-03 must be complete. Stock data from US-03.5 (refresh stock hook from MVP 1).

---

### T-06.1 — `[FE]` Implement cross-tab stock aggregation

**What:** A utility function that, given all open tabs and the last-known stock map, computes for each product in any tab whether the combined quantity across all tabs exceeds available stock.

**Where:** `lib/utils/cross-tab-stock.ts`

**Function signature:**

```typescript
interface StockWarning {
  productId: string;
  totalRequested: number;
  availableStock: number;
  tabCount: number; // number of tabs that have this product
}

function computeStockWarnings(
  tabs: TabState[],
  stockMap: Record<string, number>, // productId → available quantity
): Map<string, StockWarning>;
```

**Algorithm:**

1. For each tab, for each item in the tab's cart:
   - Accumulate `totalRequested` per `productId` across all tabs.
   - Count how many tabs contain each productId.
2. For each product that appears in at least one tab:
   - Look up `availableStock` from `stockMap[productId]`. If not in stockMap, treat as 0.
   - If `totalRequested > availableStock`, add to the warnings map.
3. Return the map. Keys are `productId`. Values are `StockWarning` objects.

**Example:**

- Tab 1: Rice × 6. Tab 2: Rice × 5. Stock = 10.
- `totalRequested` for Rice = 11. `availableStock` = 10. 11 > 10 → warning for Rice.
- Warning: `{ productId: "rice-id", totalRequested: 11, availableStock: 10, tabCount: 2 }`

**Expected output:** `lib/utils/cross-tab-stock.ts` exports `computeStockWarnings`. Unit-testable pure function.

---

- [x] **ST-06.1.1** Create `lib/utils/cross-tab-stock.ts`. Implement `computeStockWarnings` exactly as specified. Export the function and the `StockWarning` interface.
  - **Expected output:** Function returns an empty Map when no quantities exceed stock. Returns correct warnings when totals exceed stock.

- [x] **ST-06.1.2** Write unit tests for `computeStockWarnings`:
  - Test 1: No overlap — no warnings returned.
  - Test 2: Single tab exceeds stock — warning returned.
  - Test 3: Two tabs combined exceed stock — warning returned.
  - Test 4: Product not in stockMap — treated as 0 available stock.
  - **Expected output:** All 4 tests pass.

---

### T-06.2 — `[FE]` Wire stock warnings into the billing UI

**What:** Compute stock warnings in real-time and display them in two places: (1) inline on the item row in the active tab's cart, (2) a warning icon on any tab in the tab bar that contains a product with a warning.

**How:**  
In `useBillingTabs` (or a sibling hook called in the billing page):

- Call `computeStockWarnings(tabs, stockMap)` every time `tabs` changes or `stockMap` changes.
- Store the result as `stockWarnings: Map<string, StockWarning>` in state.
- Pass `stockWarnings` down to:
  - The cart item renderer: to show the inline warning per item.
  - `BillingTabBar`: to show the warning icon per tab (a tab has a warning if any of its items appears in `stockWarnings`).

**Inline cart item warning format:**
"⚠ Total across all bills: {M} requested, {N} available across {K} bills"

This warning appears below the item row in the active tab's cart. It is amber/warning color. It does not disable the item or block finalization.

**Tab bar warning icon:**
A small amber ⚠ icon on the tab label. Tooltip: "This bill has items that may conflict with other open bills."

**Expected output:** When Tab 1 has Rice × 6 and Tab 2 has Rice × 5 and stock = 10, the active tab shows a warning on the Rice row. Both tabs show a ⚠ icon in the tab bar.

---

- [x] **ST-06.2.1** Call `computeStockWarnings(tabs, stockMap)` inside `useBillingTabs` (or billing page) using `useMemo` to avoid recomputation on every render. Update whenever `tabs` or `stockMap` changes.
  - **Expected output:** `stockWarnings` is computed without performance issues. Changing a quantity in any tab recalculates warnings immediately.

- [x] **ST-06.2.2** Pass the warning for each item in the active tab to the cart item component. Modify `BillingCartItem` to accept an optional `stockWarning: StockWarning | undefined` prop. If present, show the warning message below the item row.
  - **Expected output:** Warning message appears on the Rice item row in the active tab when aggregate stock is exceeded.

- [x] **ST-06.2.3** Compute `hasStockWarning: boolean` per tab (true if any item in that tab appears in `stockWarnings`). Pass to `BillingTabBar`. The tab bar shows the ⚠ icon on any tab where `hasStockWarning = true`.
  - **Expected output:** Both Tab 1 and Tab 2 show a ⚠ icon in the tab bar when they share an over-limit product.

- [x] **ST-06.2.4** Verify the warning updates in real time. Reducing the quantity in Tab 1 to 3 (so Tab 1: 3 + Tab 2: 5 = 8 ≤ 10) should immediately remove the warning from both tabs without needing a page reload.
  - **Expected output:** Warning disappears as soon as quantities drop below the stock threshold.

---

---

## US-07 — Saved Drafts Panel: Reopen and Discard Closed Drafts

**As a shopkeeper who closed a bill by accident or intentionally saved it for later, I want to reopen it from a Saved Drafts panel so I never lose work.**

**Scope:** Frontend only. Backend from US-01 (delete endpoint) must be complete.  
**Dependency:** US-01, US-02, US-03 must be complete.

---

### T-07.1 — `[FE]` Build the `SavedDraftsPanel` component

**What:** A slide-in side panel (drawer) that lists all drafts that have been closed (removed from the tab bar) but not yet permanently discarded. Opened via the "Drafts" button in the tab bar.

**What it shows:**  
A "saved draft" in this panel is any `LocalDraft` in IndexedDB where:

- `isDeleted = false`
- `clientDraftId` is NOT in the current `tabs` list (i.e., it is not currently an open tab)

**Layout:**

- Panel slides in from the right (or bottom on mobile).
- Header: "Saved Bills" with an × to close the panel.
- If no saved drafts: empty state — "No saved bills. Bills you close will appear here."
- For each saved draft, show a card with:
  - Tab label (e.g. "Bill 3")
  - Item count (e.g. "4 items")
  - Estimated total (sum of `unitPrice × quantity` for all items in the draft — use current live price from IndexedDB/stockMap if available, or stored `unitPrice` from draft items)
  - Last updated time (e.g. "Last updated 10 minutes ago" — formatted from `localUpdatedAt`)
  - "Open" button (primary)
  - "Discard" button (secondary / destructive)

**Expected output:** `components/billing/saved-drafts-panel.tsx` component. Renders correct list of closed drafts. Clicking Open adds the draft as a new active tab. Clicking Discard shows a confirmation and then permanently removes it.

---

- [x] **ST-07.1.1** Create `components/billing/saved-drafts-panel.tsx` as a `'use client'` component. Implement the drawer/slide-in using the project's existing `Drawer` or `Sheet` component (from shadcn/ui). Add an open/close state controlled by the parent.
  - **Expected output:** Clicking "Drafts" button in the tab bar opens the panel. Clicking × or clicking outside closes it.

- [x] **ST-07.1.2** Derive the list of saved drafts: filter all drafts from `useBillingTabs`'s awareness (need to read ALL non-deleted IndexedDB drafts, not just the currently open ones). Pass the open `tabs` list and all IndexedDB drafts to the panel; the panel filters out the ones already in tabs.
  - **Implementation detail:** In `useBillingTabs`, maintain a separate `allDrafts: LocalDraft[]` state that contains ALL non-deleted drafts (open + closed). `tabs` is the subset that is currently visible in the tab bar. The panel uses `allDrafts.filter(d => !tabs.find(t => t.draft.clientDraftId === d.clientDraftId))`.
  - **Expected output:** A draft that was closed (removed from tab bar) appears in the panel. A draft that is still open does not appear.

- [x] **ST-07.1.3** Render each saved draft card with label, item count, estimated total, last updated time. Use `formatDistanceToNow` from `date-fns` (or equivalent) for the "X minutes ago" time display.
  - **Expected output:** Each card shows correct information. "Last updated 3 minutes ago" format is readable and accurate.

- [x] **ST-07.1.4** Implement the "Open" button. Clicking it calls a `onOpenDraft(clientDraftId)` callback (provided by `useBillingTabs`). `onOpenDraft` adds the draft back to the `tabs` array, makes it active, and closes the Saved Drafts Panel.
  - **Expected output:** Clicking "Open" on a saved draft adds it as a new active tab in the tab bar. The draft's cart items and customer info are intact.

- [x] **ST-07.1.5** Implement the "Discard" button. Show a confirmation dialog: "Permanently discard this bill? This cannot be undone." On confirm: call `DELETE /drafts/:clientDraftId` via `clientAxios`, then call `deleteDraftLocally(clientDraftId)` in IndexedDB, then remove from `allDrafts` state. On cancel: dismiss dialog.
  - **Expected output:** Discarded draft disappears from the panel and from IndexedDB. The server soft-delete is called. The draft cannot be reopened after discarding.

---

---

## US-08 — Offline Behavior: Read-Only Mode for Synced Drafts

**As a shopkeeper whose internet goes down, I want to still see my open bills without accidentally making changes that can't be saved, so I don't end up with a billing screen that behaves unexpectedly.**

**Scope:** Frontend only. No backend changes.  
**Dependency:** US-04 (sync engine uses connectivity state), US-03 (tab system).

---

### T-08.1 — `[FE]` Implement connectivity detection

**What:** A hook that tracks whether the app is online or offline and exposes the current connectivity state to components that need it.

**How:**  
Use the browser's `navigator.onLine` property combined with the `online`/`offline` events on `window`.

```typescript
// hooks/use-online-status.ts
"use client";
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return isOnline;
}
```

**Expected output:** `hooks/use-online-status.ts` exists. Returns `true` when online, `false` when offline.

---

- [x] **ST-08.1.1** Create `hooks/use-online-status.ts` with the implementation above. Export `useOnlineStatus`.
  - **Expected output:** Hook returns correct value. Toggling "Offline" in browser DevTools changes the value.

---

### T-08.2 — `[FE]` Show offline banner and disable sync

**What:** When offline, show a persistent status bar at the top of the billing screen: "You're offline — new drafts are local only. Changes will sync when you reconnect." Stop attempting to sync drafts while offline (avoid filling up the retry queue needlessly).

**How:**

- Call `useOnlineStatus()` in the billing page.
- Pass `isOnline` to `useDraftSync`. When `isOnline = false`, pause all sync timers (cancel pending debounce timers and pause the retry loop).
- When `isOnline` transitions from `false` to `true`, immediately try to sync all `PENDING_SYNC` drafts without waiting for the debounce.
- Show `<OfflineBanner>` component when `isOnline = false`.

**Expected output:** Going offline shows the banner. Sync stops. Coming back online hides the banner and immediately triggers sync.

---

- [x] **ST-08.2.1** Create `components/billing/offline-banner.tsx`. A simple full-width amber banner with the offline message. Only renders when `isOnline = false`.
  - **Expected output:** Banner appears when DevTools → Offline. Disappears when DevTools → Online.

- [x] **ST-08.2.2** Modify `useDraftSync`: accept `isOnline: boolean` parameter. When `isOnline = false`, skip scheduling new sync timers (still mark drafts as PENDING_SYNC in IndexedDB, just don't attempt the network call). Cancel all in-flight retry timers while offline.
  - **Expected output:** No network requests to `/drafts/sync` are made while offline. Draft changes are still saved to IndexedDB with `syncStatus = PENDING_SYNC`.

- [x] **ST-08.2.3** Modify `useDraftSync`: when `isOnline` transitions to `true` (use `useEffect` with `isOnline` as dependency), immediately call `scheduleSync` for all drafts currently in `PENDING_SYNC` or `SYNC_FAILED` state (without the 1-second debounce — call them with 0ms delay).
  - **Expected output:** After coming back online, all pending drafts sync immediately.

---

### T-08.3 — `[FE]` Make synced draft tabs read-only while offline

**What:** Tabs that were previously synced (have a server record — `id` is not undefined) must show as read-only when the device is offline. The user can view but not edit them.

**How:**

- In `useBillingTabs`, expose `isOnline` from `useOnlineStatus`.
- Add a computed property to each tab: `isReadOnly = !isOnline && draft.syncStatus !== 'PENDING_SYNC' && !draft.isOfflineCreated`.
  - A tab is read-only if: offline AND was previously synced (has server ID) AND was not created offline.
  - A tab that was created while offline (`isOfflineCreated = true`) remains editable offline.
- Pass `isReadOnly` down to the billing workspace.
- When `isReadOnly = true`:
  - Disable the product search input (with tooltip: "Editing paused while offline").
  - Disable all quantity +/− buttons and direct quantity inputs.
  - Disable customer name and phone inputs.
  - Disable payment method selector.
  - Disable "Finalize Invoice" button.
  - Disable "Clear Bill" button.
  - Show a subtle banner within the billing workspace: "This bill is view-only while offline."

**Expected output:** Going offline makes existing synced tabs uneditable. A tab created while offline remains fully editable. Coming back online restores full editing.

---

- [x] **ST-08.3.1** Compute `isReadOnly` per tab in `useBillingTabs` or billing page. Pass to the billing workspace.
  - **Expected output:** `isReadOnly` is `true` for synced tabs when offline. `false` for offline-created tabs and when online.

- [x] **ST-08.3.2** Apply `disabled` prop to all interactive billing inputs (search, quantity controls, customer fields, payment method, finalize button, clear bill button) when `isReadOnly = true`.
  - **Expected output:** All interactive elements are disabled. User cannot make any changes.

- [x] **ST-08.3.3** Show the "This bill is view-only while offline" banner within the billing workspace when `isReadOnly = true`. Use the warning/info color (amber). This is a different banner from the global offline banner in T-08.2 — it is inside the billing workspace and specific to the current tab.
  - **Expected output:** Banner appears in the billing workspace area below the tab bar when the active tab is read-only.

---

---

## US-09 — Post-Finalization Tab Behavior

**As a shopkeeper who just finalized an invoice, I want the tab to clear automatically and stay open so I can immediately start billing the next customer without any extra steps.**

**Scope:** Frontend only.  
**Dependency:** US-03 (clearActiveTab), US-01 T-01.5 (server-side draft deletion on finalization).

---

### T-09.1 — `[FE]` Handle post-finalization state correctly

**What:** After an invoice is successfully created, the active tab must: clear its cart, reset customer info, reset payment method, reset its label to a new default, and remain open. The server-side draft must be deleted (handled by passing `clientDraftId` in the invoice request from ST-03.5.5).

**How:**  
This mostly flows from `clearActiveTab()` in `useBillingTabs` (ST-03.4.7) being called after finalization. But the behavior needs to be verified end-to-end.

**Full post-finalization sequence:**

1. Invoice creation request includes `clientDraftId` (from the active draft).
2. Server creates invoice AND soft-deletes the draft (US-01 T-01.5).
3. Client receives success response.
4. Client calls `clearActiveTab()`:
   - Clears items, customer name, phone, payment method.
   - Sets new label (e.g. "New Bill" or next counter value).
   - Updates IndexedDB with cleared state and `PENDING_SYNC`.
5. Client calls `scheduleSync()` for the cleared tab (the cleared draft must sync to server so the server's cleared state matches — though the server already deleted it, this will create a new empty draft on the server).

Wait — actually, the correct behavior is:

- The old draft is deleted server-side after finalization.
- The cleared tab should be treated as a NEW draft — it gets a NEW `clientDraftId`.
- `clearActiveTab()` should generate a new `clientDraftId` for the tab, not reuse the old one.
- This way, the finalized tab starts fresh as a brand new draft.

**Update to `clearActiveTab()` in ST-03.4.7:**

- Generate a new `clientDraftId`.
- Delete the old draft record from IndexedDB.
- Create a new IndexedDB record with the new `clientDraftId` and empty state.
- Update the tab's `clientDraftId` in state.

**Expected output:** After finalization, the tab shows an empty cart with a new label (e.g. "Bill 5"). The old draft is gone. The other tabs are completely unaffected. The next time the user adds a product, it syncs as a new draft with the new `clientDraftId`.

---

- [x] **ST-09.1.1** Update `clearActiveTab()` in `useBillingTabs` to: generate a new `clientDraftId`, delete the old IndexedDB record, create a new IndexedDB record with the new ID and empty state, update the tab's `clientDraftId` in `tabs` state.
  - **Expected output:** After finalization, the active tab's `clientDraftId` is different from what it was before. The old draft record is gone from IndexedDB.

- [x] **ST-09.1.2** Verify the success navigation: currently MVP 1 navigates to the invoice detail page after finalization. In MVP 2, this navigation should NOT happen — the user stays on the billing screen in the now-cleared tab. Instead, show a success toast: "Invoice {invoiceNumber} created successfully. View invoice →" with a link to the invoice detail page.
  - **Expected output:** After finalization, user stays on billing screen. A toast appears with the invoice number. Other tabs are unaffected.

- [x] **ST-09.1.3** Verify that other open tabs are completely unaffected by finalization of the active tab. Tab 2's cart, customer info, and payment method must be identical before and after Tab 1 finalizes.
  - **Expected output:** Manual test: open Tab 1 and Tab 2. Add different products to each. Finalize Tab 1. Tab 2's content is unchanged.

---

---

## US-10 — Settings Screen: Saved Drafts Count

**As a shopkeeper, I want to see how many bills I've saved (closed but not discarded) in my Settings so I know if I have pending bills to review.**

**Scope:** Frontend + Backend minimal change.  
**Dependency:** US-01, US-07 must be complete.

---

### T-10.1 — `[BE]` Add draft count to the settings or a dedicated endpoint

**What:** Expose a count of non-deleted, non-open drafts for the tenant. The simplest approach is to add a `savedDraftCount` field to the existing `GET /settings` response.

**How:**  
Modify `GET /settings` to include:

```json
{
  "...existingFields": "...",
  "savedDraftCount": 3
}
```

Where `savedDraftCount = COUNT(drafts WHERE tenantId = X AND isDeleted = false)`.

Note: In MVP 2, "saved" drafts and "open" drafts are both `isDeleted = false` on the server. The server doesn't distinguish between "open in a tab" and "closed to Saved Drafts" — that distinction is client-side only. So `savedDraftCount` is simply the count of all non-deleted drafts. The frontend can use this as an indicator that the user has pending draft work.

**Expected output:** `GET /settings` returns `savedDraftCount`. Value is 0 for new users. Increases as drafts are created.

---

- [x] **ST-10.1.1** Modify the `GET /settings` handler to include a count query: `COUNT(Draft) WHERE tenantId = X AND isDeleted = false`. Add the result as `savedDraftCount` in the response.
  - **Expected output:** `GET /settings` response includes `savedDraftCount: number`. Value is correct.

---

### T-10.2 — `[FE]` Show saved drafts section in Settings

**What:** Add a "Saved Bills" section to the Settings page that shows the count of saved drafts and a link to the billing screen to view them.

**How:**  
In the Settings page (server component), the `getSettings()` API call already fetches data. The response now includes `savedDraftCount`. Add a new section to the settings layout.

**Section layout:**

- Section title: "Saved Bills"
- Content: "You have {N} saved bill(s) waiting." Or if 0: "No saved bills."
- If N > 0: a "View saved bills" link → navigates to `/` (billing page). The user can open the Saved Drafts Panel from there.
- Note: The Saved Drafts Panel is on the billing screen, not the settings screen.

**Expected output:** Settings page shows the count of saved drafts. The count matches reality. The "View saved bills" link takes the user to the billing screen.

---

- [x] **ST-10.2.1** Update `lib/api/settings.ts` to type the `savedDraftCount` field in the settings response type.
  - **Expected output:** TypeScript type for settings response includes `savedDraftCount: number`.

- [x] **ST-10.2.2** Add the "Saved Bills" section to the settings page UI. Show the count. Show "View saved bills" link if count > 0.
  - **Expected output:** Settings page renders the section. Count is 0 for new user. Count increases after creating drafts.

---

---

## Dependency Map

Build in this order to avoid blockers:

```
US-01 (Backend Draft API)
  ↓
US-02 (IndexedDB Schema)
  ↓
US-03 (Tab Bar UI + useBillingTabs hook)
  ↓
US-04 (Sync Engine) ──────────────────────────────────┐
US-05 (Load on Login)                                  │
US-08 (Offline Behavior) — needs US-04                 │
  ↓                                                    │
US-06 (Cross-Tab Stock) — needs US-03                  │
US-07 (Saved Drafts Panel) — needs US-01 + US-03       │
US-09 (Post-Finalization) — needs US-03 + US-01.5      │
US-10 (Settings Count) — needs US-01 BE + US-03 FE ←──┘
```

US-06, US-07, US-08, US-09, US-10 can all be worked in parallel once US-03 is done.

---

## Definition of Done (MVP 2 Complete)

Before MVP 2 is considered complete, all of the following must be true:

- [x] Multiple bills can be open simultaneously in tabs on the billing screen
- [x] Tabs persist across page refresh (IndexedDB cache)
- [x] Tabs are restored from the server on login from a new device
- [x] Creating a new tab works and auto-labels correctly (Bill 1, Bill 2, etc.)
- [x] Switching tabs instantly shows the correct cart — no loading delay
- [x] Closing a tab with items shows a confirmation and moves draft to Saved Drafts
- [x] Closing a tab with no items closes immediately without confirmation
- [x] Closing the last tab immediately creates a new empty tab
- [x] Double-clicking a tab label allows inline rename
- [x] The Saved Drafts Panel opens, lists closed drafts, allows reopening, and allows discard with confirmation
- [x] Drafts sync to the server with 1-second debounce
- [x] Sync failures show the correct status indicator (amber = network, red = server error)
- [x] Coming back online after sync failure triggers immediate retry
- [x] Stock warnings appear on item rows and tab labels when aggregate quantities exceed stock
- [x] Going offline makes previously-synced tabs read-only with a visible indicator
- [x] Drafts created while offline are editable and sync when connectivity returns
- [x] Finalizing an invoice clears the active tab without closing it
- [x] Other open tabs are completely unaffected by another tab's finalization
- [x] A success toast with invoice number appears after finalization (no navigation away)
- [x] Settings page shows the count of saved (non-deleted) drafts
- [x] No MVP 1 features are broken by any MVP 2 changes

---

_End of MVP 2 User Story Breakdown_  
_All PRD requirements are covered. Nothing is left undefined._
