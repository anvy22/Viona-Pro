import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  User,
  Calendar,
  DollarSign,
  Eye,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Order } from "../../api/orders/route";

interface OrderTableProps {
  orders: Order[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string, order: "asc" | "desc") => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "processing":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "⏳";
    case "confirmed":
      return "✅";
    case "processing":
      return "⚙️";
    case "shipped":
      return "🚚";
    case "delivered":
      return "📦";
    case "cancelled":
      return "❌";
    default:
      return "📋";
  }
};

export function OrderTable({
  orders,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: OrderTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(orders.map((order) => order.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(orderId);
    } else {
      newSelection.delete(orderId);
    }
    onSelectionChange(newSelection);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSort(field, newOrder);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatAddress = (address: Order["customer"]["address"]) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const allSelected = orders.length > 0 && selectedIds.size === orders.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < orders.length;

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      allSelected
                        ? true
                        : someSelected
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all orders"
                  />
                </TableHead>
                <TableHead className="min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("id")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Order ID
                    {getSortIcon("id")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[140px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("orderDate")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Date
                    {getSortIcon("orderDate")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Customer
                  </div>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("status")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalAmount")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Total
                    {getSortIcon("totalAmount")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[80px]">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Items
                  </div>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Placed By
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const dateInfo = formatDate(order.orderDate);
                const isSelected = selectedIds.has(order.id);
                const customerAddress = formatAddress(order.customer.address);

                return (
                  <TableRow
                    key={order.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      isSelected ? "bg-muted/30" : ""
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectOrder(order.id, checked as boolean)
                        }
                        aria-label={`Select order ${order.id}`}
                      />
                    </TableCell>

                    <TableCell className="font-mono text-sm font-medium">
                      #{order.id}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {dateInfo.date}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateInfo.time}
                        </div>
                      </div>
                    </TableCell>

                    {/* Customer Information Column */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.customer.name || "No Name"}
                        </div>
                        {order.customer.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {order.customer.email}
                          </div>
                        )}
                        {order.customer.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.customer.phone}
                          </div>
                        )}
                        {customerAddress && (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {customerAddress}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <div className="font-semibold mb-1">
                                  Shipping Address:
                                </div>
                                <div className="text-xs space-y-1">
                                  <div>{order.customer.address.street}</div>
                                  <div>
                                    {order.customer.address.city},{" "}
                                    {order.customer.address.state}{" "}
                                    {order.customer.address.zipCode}
                                  </div>
                                  <div>{order.customer.address.country}</div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(
                          order.status
                        )} font-medium`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(order.status)}
                        </span>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-semibold">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>

                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="font-mono">
                            {order.orderItems.length}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <div className="font-semibold mb-1">
                              Order Items:
                            </div>
                            {order.orderItems.slice(0, 3).map((item, index) => (
                              <div key={index} className="text-xs">
                                {item.quantity}x {item.product.name}
                              </div>
                            ))}
                            {order.orderItems.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{order.orderItems.length - 3} more...
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium truncate max-w-[120px]">
                          {order.placedBy.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {order.placedBy.id}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>View Order Details</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {/* View Details Option in Dropdown - ADDED */}
                            <DropdownMenuItem asChild>
                              <Link 
                                href={`/orders/${order.id}`}
                                className="flex items-center cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(order)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(order.id)}
                              className="text-destructive focus:text-destructive"
                              disabled={
                                order.status === "delivered" ||
                                order.status === "cancelled"
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {orders.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No orders found
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
