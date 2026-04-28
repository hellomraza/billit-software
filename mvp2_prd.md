# POS + Inventory SaaS — MVP 2 Product Requirements Document

**Version:** 1.0  
**Status:** Final — Single Source of Truth  
**Scope:** MVP 2 — Multi-Tab Billing  
**Depends On:** MVP 1 (fully deployed and stable)  
**Last Updated:** 2026-04-13

---

## 0. How to Use This Document

This document defines all changes, additions, and new behaviors introduced in MVP 2. It does not repeat MVP 1 behavior unless MVP 2 modifies or extends it. Read MVP 1 PRD first. Where MVP 2 changes MVP 1 behavior, this document is authoritative.

---

## 1. Purpose and Scope

MVP 1 supports exactly one active bill at a time. A shopkeeper with two customers at the counter simultaneously must abandon the first customer's bill to start the second, or keep mental notes. MVP 2 eliminates this entirely.

MVP 2 introduces:
- Multiple simultaneous draft bills per outlet, managed in a tab-based UI.
- Cross-tab stock awareness: warns when combined quantities across all open tabs exceed available stock.
- Account-synced drafts: open tabs are visible from the same account on any device (browser).
- Full draft state persistence: a tab is never lost due to page refresh, browser restart, or session switch.

At the end of MVP 2, a shopkeeper can handle unlimited concurrent customers on the same device without losing any bill state, and their open drafts are accessible from any browser where they are logged in.

---

## 2. Explicitly Out of Scope for MVP 2

| Feature | Planned MVP |
|---|---|
| Refunds | MVP 3 |
| Discounts | MVP 3 |
| Multiple outlets | MVP 4 |
| Offline mode | MVP 5 |
| Analytics | MVP 6 |
| Multi-device simultaneous billing (two people billing at the same time) | Post-MVP |
| Real-time tab sync across devices | Post-MVP |

---

## 3. Core Invariants (Unchanged from MVP 1)

All 7 invariants from MVP 1 Section 3 remain in full force. Additionally:

8. **Cross-tab stock warnings are advisory only.** The client warns the user when combined quantities across tabs exceed stock. The server is still the sole authority on whether a finalization succeeds. A warning does not block finalization.
9. **Each tab finalizes independently.** One tab's finalization does not automatically update or block another tab. Stock changes from one finalization are reflected in all tabs the next time stock is fetched or refreshed.
10. **Drafts are the user's data.** Drafts must not be auto-deleted by the system under any circumstance. Only explicit user action (close tab, clear bill, finalize) removes a draft.

---

## 4. Mental Model Changes from MVP 1

### 4.1 From One Bill to Many Tabs

In MVP 1, the billing screen IS the bill. In MVP 2, the billing screen is a container that holds multiple bills, each in its own tab. The user navigates between tabs like browser tabs — each tab is an independent, fully isolated bill.

### 4.2 Draft Persistence Model Change

In MVP 1, the single draft lives in IndexedDB only (device-local). In MVP 2, drafts are synced to the server. The server becomes the source of truth for draft state. IndexedDB is a local cache of server-synced drafts.

**Offline behavior (important):** When the device is offline, the user can still create new drafts locally. These new offline drafts exist in IndexedDB only until sync is possible. Existing drafts that were previously synced to the server are available in read-only mode offline. The user cannot modify previously synced drafts while offline.

This offline distinction is the same Option B decision from the design sessions. Full offline billing (including modifying synced drafts offline) is addressed in MVP 5.

### 4.3 Stock Awareness Across Tabs

Every tab holds a quantity for some products. When the user adds or changes a quantity in any tab, the system checks whether the combined quantity of that product across all open tabs exceeds the last-known server stock. If it does, a visible warning is shown in the affected tab. This warning is purely informational — it does not block the user.

---

## 5. Data Model Changes

### 5.1 New Table: Draft

Drafts are now server-persisted entities. The IndexedDB structure from MVP 1 is replaced by this server entity, with IndexedDB serving as a local cache.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Server-assigned on first sync |
| clientDraftId | UUID | Required, unique per tenant | Client-generated on draft creation. Used for sync idempotency |
| tenantId | UUID | FK → Tenant, required | — |
| outletId | UUID | FK → Outlet, required | Always the default outlet in MVP 2 |
| tabLabel | string | Optional, max 50 chars | User-assigned name for the tab. Default: "Bill 1", "Bill 2" etc. |
| items | JSON array | Required, can be empty | Same structure as MVP 1 DraftBill.items |
| customerName | string | Optional | — |
| customerPhone | string | Optional | — |
| paymentMethod | enum | Optional: CASH, CARD, UPI, null | — |
| isDeleted | boolean | Default: false | Set when user closes tab |
| createdAt | timestamp | Auto | — |
| updatedAt | timestamp | Auto | Updated on every sync |
| syncedAt | timestamp | Nullable | Last successful server sync time |

