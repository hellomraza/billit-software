"use client";

import { importProductsAction } from "@/actions/products";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  File,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useActionState, useRef, useState } from "react";
import { toast } from "sonner";

const getHasResults = (
  state: Awaited<ReturnType<typeof importProductsAction>>,
) => {
  const success = !!state.success && !state.error;
  const imported = "imported" in state && state.imported && state.imported > 0;
  const skipped = "skipped" in state && state.skipped && state.skipped > 0;
  return success || imported || skipped;
};

export function ProductImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [state, formAction, isPending] = useActionState(importProductsAction, {
    error: "",
    success: "",
    imported: 0,
    skipped: 0,
    errors: [],
    total: 0,
  });

  const isSuccess = !!state.success && !state.error;
  const hasResults = getHasResults(state);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadTemplate = async () => {
    try {
      // Call API to download template directly via GET /products/import/template
      const response = await fetch("/api/products/import/template");
      if (!response.ok) {
        toast.error("Failed to download template");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "billit_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: generate template locally if API is not available
      const csv =
        "Name,Base Price,Stock,Unit\nSample Product,100,50,pcs\nAnother Item,250,30,kg\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "billit_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <SectionCard
        title="Upload CSV File"
        description="Drag and drop your file here, or click to browse."
      >
        <form action={formAction} className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isPending}
          />

          {/* Upload Area */}
          {!selectedFile && !hasResults && (
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

          {/* File Selected - Ready to Submit */}
          {selectedFile && !hasResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <File className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {state.error && (
                <div className="flex gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Import Error
                    </p>
                    <p className="text-sm text-destructive/80">{state.error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Importing..." : "Import Products"}
                </Button>
              </div>
            </div>
          )}

          {/* Import Results - Success */}
          {isSuccess && (
            <div className="border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-xl mb-2 text-green-900 dark:text-green-100">
                  Import Successful
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Imported <strong>{state.imported}</strong> product
                  {state.imported !== 1 ? "s" : ""}
                  {state.skipped > 0 ? ` · Skipped ${state.skipped}` : ""}
                </p>
              </div>

              {state.errors && state.errors.length > 0 && (
                <div className="w-full max-w-md text-left">
                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                    Errors in skipped rows:
                  </p>
                  <div className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-900 rounded p-3 max-h-48 overflow-auto">
                    <ul className="text-xs space-y-1">
                      {state.errors.slice(0, 10).map((err, i) => (
                        <li key={i} className="text-red-600 dark:text-red-400">
                          Row {err.rowNumber}: {err.reason}
                        </li>
                      ))}
                      {state.errors.length > 10 && (
                        <li className="text-gray-500 dark:text-gray-400">
                          ...and {state.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Import Another File
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => router.push(ROUTES.PRODUCTS)}
                >
                  View Products
                </Button>
              </div>
            </div>
          )}

          {/* Import Results - Error with Some Valid Rows */}
          {state.error && hasResults && (
            <div className="border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 rounded-lg p-8 text-center flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="font-semibold text-xl mb-2 text-yellow-900 dark:text-yellow-100">
                  Partial Import
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Imported <strong>{state.imported}</strong> product
                  {state.imported !== 1 ? "s" : ""} · Skipped{" "}
                  <strong>{state.skipped}</strong>
                </p>
              </div>

              {state.errors && state.errors.length > 0 && (
                <div className="w-full max-w-md text-left">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Errors in skipped rows:
                  </p>
                  <div className="bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-900 rounded p-3 max-h-48 overflow-auto">
                    <ul className="text-xs space-y-1">
                      {state.errors.slice(0, 10).map((err, i) => (
                        <li key={i} className="text-red-600 dark:text-red-400">
                          Row {err.rowNumber}: {err.reason}
                        </li>
                      ))}
                      {state.errors.length > 10 && (
                        <li className="text-gray-500 dark:text-gray-400">
                          ...and {state.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2 w-full pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => router.push(ROUTES.PRODUCTS)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Uploading State */}
          {isPending && (
            <div className="border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" />
              <h3 className="font-medium">Importing your products...</h3>
              <p className="text-sm text-muted-foreground">
                Please don&apos;t close this window
              </p>
            </div>
          )}
        </form>
      </SectionCard>

      <SectionCard title="Instructions" padding="md" className="h-fit">
        <div className="text-sm text-muted-foreground space-y-4">
          <p>1. Download the template CSV file to ensure correct formatting.</p>
          <p>
            2. The <strong>Name</strong> and <strong>Base Price</strong> columns
            are strictly required.
          </p>
          <p>3. Max file size is 5 MB.</p>
          <p>4. CSV format only.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={handleDownloadTemplate}
            disabled={isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
