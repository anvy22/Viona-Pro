// app/inventory/components/EditProductDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

// Updated interface to match your database schema
interface ProductData {
  id: string;
  name: string;
  sku: string;
  description?: string;
  image?: string;
  status: string;
  currentPrice: number;
  // Add the missing price fields
  actualPrice?: number;
  marketPrice?: number;
  // Or if the data comes in a different structure:
  priceHistory?: Array<{
    retailPrice: number;
    actualPrice?: number;
    marketPrice?: number;
  }>;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  initialData?: ProductData | null;
}

export function EditProductDialog({ open, onOpenChange, onSave, initialData }: EditProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    image: '',
    status: 'active',
    price: 0,
    actualPrice: 0,
    marketPrice: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fixed initialization - now properly sets actualPrice and marketPrice
  useEffect(() => {
    if (initialData && open) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        description: initialData.description || '',
        image: initialData.image || '',
        status: initialData.status || 'active',
        price: initialData.currentPrice || 0,
        // Fix: Get actualPrice and marketPrice from initialData
        actualPrice: initialData.actualPrice || 
                    (initialData.priceHistory?.[0]?.actualPrice) || 0,
        marketPrice: initialData.marketPrice || 
                     (initialData.priceHistory?.[0]?.marketPrice) || 0,
      });
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        name: '',
        sku: '',
        description: '',
        image: '',
        status: 'active',
        price: 0,
        actualPrice: 0,
        marketPrice: 0,
      });
    }
    setError(null);
  }, [initialData, open]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    if (!formData.sku.trim()) {
      setError("SKU is required");
      return;
    }

    if (formData.price < 0) {
      setError("Price cannot be negative");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        status: formData.status,
        price: formData.price,
        actualPrice: formData.actualPrice || undefined,
        marketPrice: formData.marketPrice || undefined,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update product";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="Enter SKU"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Retail Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualPrice">Actual Price</Label>
                  <Input
                    id="actualPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.actualPrice || ''}
                    onChange={(e) => handleInputChange('actualPrice', parseFloat(e.target.value) || 0)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketPrice">Market Price</Label>
                  <Input
                    id="marketPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.marketPrice || ''}
                    onChange={(e) => handleInputChange('marketPrice', parseFloat(e.target.value) || 0)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>• Retail Price: The price customers pay</p>
                <p>• Actual Price: Your cost/wholesale price (optional)</p>
                <p>• Market Price: Competitor pricing reference (optional)</p>
              </div>
            </CardContent>
          </Card>
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
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
