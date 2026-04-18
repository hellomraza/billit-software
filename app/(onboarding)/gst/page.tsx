import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GstForm } from "@/features/onboarding/gst-form";

export default function GstSetupPage() {
  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">
          Step 3 of 3
        </div>
        <CardTitle className="text-xl">Tax Configuration</CardTitle>
        <CardDescription>Enter your GST details if applicable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <GstForm />
      </CardContent>
    </Card>
  );
}
