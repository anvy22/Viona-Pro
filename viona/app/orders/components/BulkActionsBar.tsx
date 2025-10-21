import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  CheckCircle, 
  Truck, 
  XCircle, 
  Clock,
  MoreHorizontal 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusUpdate: (status: string) => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({ 
  selectedCount, 
  onStatusUpdate, 
  onClearSelection 
}: BulkActionsBarProps) {
  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          
          <Separator orientation="vertical" className="h-4" />
          
          <span className="text-sm text-muted-foreground">
            Bulk Actions:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusUpdate("pending")}
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            Mark Pending
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusUpdate("shipped")}
            className="gap-1"
          >
            <Truck className="h-3 w-3" />
            Mark Shipped
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusUpdate("completed")}
            className="gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Mark Completed
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onStatusUpdate("cancelled")}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-3 w-3 mr-2" />
                Mark Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-4" />

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}