**Constraint:** No unique constraint on (tenantId, outletId) — multiple drafts per outlet are explicitly allowed.

### 5.2 IndexedDB Schema (Client-Side Cache)

Each draft in IndexedDB mirrors the server Draft entity plus local-only fields:

| Field | Type | Notes |
|---|---|---|
| All server Draft fields | — | Kept in sync |
| localUpdatedAt | timestamp | Last local modification time |
| syncStatus | enum | SYNCED, PENDING_SYNC, SYNC_FAILED |
| isOfflineCreated | boolean | True if created while offline (no server ID yet) |

The IndexedDB store name for drafts is `drafts`. Indexed by: `id`, `clientDraftId`, `outletId`.

---

## 6. Tab System

### 6.1 Tab Bar

A persistent tab bar appears at the top of the billing screen area. It is visible at all times on the billing screen.

Each tab shows:
- Tab label (default: "Bill 1", "Bill 2", etc. — incrementing by count of tabs ever created in session, not by count of currently open tabs)
- Item count badge (number of distinct products in the cart)
- Close button (×)
- A "+" button at the end of the tab bar to create a new tab

The active tab is visually distinguished. Clicking a tab makes it active.

### 6.2 Creating a New Tab

User clicks "+". A new draft is created:
- Assigned a new `clientDraftId` (client-generated UUID).
- Assigned a default label ("Bill 2", "Bill 3" etc.).
- Items array is empty.
- Immediately displayed as the active tab.
- Sync to server is initiated in the background (non-blocking).

**Maximum open tabs:** No hard limit enforced in MVP 2. Practical limit is browser/device memory.

### 6.3 Switching Tabs

Clicking an inactive tab:
- Makes it the active tab.
- Renders its cart and customer info immediately from local state.
- No server request needed to switch tabs (data is cached locally).

### 6.4 Closing a Tab

User clicks × on a tab.

**If the tab's cart is empty:** Close immediately without confirmation.

**If the tab has items:** Show confirmation dialog: "This bill has items. Close it anyway? The bill will be saved in your drafts and can be reopened." The draft is NOT deleted on close — it is marked `isDeleted = false` in the sense that it persists. The tab merely disappears from the tab bar.

Wait — clarification: closing a tab removes it from the active tab bar but does NOT delete the draft. The draft remains accessible via a "Saved Drafts" panel (see Section 6.7). Only explicit "Discard Bill" deletes a draft permanently.

**If closing the last open tab:** A new empty tab is created automatically so there is always at least one tab visible.

### 6.5 Tab Renaming

Double-clicking the tab label allows inline editing of the label. Max 50 characters. Press Enter or click away to confirm. The new label is synced to the server.

### 6.6 Tab State After Finalization

When a tab's bill is successfully finalized:
- The tab's cart is cleared.
- Customer info and payment method are reset.
- The tab label resets to a new default (e.g. "New Bill").
- The tab remains open (it does not close automatically). The user can immediately start a new bill on it.

### 6.7 Saved Drafts Panel

A "Drafts" button or icon in the billing screen opens a slide-in panel listing all non-deleted drafts that are not currently open as a tab. This allows the user to reopen a draft they closed earlier.

Each saved draft in the panel shows: tab label, item count, grand total estimate (based on current prices, not snapshots), last updated time.

Clicking a saved draft opens it as a new active tab.

A "Discard" button on each draft in the panel permanently deletes it (with confirmation: "Permanently discard this bill?"). This sets `Draft.isDeleted = true` on the server.

---

## 7. Cross-Tab Stock Awareness

### 7.1 Aggregate Stock Calculation

When the user sets a quantity for a product in any tab, the client computes:

```
totalRequestedAcrossAllTabs = SUM(quantity of productId X across all open tabs including current edit)
```

This computation is purely client-side, using the locally-cached draft data.

### 7.2 Warning Display

