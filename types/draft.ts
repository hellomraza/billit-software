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

export interface TabState {
  clientDraftId: string;
  tabLabel: string;
  items: DraftItem[];
  syncStatus: SyncStatus;
  hasStockWarning?: boolean;
}

export interface LocalDraft {
  id?: string;
  clientDraftId: string;
  tenantId: string;
  outletId: string;
  tabLabel: string;
  items: DraftItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  localUpdatedAt: string;
  syncStatus: SyncStatus;
  syncFailureType: SyncFailureType;
  isOfflineCreated: boolean;
}

export interface BillingTabsState {
  drafts: LocalDraft[];
  openTabIds: string[];
  activeTabId: string;
  tabCounter: number;
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
  getSavedDrafts: () => LocalDraft[];
  getPendingSyncDrafts: () => LocalDraft[];
}
