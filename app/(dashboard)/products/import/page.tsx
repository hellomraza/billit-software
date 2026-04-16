"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { CheckCircle2, File, FileWarning, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

interface ParsedRow {
  name: string;
  basePrice: number;
  stock?: number;
  unit?: string;
  [key: string]: string | number | undefined;
}

interface ParseError {
  row: number;
  message: string;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    // Simple CSV split — handles basic quoted fields
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });

  return { headers, rows };
}

function validateRows(
  headers: string[],
  rows: string[][],
): { valid: ParsedRow[]; errors: ParseError[] } {
  const nameIdx = headers.findIndex((h) => h.toLowerCase() === "name");
  const priceIdx = headers.findIndex(
    (h) =>
      h.toLowerCase() === "baseprice" ||
      h.toLowerCase() === "base price" ||
      h.toLowerCase() === "price",
  );
  const stockIdx = headers.findIndex(
    (h) => h.toLowerCase() === "stock" || h.toLowerCase() === "quantity",
  );
  const unitIdx = headers.findIndex((h) => h.toLowerCase() === "unit");

  const errors: ParseError[] = [];
  const valid: ParsedRow[] = [];

  if (nameIdx === -1) {
    errors.push({ row: 0, message: "Missing required column: 'Name'" });
    return { valid, errors };
  }
  if (priceIdx === -1) {
    errors.push({
      row: 0,
      message: "Missing required column: 'Base Price' or 'Price'",
    });
    return { valid, errors };
  }

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-indexed, skip header
    const name = row[nameIdx]?.trim();
    const priceStr = row[priceIdx]?.trim();

    if (!name) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: Name is empty` });
      return;
    }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) {
      errors.push({
        row: rowNum,
        message: `Row ${rowNum}: Invalid Base Price "${priceStr}"`,
      });
      return;
    }

    const stockStr = stockIdx !== -1 ? row[stockIdx]?.trim() : undefined;
    let stock: number | undefined;
    if (stockStr) {
      stock = parseInt(stockStr);
      if (isNaN(stock)) {
        errors.push({
          row: rowNum,
          message: `Row ${rowNum}: Invalid stock value "${stockStr}"`,
        });
        return;
      }
    }

    valid.push({
      name,
      basePrice: price,
      stock,
      unit: unitIdx !== -1 ? row[unitIdx]?.trim() : undefined,
    });
  });

  return { valid, errors };
}

export default function ImportProductsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "preview" | "importing" | "success" | "error"
  >("idle");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Invalid file type", {
        description: "Please upload a .csv file.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum file size is 5MB.",
      });
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        setParseErrors([
          { row: 0, message: "CSV file is empty or has no data rows." },
        ]);
        setStatus("error");
        return;
      }

      if (rows.length > 2000) {
        setParseErrors([
          {
            row: 0,
            message: `Too many rows (${rows.length}). Maximum is 2,000 per upload.`,
          },
        ]);
        setStatus("error");
        return;
      }

      const { valid, errors } = validateRows(headers, rows);

      if (errors.length > 0) {
        setParseErrors(errors);
        setPreviewRows(valid);
        setStatus("error");
      } else {
        setPreviewRows(valid);
        setStatus("preview");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setStatus("error");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStatus("importing");
    setImportProgress(0);
    try {
      // Generate IDs for new products
      const importedProducts = previewRows.map((row, idx) => ({
        id: `imported-${Date.now()}-${idx}`,
        name: row.name,
        basePrice: row.basePrice,
        currentStock: row.stock ?? 0,
        unit: row.unit ?? "pcs",
        gstRate: 18,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        source: "csv-import" as const,
      }));

      // Simulate progressive import with real progress tracking
      const totalItems = importedProducts.length;
      const batchSize = Math.max(1, Math.ceil(totalItems / 10));

      for (let i = 0; i < totalItems; i += batchSize) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        const progressPercent = Math.min(
          100,
          Math.round(((i + batchSize) / totalItems) * 100),
        );
        setImportProgress(progressPercent);
      }

      // Get existing imports and add new ones
      const existingImports = localStorage.getItem("billit_imported_products");
      const allImports = existingImports ? JSON.parse(existingImports) : [];
      const updated = [...allImports, ...importedProducts];
      localStorage.setItem("billit_imported_products", JSON.stringify(updated));

      // Show success
      toast.success(`${previewRows.length} products imported successfully`, {
        description: "Products have been added to your catalog.",
      });
      setImportProgress(100);
      setStatus("success");
    } catch (error) {
      toast.error("Import failed", {
        description:
          "An error occurred while importing products. Please try again.",
      });
      setStatus("error");
      setImportProgress(0);
      setParseErrors([
        {
          row: 0,
          message:
            "Import operation failed. Please check the file and try again.",
        },
      ]);
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setFileName("");
    setPreviewRows([]);
    setParseErrors([]);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadTemplate = () => {
    const csv =
      "Name,Base Price,Stock,Unit\nSample Product,100,50,pcs\nAnother Item,250,30,kg\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "billit_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Import Products via CSV"
        breadcrumbs={[
          { label: "Products", href: ROUTES.PRODUCTS },
          { label: "Import" },
        ]}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <SectionCard
          title="Upload CSV File"
          description="Drag and drop your file here, or click to browse."
        >
          {status === "idle" && (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Click to Upload</h3>
              <p className="text-sm text-muted-foreground">
                Supported format: .csv up to 5MB
              </p>
            </div>
          )}

          {status === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {previewRows.length} products ready
                </span>
              </div>
              <div className="max-h-64 overflow-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">#</th>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-right p-2 font-medium">Price</th>
                      <th className="text-right p-2 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2">{row.name}</td>
                        <td className="p-2 text-right">
                          ₹{row.basePrice.toFixed(2)}
                        </td>
                        <td className="p-2 text-right">{row.stock ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewRows.length > 20 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                    ...and {previewRows.length - 20} more rows
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>
                  Import {previewRows.length} Products
                </Button>
              </div>
            </div>
          )}

          {status === "importing" && (
            <div className="border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" />
              <h3 className="font-medium">
                Importing {previewRows.length} products...
              </h3>
              <div className="w-full max-w-xs">
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {importProgress}% complete
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="border border-success/30 bg-success/10 rounded-lg p-8 text-center flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-success mb-3" />
              <h3 className="font-semibold text-xl mb-1 text-success">
                Import Successful
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Added {previewRows.length} products to your catalog.
              </p>
              <Button onClick={() => router.push(ROUTES.PRODUCTS)}>
                Return to Catalog
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-8 text-center flex flex-col items-center">
              <FileWarning className="h-12 w-12 text-destructive mb-3" />
              <h3 className="font-semibold text-xl mb-1 text-destructive">
                Validation Errors Found
              </h3>
              <div className="text-sm text-muted-foreground mb-4 max-w-md mx-auto text-left space-y-1">
                {parseErrors.slice(0, 10).map((err, i) => (
                  <p key={i}>• {err.message}</p>
                ))}
                {parseErrors.length > 10 && (
                  <p className="text-xs">
                    ...and {parseErrors.length - 10} more errors
                  </p>
                )}
              </div>
              {previewRows.length > 0 && (
                <p className="text-xs text-muted-foreground mb-4">
                  {previewRows.length} valid rows found. Fix errors and
                  re-upload to import all.
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(ROUTES.PRODUCTS)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Instructions" padding="md" className="h-fit">
          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              1. Download the template CSV file to ensure correct formatting.
            </p>
            <p>
              2. The <strong>Name</strong> and <strong>Base Price</strong>{" "}
              columns are strictly required.
            </p>
            <p>3. Row limit is set to 2,000 maximum per upload phase.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleDownloadTemplate}
            >
              Download Template .csv
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