If `totalRequestedAcrossAllTabs > lastKnownStock`:
- Show an inline warning on the item row in the active tab: "Total across all open bills exceeds available stock ({N} available, {M} requested across {K} bills)."
- Show a subtle indicator on the tab label (e.g. a small warning icon) for any tab containing an item that is over the aggregate limit.
- The warning updates in real-time as the user changes quantities.
- The warning does not prevent adding items or changing quantities.
- The warning does not prevent finalization (the server makes the final call).

### 7.3 Stock Refresh Scope

"Refresh stock" on the billing screen now refreshes stock for ALL open tabs simultaneously (since stock is shared across tabs). The last-known stock values in the cross-tab calculations are updated accordingly.

---

## 8. Draft Sync System

### 8.1 Sync Strategy

Drafts are synced to the server using an optimistic, debounced approach.

**Debounce:** After any change to a draft (item added, quantity changed, customer info updated), the client waits 1 second of inactivity before sending the sync request. This prevents a server call on every keystroke.

**On sync success:** Update `Draft.syncedAt`, set `syncStatus = SYNCED`.

**On sync failure (network error):** Set `syncStatus = SYNC_FAILED`. Retry with exponential backoff: 5s, 10s, 30s, then every 60s. Never stop retrying while the tab is open. Show a small persistent indicator: "Draft not saved — reconnecting…"

**On sync failure (server validation error):** These should not occur in normal operation (draft content is not server-validated in the same way as invoices). If they do occur (e.g. server rejects malformed payload), set `syncStatus = SYNC_FAILED`, show error, and do not retry automatically. Require user to refresh.

### 8.2 Sync Payload

Sync sends the full draft state on each call (not a diff):

```json
{
  "clientDraftId": "uuid",
  "outletId": "uuid",
  "tabLabel": "Bill 1",
  "items": [
    { "productId": "uuid", "productName": "string", "quantity": 2, "unitPrice": 150.00 }
  ],
  "customerName": null,
  "customerPhone": null,
  "paymentMethod": "CASH"
}
```

The server upserts based on `clientDraftId`. This is idempotent — sending the same payload twice produces the same result.

### 8.3 Loading Drafts on Login (New Device or New Browser)

On login (or page load with a valid session):
1. Client fetches all non-deleted drafts from server for the authenticated tenant's default outlet.
2. Each fetched draft is stored in IndexedDB.
3. Each draft is opened as a tab in the billing screen.
4. If there are no server drafts, one empty tab is opened.
5. Tabs are ordered by `Draft.updatedAt` ascending (oldest first, consistent across devices).

### 8.4 Draft Conflict Resolution

**Scenario:** User has tabs open on Device A (laptop). They also open the app on Device B (phone). They edit the same draft on both devices while online.

This is NOT a supported scenario in MVP 2 (multi-device simultaneous billing is post-MVP). However, it can technically happen.

**Resolution rule:** Last-write-wins. The server stores the most recently received payload. The client on Device A will see stale data until it refreshes. On next load of Device A, it fetches the server state and overwrites its local cache. No conflict UI is shown.

**Note for post-MVP:** A future version will implement operational transform or a conflict notification UI. The `Draft.updatedAt` timestamp is preserved now precisely for this future use.

### 8.5 Offline Draft Behavior

**Existing synced drafts (were online when created):**
- Visible in tab bar as normal.
- Marked as READ-ONLY with a visual indicator: "Changes disabled while offline."
- All edit controls (add product, change quantity, customer info) are disabled.
- The user can view the draft but not modify it.
- Rationale: allowing edits without sync would create the same conflict problem described in 8.4. Full offline editing of synced drafts is addressed in MVP 5.

**New drafts created while offline:**
- Created in IndexedDB with `isOfflineCreated = true`, no server ID yet.
- Fully editable while offline.
- When connectivity is restored, sync is attempted.
- On successful sync, the server assigns an ID and `isOfflineCreated` becomes irrelevant.
- These offline-created drafts are local-only until synced. If the user closes the browser while offline and before sync, the draft lives only in IndexedDB and is restored on next open of the same browser. It is NOT accessible from other devices until sync succeeds.

A persistent status bar shows "Offline — new drafts are local only" when connectivity is lost.

---

## 9. Invoice Finalization Changes

### 9.1 Which Tab Is Being Finalized

Finalization applies to the currently active tab. The "Finalize Invoice" button finalizes the active tab's bill only.

### 9.2 Race Condition Between Tabs

Two tabs can attempt finalization of the same product simultaneously.

