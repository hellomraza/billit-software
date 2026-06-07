import { MoneyText } from "@/components/shared/money-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceItem } from "@/types";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  showGst: boolean;
  isRefund?: boolean;
}

export function InvoiceItemsTable({
  items,
  showGst,
  isRefund = false,
}: InvoiceItemsTableProps) {
  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[40%]">Item</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Sub Total</TableHead>
            {showGst && <TableHead className="text-right">Total GST</TableHead>}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-sm">
                <div className="flex flex-col">
                  <span>
                    {item.productName}
                    {isRefund && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        × {item.quantity} returned
                      </span>
                    )}
                  </span>
                  {item.itemDiscountAmount && item.itemDiscountAmount > 0 ? (
                    <span className="text-xs text-muted-foreground mt-1">
                      {item.itemDiscountType === "PERCENTAGE" ? (
                        <>
                          Discount: −{item.itemDiscountValue}% (
                          <MoneyText
                            amount={-Math.abs(item.itemDiscountAmount)}
                          />
                          )
                        </>
                      ) : (
                        <>
                          Discount:{" "}
                          <MoneyText
                            amount={-Math.abs(item.itemDiscountAmount)}
                          />
                        </>
                      )}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                <MoneyText amount={item.unitPrice} />
              </TableCell>
              <TableCell className="text-center font-medium">
                x{item.quantity}
              </TableCell>
              <TableCell
                className={`text-right font-medium tabular-nums ${isRefund ? "text-rose-600" : ""}`}
              >
                <MoneyText
                  amount={
                    isRefund
                      ? -Math.abs(Number(item.unitPrice) * item.quantity)
                      : Number(item.unitPrice) * item.quantity
                  }
                />
              </TableCell>
              {showGst && (
                <TableCell
                  className={`text-right text-muted-foreground text-sm ${isRefund ? "text-rose-600" : ""}`}
                >
                  <MoneyText
                    amount={
                      isRefund ? -Math.abs(item.gstAmount) : item.gstAmount
                    }
                  />
                </TableCell>
              )}
              <TableCell
                className={`text-right font-medium tabular-nums ${isRefund ? "text-rose-600" : ""}`}
              >
                <MoneyText
                  amount={isRefund ? -Math.abs(item.subtotal) : item.subtotal}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
