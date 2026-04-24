import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessForm } from "@/features/onboarding/business-form";

export default function BusinessSetupPage() {
  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">
          Step 1 of 3
        </div>
        <CardTitle className="text-xl">Business Identity</CardTitle>
        <CardDescription>
          What is the legal name of your business?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BusinessForm />
      </CardContent>
    </Card>
  );
}