**Scenario:** Tab 1 has 5 units of Rice. Tab 2 has 5 units of Rice. Stock = 8. User finalizes Tab 1 (succeeds, stock → 3). User immediately finalizes Tab 2.

**Behavior:** Tab 2 finalization hits the server. Stock is now 3, requested is 5. Server returns `409 STOCK_INSUFFICIENT`. Tab 2 is shown the Insufficient Stock Modal (same as MVP 1 Section 8.7). User chooses: adjust to 3, override, or remove.

This is the defined and acceptable behavior. The system does not attempt to pre-coordinate across tabs. The server is the arbiter.

### 9.3 Post-Finalization Tab State

After a tab successfully finalizes:
- The tab's draft is deleted from the server (`isDeleted = true`).
- The tab's local IndexedDB draft is removed.
- The tab itself remains open with a cleared, empty bill (ready for the next customer).
- All other open tabs are unaffected.

### 9.4 Stock Displayed Across Tabs After Finalization

After Tab 1 finalizes, the stock values in Tab 2 are now stale. Tab 2 does not automatically know that stock changed.

**Behavior:** The stale stock warning in Tab 2 (if any) remains as-is until the user manually refreshes stock or until the next auto-refresh. On finalization attempt, the server always has the current stock — so Tab 2 will get the correct result from the server regardless of what the client shows.

A future enhancement (post-MVP) may push stock updates to open tabs via WebSocket. The architecture should not prevent this.

---

## 10. Changes to Existing Screens

### 10.1 Billing Screen

**Changes from MVP 1:**
- Tab bar added at the top.
- "Drafts" panel button added.
- Stock refresh now refreshes all tabs.
- Sync status indicator added to the tab bar or nav area.
- "Refresh stock" label updated to clarify it applies to all tabs.

**Unchanged from MVP 1:**
- Product search behavior.
- Cart item behavior.
- Customer info fields.
- Payment method selection.
- Bill summary calculation.
- Finalization flow (same server endpoints, same decision matrices).
- "Clear Bill" behavior (clears active tab only).

### 10.2 Settings Screen

**Addition:** A "Saved Drafts" section showing count of saved (not currently open) drafts, with a "View all drafts" link that opens the Saved Drafts Panel.

No other settings changes in MVP 2.

---

## 11. Error Handling Matrix (MVP 2 Additions)

| Scenario | User-Facing Message | System Behaviour |
|---|---|---|
| Draft sync fails (network) | "Draft not saved — reconnecting…" (persistent status) | Retry with backoff |
| Draft sync fails (server error) | "Draft could not be saved. Please refresh." | No auto-retry |
| Tab closed with items (accidental) | Confirmation dialog before close | Draft preserved in Saved Drafts |
| Offline, attempt to edit synced draft | Edit controls disabled, message: "Editing paused while offline." | No server call made |
| Two tabs finalize same product, second gets 409 | Insufficient Stock Modal on second tab | Same MVP 1 flow |
| Open the app on new device, no drafts synced yet | One empty tab opened | Normal new-session state |
| Draft discarded from Saved Drafts panel | Confirmation: "Permanently discard this bill?" | isDeleted = true on server |

---

## 12. State Machine Additions

### 12.1 Draft Sync State Machine

```
[PENDING_SYNC] → [SYNCED]
                 ↓ (on failure)
               [SYNC_FAILED] → [PENDING_SYNC] (on retry)
```

Every local change moves the draft to PENDING_SYNC. After debounce, sync is attempted. Success → SYNCED. Failure → SYNC_FAILED → retry loop.

### 12.2 Tab State Machine

```
[OPEN_ACTIVE] ←→ [OPEN_INACTIVE]
      ↓ (close)
[CLOSED] → draft moves to Saved Drafts
      ↓ (discard from Saved Drafts)
[DELETED]
```

---

## 13. Future Architecture Hooks

| Hook | Enables |
|---|---|
| `Draft.updatedAt` timestamp preserved on all syncs | Post-MVP conflict resolution UI |
| `Draft.isOfflineCreated` flag | MVP 5: offline draft promotion on sync |
| `Draft.outletId` on every draft | MVP 4: per-outlet draft isolation |
| Tab label stored on server | Post-MVP: tab label sync across devices |
| Draft sync endpoint is idempotent (clientDraftId) | MVP 5: replay-safe offline sync queue |
| No hard tab limit enforced | Post-MVP: tab limit per plan tier if billing model introduced |

---

*End of MVP 2 Product Requirements Document*
