"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InvoiceFiltersState {
  paymentMethod?: string;
  isGst?: boolean | string;
  startDate?: string;
  endDate?: string;
  productName?: string;
}

export interface InvoiceFiltersBarState {
  invoiceNumber?: string;
  paymentMethod?: string;
  gstEnabled?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
}

export type QuickFilterPill = "today" | "thisWeek" | "thisMonth" | null;

type InvoiceFiltersStoreState = {
  filters: InvoiceFiltersState;
  invoiceFiltersBar: InvoiceFiltersBarState;
  productSearchInput: string;
  selectedQuickFilter: QuickFilterPill;
  actions: {
    setAllFilters: (filters: InvoiceFiltersState) => void;
    setInvoiceFiltersBar: (filters: InvoiceFiltersBarState) => void;
    mergeInvoiceFiltersBar: (filters: Partial<InvoiceFiltersBarState>) => void;
    resetInvoiceFiltersBar: () => void;
    mergeFilters: (filters: Partial<InvoiceFiltersState>) => void;
    setProductSearchInput: (value: string) => void;
    setSelectedQuickFilter: (pill: QuickFilterPill) => void;
    reset: () => void;
  };
};

const EMPTY_FILTERS: InvoiceFiltersState = {
  paymentMethod: "",
  isGst: "",
  startDate: "",
  endDate: "",
  productName: "",
};

const EMPTY_FILTERS_BAR: InvoiceFiltersBarState = {
  invoiceNumber: "",
  paymentMethod: "",
  gstEnabled: "",
  dateFrom: "",
  dateTo: "",
  productId: "",
};

export const useInvoiceFiltersStore = create<InvoiceFiltersStoreState>()(
  persist(
    (set) => ({
      filters: EMPTY_FILTERS,
      invoiceFiltersBar: EMPTY_FILTERS_BAR,
      productSearchInput: "",
      selectedQuickFilter: null,
      actions: {
        setAllFilters: (filters) =>
          set({
            filters: { ...EMPTY_FILTERS, ...filters },
            productSearchInput: filters.productName || "",
          }),
        setInvoiceFiltersBar: (filters) =>
          set({
            invoiceFiltersBar: { ...EMPTY_FILTERS_BAR, ...filters },
          }),
        mergeInvoiceFiltersBar: (filters) =>
          set((state) => ({
            invoiceFiltersBar: { ...state.invoiceFiltersBar, ...filters },
          })),
        resetInvoiceFiltersBar: () =>
          set({
            invoiceFiltersBar: EMPTY_FILTERS_BAR,
          }),
        mergeFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
          })),
        setProductSearchInput: (value) => set({ productSearchInput: value }),
        setSelectedQuickFilter: (pill) => set({ selectedQuickFilter: pill }),
        reset: () =>
          set({
            filters: EMPTY_FILTERS,
            productSearchInput: "",
            selectedQuickFilter: null,
          }),
      },
    }),
    {
      name: "billit_invoice_filters_zustand",
      partialize: (state) => ({
        filters: state.filters,
        invoiceFiltersBar: state.invoiceFiltersBar,
        productSearchInput: state.productSearchInput,
        selectedQuickFilter: state.selectedQuickFilter,
      }),
    },
  ),
);
