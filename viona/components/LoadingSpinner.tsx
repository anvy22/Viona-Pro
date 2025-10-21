import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </Card>
  );
}
