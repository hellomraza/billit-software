import { DeficitRecord } from "@/types";
import { delay } from "./delay";

export const MOCK_DEFICITS: DeficitRecord[] = [
  {
    id: "def_1",
    productId: "p_4", // Coca Cola 2L
    invoiceId: "inv_2", // Hypothetical sale that caused the deficit
    missingQuantity: 2,
    status: "PENDING",
    createdAt: "2024-04-13T10:00:00Z",
  },
  {
    id: "def_2",
    productId: "p_3", // Maggi
    invoiceId: "inv_1",
    missingQuantity: 10,
    status: "RESOLVED",
    createdAt: "2024-04-12T15:00:00Z",
    resolvedAt: "2024-04-13T08:00:00Z",
  },
];

export async function getDeficits() {
  await delay(400);

  // Load persisted deficits from localStorage
  const persistedStr = localStorage.getItem("billit_deficits");
  if (persistedStr) {
    return JSON.parse(persistedStr) as DeficitRecord[];
  }

  return MOCK_DEFICITS;
}

export function persistDeficits(deficits: DeficitRecord[]) {
  localStorage.setItem("billit_deficits", JSON.stringify(deficits));
}

export function resolveDeficitGroup(productId: string, totalMissing: number) {
  // Get current deficits
  const persistedStr = localStorage.getItem("billit_deficits");
  const allDeficits = persistedStr ? JSON.parse(persistedStr) : MOCK_DEFICITS;

  // Mark all deficits for this product as RESOLVED
  const updatedDeficits = allDeficits.map((d: DeficitRecord) => {
    if (d.productId === productId && d.status === "PENDING") {
      return {
        ...d,
        status: "RESOLVED" as const,
        resolvedAt: new Date().toISOString(),
      };
    }
    return d;
  });

  // Persist updated deficits
  persistDeficits(updatedDeficits);

  return true;
}
