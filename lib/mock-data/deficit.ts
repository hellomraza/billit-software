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
  }
];

export async function getDeficits() {
  await delay(400);
  return MOCK_DEFICITS;
}
