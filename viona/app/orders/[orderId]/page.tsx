// app/orders/[orderId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import DesktopSidebar from "@/components/DesktopSidebar";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchBar } from "@/components/SearchBar";
import { OrganizationSelector } from "@/app/organization/components/OrganizationSelector";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Truck,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Edit,
  RefreshCw,
  FileText,
  CreditCard,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Package2,
  Receipt,
  Printer,
  Download,
  MessageSquare,
  History,
  Archive,
  Banknote,
  Calculator,
} from "lucide-react";
import { useOrgStore } from "@/hooks/useOrgStore";
import { toast } from "sonner";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Import actions (you'll need to create getOrderDetails)
import { updateOrder, deleteOrder } from "../actions";

// Enhanced Order Details Interface
interface OrderDetails {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes?: string;
  shippingMethod: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  placedBy: {
    id: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    email: string;
  };
  orderItems: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    priceAtOrder: number;
    subtotal: number;
  }>;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    notes?: string;
  }>;
  financialBreakdown: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
}

// Status configuration
const ORDER_STATUS_CONFIG = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
  confirmed: { label: "Confirmed", variant: "default" as const, icon: CheckCircle, color: "text-blue-600" },
  processing: { label: "Processing", variant: "default" as const, icon: Package, color: "text-blue-600" },
  shipped: { label: "Shipped", variant: "default" as const, icon: Truck, color: "text-purple-600" },
  delivered: { label: "default" as const, variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
  cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
  returned: { label: "Returned", variant: "outline" as const, icon: Archive, color: "text-orange-600" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { selectedOrgId, orgs, setSelectedOrgId } = useOrgStore();

  // Organization selection handler
  const selectOrganization = useCallback(
    (orgId: string | null) => {
      setSelectedOrgId(orgId);
    },
    [setSelectedOrgId]
  );

  // Fetch order details
  const fetchOrderDetails = useCallback(async (showLoading = true) => {
    if (!selectedOrgId || !orderId) {
      setOrder(null);
      return;
    }

    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}?orgId=${selectedOrgId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
      }
      const orderData: OrderDetails = await response.json();
      setOrder(orderData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load order details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [selectedOrgId, orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle order status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrgId || !orderId || !order) return;

    setIsUpdating(true);
    try {
      await updateOrder(selectedOrgId, orderId, {
        ...order,
        status: newStatus,
      });
      await fetchOrderDetails();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update order status";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = async () => {
    if (!selectedOrgId || !orderId || !order) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteOrder(selectedOrgId, orderId);
      toast.success("Order deleted successfully");
      window.location.href = "/orders";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete order";
      toast.error(errorMessage);
    }
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    return ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.pending;
  };

  // Print order
  const handlePrintOrder = () => {
    window.print();
  };

  // Export order as PDF/CSV (placeholder)
  const handleExportOrder = () => {
    // Implementation for export functionality
    toast.info("Export functionality coming soon");
  };

  // Handle no organizations
  if (orgs.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-0">
          <header className="flex items-center justify-between px-6 py-4 h-16 border-b bg-background shrink-0 gap-3">
            <BreadcrumbHeader />
            <div className="gap-4 flex items-center">
              <ModeToggle />
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="p-8 text-center max-w-md">
              <h2 className="text-xl font-semibold mb-2">
                No Organization Found
              </h2>
              <p className="text-muted-foreground mb-4">
                You need to create or join an organization to view orders.
              </p>
              <Button onClick={() => (window.location.href = "/organization")}>
                Create Organization
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Handle no selected organization
  if (!selectedOrgId) {
    return (
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-0">
          <header className="flex items-center justify-between px-6 py-4 h-16 border-b bg-background shrink-0">
            <BreadcrumbHeader />
            <div className="flex-1 max-w-xs mx-4">
              <OrganizationSelector
                organizations={orgs}
                selectedOrgId={selectedOrgId}
                onOrganizationSelect={selectOrganization}
                disabled={isLoading}
              />
            </div>
            <div className="gap-4 flex items-center">
              <ModeToggle />
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="p-8 text-center max-w-md">
              <h2 className="text-xl font-semibold mb-2">
                Select Organization
              </h2>
              <p className="text-muted-foreground">
                Please select an organization to view order details.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar />
      <div className="flex flex-col flex-1 min-h-0">
        {/* Fixed Header */}
        <header className="flex items-center justify-between px-6 py-4 h-[50px] w-full gap-4">
          <BreadcrumbHeader />
          <div className="flex-1 max-w-xs">
            <OrganizationSelector
              organizations={orgs}
              selectedOrgId={selectedOrgId}
              onOrganizationSelect={selectOrganization}
              disabled={isLoading}
            />
          </div>
          <SearchBar />
          <NotificationDropdown />
          <div className="gap-4 flex items-center">
            <ModeToggle />
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>
        <Separator />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4 md:p-8 pt-6">
            {/* Back Button & Actions */}
            <div className="flex items-center justify-between">
              <Link href="/orders">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Orders
                </Button>
              </Link>

              {order && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchOrderDetails()}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintOrder}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportOrder}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Link href={`/orders?edit=${orderId}`}>
                    <Button
                      variant="outline"
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteOrder}
                    className="gap-2"
                    disabled={order.status !== 'pending'}
                  >
                    <XCircle className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && <LoadingSpinner />}

            {/* Order Details */}
            {order && (
              <>
                {/* Order Header */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <Card className="xl:col-span-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">
                            Order #{order.id}
                          </CardTitle>
                          <CardDescription className="text-base">
                            Placed on {new Date(order.orderDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;
                            return (
                              <Badge variant={statusConfig.variant} className="gap-2">
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Key Metrics */}
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            ${order.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-300">
                            Total Amount
                          </div>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                          <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {order.orderItems.length}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-300">
                            Items
                          </div>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                          <Truck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <div className="text-lg font-bold text-purple-900 dark:text-purple-100 capitalize">
                            {order.shippingMethod}
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-300">
                            Shipping
                          </div>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                          <div className="text-lg font-bold text-orange-900 dark:text-orange-100 capitalize">
                            {order.paymentMethod.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-orange-600 dark:text-orange-300">
                            Payment
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Update Status</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
                            <Button
                              key={status}
                              variant={order.status === status ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusUpdate(status)}
                              disabled={isUpdating || order.status === status}
                              className="justify-start gap-2"
                            >
                              <config.icon className="h-3 w-3" />
                              {config.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs Content */}
                <Card>
                  <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="items">Order Items</TabsTrigger>
                        <TabsTrigger value="customer">Customer</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Order Information */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Order Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Order ID</p>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    #{order.id}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Status</p>
                                  <Badge variant={getStatusConfig(order.status).variant} className="gap-2">
                                    {(() => {
                                      const StatusIcon = getStatusConfig(order.status).icon;
                                      return <StatusIcon className="h-3 w-3" />;
                                    })()}
                                    {getStatusConfig(order.status).label}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Order Date</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Total Amount</p>
                                  <p className="text-sm font-bold text-green-600">
                                    ${order.totalAmount.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-sm font-medium">Notes</p>
                                <ScrollArea className="h-20">
                                  <p className="text-sm text-muted-foreground">
                                    {order.notes || "No notes available"}
                                  </p>
                                </ScrollArea>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Audit Trail */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Audit Trail
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Placed By</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.placedBy.email}
                                </p>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Created At</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Separator />
                              {order.updatedBy && (
                                <>
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Last Updated By</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.updatedBy.email}
                                    </p>
                                  </div>
                                  <Separator />
                                </>
                              )}
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Last Updated</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.updatedAt).toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Order Items Tab */}
                      <TabsContent value="items" className="space-y-6 mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <ShoppingCart className="h-5 w-5" />
                              Order Items ({order.orderItems.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {order.orderItems.map((item, index) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                      <Package2 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                      <Link
                                        href={`/inventory/${item.productId}`}
                                        className="font-medium hover:underline"
                                      >
                                        {item.productName}
                                      </Link>
                                      <p className="text-sm text-muted-foreground">
                                        SKU: {item.productSku}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right space-y-1">
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-muted-foreground">
                                        Qty: {item.quantity}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        @ ${item.priceAtOrder.toFixed(2)}
                                      </span>
                                      <span className="font-medium">
                                        ${item.subtotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Customer Tab */}
                      <TabsContent value="customer" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Customer Information */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{order.customer.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span>{order.customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{order.customer.phone}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Shipping Address */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Shipping Address
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p className="font-medium">{order.customer.name}</p>
                                <p>{order.customer.address.street}</p>
                                <p>
                                  {order.customer.address.city}, {order.customer.address.state}{" "}
                                  {order.customer.address.zipCode}
                                </p>
                                <p>{order.customer.address.country}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Financial Tab */}
                      <TabsContent value="financial" className="space-y-6 mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Calculator className="h-5 w-5" />
                              Financial Breakdown
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {order.financialBreakdown ? (
                              <div className="space-y-4">
                                <div className="flex justify-between py-2">
                                  <span>Subtotal:</span>
                                  <span>${order.financialBreakdown.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                  <span>Tax:</span>
                                  <span>${order.financialBreakdown.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                  <span>Shipping:</span>
                                  <span>${order.financialBreakdown.shipping.toFixed(2)}</span>
                                </div>
                                {order.financialBreakdown.discount > 0 && (
                                  <div className="flex justify-between py-2 text-green-600">
                                    <span>Discount:</span>
                                    <span>-${order.financialBreakdown.discount.toFixed(2)}</span>
                                  </div>
                                )}
                                <Separator />
                                <div className="flex justify-between py-2 font-bold text-lg">
                                  <span>Total:</span>
                                  <span>${order.financialBreakdown.total.toFixed(2)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Simple breakdown based on order items */}
                                <div className="flex justify-between py-2">
                                  <span>Items Subtotal:</span>
                                  <span>
                                    ${order.orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                                  </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between py-2 font-bold text-lg">
                                  <span>Total:</span>
                                  <span>${order.totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* History Tab */}
                      <TabsContent value="history" className="space-y-6 mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <History className="h-5 w-5" />
                              Order History
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {order.statusHistory && order.statusHistory.length > 0 ? (
                              <div className="space-y-4">
                                {order.statusHistory.map((entry, index) => (
                                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline">{entry.status}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {new Date(entry.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Updated by {entry.updatedBy}
                                      </p>
                                      {entry.notes && (
                                        <p className="text-sm mt-2">{entry.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">No status history available</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
