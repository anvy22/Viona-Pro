// app/inventory/components/StockTransferDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowRight, Package, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { transferStock } from "../actions";

interface WarehouseOption {
  id: string;
  name: string;
  address?: string;
  currentStock?: number;
}

interface StockTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  orgId?: string;
  warehouses: WarehouseOption[];
  onSuccess?: () => void;
}

export function StockTransferDialog({ 
  open, 
  onOpenChange, 
  productId, 
  orgId, 
  warehouses, 
  onSuccess 
}: StockTransferDialogProps) {
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFromWarehouse("");
      setToWarehouse("");
      setQuantity(0);
      setReason("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  const handleTransfer = async () => {
    setError(null);

    // Validation
    if (!fromWarehouse || !toWarehouse) {
      setError("Please select both source and destination warehouses");
      return;
    }

    if (fromWarehouse === toWarehouse) {
      setError("Source and destination warehouses must be different");
      return;
    }

    if (!quantity || quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the transfer");
      return;
    }

    const sourceWarehouse = warehouses.find(w => w.id === fromWarehouse);
    if (sourceWarehouse?.currentStock !== undefined && quantity > sourceWarehouse.currentStock) {
      setError(`Insufficient stock. Available: ${sourceWarehouse.currentStock} units`);
      return;
    }

    if (!orgId || !productId) {
      setError("Missing organization or product information");
      return;
    }

    setIsSubmitting(true);

    try {
      await transferStock(orgId, productId, fromWarehouse, toWarehouse, quantity, reason, notes);
      
      toast.success("Stock transferred successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transfer stock";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceWarehouse = warehouses.find(w => w.id === fromWarehouse);
  const destinationWarehouse = warehouses.find(w => w.id === toWarehouse);
  const maxQuantity = sourceWarehouse?.currentStock || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Stock Between Warehouses
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transfer Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Source Warehouse */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  From
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={fromWarehouse} onValueChange={setFromWarehouse} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{warehouse.name}</span>
                          {warehouse.currentStock !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              Stock: {warehouse.currentStock} units
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {sourceWarehouse && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{sourceWarehouse.name}</p>
                    {sourceWarehouse.address && (
                      <p className="text-xs">{sourceWarehouse.address}</p>
                    )}
                    {sourceWarehouse.currentStock !== undefined && (
                      <p className="text-xs font-medium text-green-600">
                        Available: {sourceWarehouse.currentStock} units
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer Arrow */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={quantity || ""}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    disabled={isSubmitting}
                    className="w-20 text-center"
                    min="1"
                    max={maxQuantity}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {maxQuantity}
                  </p>
                </div>
              </div>
            </div>

            {/* Destination Warehouse */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  To
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select 
                  value={toWarehouse} 
                  onValueChange={setToWarehouse} 
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter(w => w.id !== fromWarehouse)
                      .map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{warehouse.name}</span>
                            {warehouse.currentStock !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                Current: {warehouse.currentStock} units
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {destinationWarehouse && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{destinationWarehouse.name}</p>
                    {destinationWarehouse.address && (
                      <p className="text-xs">{destinationWarehouse.address}</p>
                    )}
                    {destinationWarehouse.currentStock !== undefined && (
                      <p className="text-xs font-medium text-blue-600">
                        Current: {destinationWarehouse.currentStock} units
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Transfer Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Transfer Reason *</Label>
              <Select value={reason} onValueChange={setReason} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason for transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rebalancing">Stock Rebalancing</SelectItem>
                  <SelectItem value="demand">High Demand Location</SelectItem>
                  <SelectItem value="consolidation">Inventory Consolidation</SelectItem>
                  <SelectItem value="maintenance">Warehouse Maintenance</SelectItem>
                  <SelectItem value="optimization">Space Optimization</SelectItem>
                  <SelectItem value="emergency">Emergency Supply</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details about this transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>

          {/* Transfer Summary */}
          {fromWarehouse && toWarehouse && quantity > 0 && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Transfer Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantity to Transfer:</span>
                  <span className="font-medium">{quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>From:</span>
                  <span className="font-medium">{sourceWarehouse?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="font-medium">{destinationWarehouse?.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>After Transfer - Source:</span>
                  <span>{(sourceWarehouse?.currentStock || 0) - quantity} units</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>After Transfer - Destination:</span>
                  <span>{(destinationWarehouse?.currentStock || 0) + quantity} units</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={isSubmitting || !fromWarehouse || !toWarehouse || quantity <= 0 || !reason}
          >
            {isSubmitting ? "Transferring..." : "Transfer Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
