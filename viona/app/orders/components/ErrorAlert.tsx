import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="pr-8">
        {message}
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-destructive/20"
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  );
}
