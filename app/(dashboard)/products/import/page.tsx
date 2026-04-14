"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { UploadCloud, CheckCircle2, FileWarning } from "lucide-react";

export default function ImportProductsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleSimulatedUpload = () => {
    setStatus("uploading");
    setTimeout(() => {
      // Simulate an error 30% of the time to show error states
      if (Math.random() > 0.7) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Import Products via CSV" 
        breadcrumbs={[
          { label: "Products", href: ROUTES.PRODUCTS },
          { label: "Import" }
        ]}
      />
      
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <SectionCard title="Upload CSV File" description="Drag and drop your file here, or click to browse.">
          {status === "idle" && (
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={handleSimulatedUpload}
            >
              <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Click to Upload</h3>
              <p className="text-sm text-muted-foreground">Supported format: .csv up to 5MB</p>
            </div>
          )}

          {status === "uploading" && (
            <div className="border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center">
              <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin mb-4" />
              <h3 className="font-medium animate-pulse">Parsing file...</h3>
            </div>
          )}

          {status === "success" && (
            <div className="border border-success/30 bg-success/10 rounded-lg p-8 text-center flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-success mb-3" />
              <h3 className="font-semibold text-xl mb-1 text-success font-medium">Import Successful</h3>
              <p className="text-sm text-muted-foreground mb-6">Added 124 products safely to your catalog.</p>
              <Button onClick={() => router.push(ROUTES.PRODUCTS)}>Return to Catalog</Button>
            </div>
          )}

          {status === "error" && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-8 text-center flex flex-col items-center">
              <FileWarning className="h-12 w-12 text-destructive mb-3" />
              <h3 className="font-semibold text-xl mb-1 text-destructive font-medium">Validation Errors Found</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                Row 14 is missing exactly one "basePrice" requirement. Row 29 contains characters instead of numbers in stock.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStatus("idle")}>Try Again</Button>
                <Button variant="ghost" onClick={() => router.push(ROUTES.PRODUCTS)}>Cancel</Button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Instructions" padding="md" className="h-fit">
          <div className="text-sm text-muted-foreground space-y-4">
            <p>1. Download the template CSV file to ensure correct formatting.</p>
            <p>2. The <strong>Name</strong> and <strong>Base Price</strong> columns are strictly required.</p>
            <p>3. Row limit is set to 2,000 maximum per upload phase.</p>
            <Button variant="outline" size="sm" className="w-full mt-2">Download Template .csv</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
