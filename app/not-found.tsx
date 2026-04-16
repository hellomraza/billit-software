import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-[100vh] w-full flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-8xl font-extrabold tracking-tight text-primary/20">
          404
        </h1>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mx-auto max-w-[400px]">
          The route you are looking for does not exist or may have been moved.
        </p>
        <div className="pt-6">
          <Button variant="default">
            <Link href="/">
              <MoveLeft className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
