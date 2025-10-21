// app/inventory/components/ProductStockChart.tsx
"use client";

import { Card } from "@/components/ui/card";

interface Warehouse {
  id: string;
  name: string;
  stock: number;
}

interface ProductStockChartProps {
  warehouses: Warehouse[];
}

export function ProductStockChart({ warehouses }: ProductStockChartProps) {
  const totalStock = warehouses.reduce((acc, w) => acc + w.stock, 0);
  
  if (totalStock === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No stock data available
      </div>
    );
  }

  // Generate colors for warehouses
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500'
  ];

  return (
    <div className="space-y-4">
      {/* Simple Bar Chart */}
      <div className="space-y-3">
        {warehouses.map((warehouse, index) => {
          const percentage = (warehouse.stock / totalStock) * 100;
          return (
            <div key={warehouse.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{warehouse.name}</span>
                <span className="text-muted-foreground">
                  {warehouse.stock} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${colors[index % colors.length]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-3 bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Stock</span>
          <span className="text-lg font-bold">{totalStock} units</span>
        </div>
      </Card>
    </div>
  );
}
