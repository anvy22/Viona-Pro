import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Plus } from "lucide-react";

interface EmptyStateProps {
  onAddOrder: () => void;
}

export function EmptyState({ onAddOrder }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Get started by creating your first order. You can manage all your orders, 
        track their status, and view detailed information from here.
      </p>
      
      <Button onClick={onAddOrder} size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Create Your First Order
      </Button>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>Need help? Check out our documentation or contact support.</p>
      </div>
    </Card>
  );
}
