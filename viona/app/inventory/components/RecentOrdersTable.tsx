// app/inventory/components/RecentOrdersTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface RecentOrder {
  orderId: string;
  orderDate: string;
  customerName: string;
  quantity: number;
  priceAtOrder: number;
  status: string;
}

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-purple-100 text-purple-800";
    case "shipped":
      return "bg-indigo-100 text-indigo-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No recent orders for this product
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-mono text-sm">
                  #{order.orderId}
                </TableCell>
                <TableCell>{formatDate(order.orderDate)}</TableCell>
                <TableCell className="font-medium">
                  {order.customerName}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {order.quantity}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(order.priceAtOrder)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(order.quantity * order.priceAtOrder)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(order.status)} font-medium`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/orders?search=${order.orderId}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
        <span className="text-sm text-muted-foreground">
          Showing {orders.length} recent orders
        </span>
        <div className="text-sm">
          <span className="text-muted-foreground">Total Quantity: </span>
          <span className="font-semibold">
            {orders.reduce((acc, order) => acc + order.quantity, 0)} units
          </span>
        </div>
      </div>
    </div>
  );
}
