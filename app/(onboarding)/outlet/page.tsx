import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OutletForm } from "@/features/onboarding/outlet-form";

export default function OutletSetupPage() {
  return (
    <Card className="w-full shadow-sm border-0 sm:border">
      <CardHeader>
        <div className="text-sm text-muted-foreground font-medium mb-1">
          Step 2 of 3
        </div>
        <CardTitle className="text-xl">Outlet Details</CardTitle>
        <CardDescription>Name this specific store location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OutletForm />
      </CardContent>
    </Card>
  );
}
