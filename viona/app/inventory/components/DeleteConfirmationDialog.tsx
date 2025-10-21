// File: app/inventory/components/DeleteConfirmationDialog.tsx
// Confirmation dialog for deleting products

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Product } from "../../api/inventory/products/route";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  product: Product | null;
}

export function DeleteConfirmationDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  product 
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{product?.name}"? This action cannot be undone.
            {product && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg dark:bg-black">
                <div className="text-sm text-gray-300 ">
                  <div><strong>SKU:</strong> {product.sku}</div>
                  <div><strong>Stock:</strong> {product.stock} units</div>
                  <div><strong>Price:</strong> ${product.price.toFixed(2)}</div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}