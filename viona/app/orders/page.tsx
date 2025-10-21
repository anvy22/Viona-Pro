"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, Download } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchBar } from "@/components/SearchBar";
import { OrganizationSelector } from "@/app/organization/components/OrganizationSelector";
import { useOrgStore } from "@/hooks/useOrgStore";
import { OrderTable } from "./components/OrderTable";
import { AddOrderDialog } from "./components/AddOrderDialog";
import { OrderFilters, FilterState } from "./components/OrderFilters";
import { OrderStats } from "./components/OrderStats";
import { EmptyState } from "./components/EmptyState";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorAlert } from "./components/ErrorAlert";
import { BulkActionsBar } from "./components/BulkActionsBar";
import { addOrder, updateOrder, deleteOrder, bulkUpdateOrders } from "./actions";
import type { Order } from "../api/orders/route";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sortBy: "order_date",
    sortOrder: "desc",
    statusFilter: "all",
    dateFrom: null,
    dateTo: null,
  });

  const { selectedOrgId, orgs, setSelectedOrgId } = useOrgStore();

  const selectOrganization = useCallback((orgId: string | null) => {
    setSelectedOrgId(orgId);
    setSelectedOrderIds(new Set());
  }, [setSelectedOrgId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchOrders = useCallback(async (showRefreshing = false) => {
    if (!selectedOrgId) {
      setOrders([]);
      return;
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/orders?orgId=${selectedOrgId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.status} ${res.statusText}`);
      }
      const data: Order[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      
      if (showRefreshing) {
        toast.success("Orders refreshed successfully");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load orders.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    let filtered = [...orders];

    // Search filter
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter((order) =>
        order.id?.toString().includes(term) ||
        order.orderItems?.some((item) => 
          item.product?.name?.toLowerCase().includes(term)
        ) ||
        order.placedBy?.email?.toLowerCase().includes(term) ||
        order.customer?.name?.toLowerCase().includes(term) ||
        order.customer?.email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === filters.statusFilter);
    }

    // Date range
    if (filters.dateFrom) {
      filtered = filtered.filter((order) => 
        new Date(order.orderDate) >= new Date(filters.dateFrom!)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter((order) => 
        new Date(order.orderDate) <= new Date(filters.dateTo!)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (filters.sortBy === "orderDate") {
        aVal = a.orderDate;
        bVal = b.orderDate;
      } else if (filters.sortBy === "totalAmount") {
        aVal = a.totalAmount;
        bVal = b.totalAmount;
      } else {
        aVal = a[filters.sortBy as keyof Order];
        bVal = b[filters.sortBy as keyof Order];
      }
      
      let comparison = 0;
      if (filters.sortBy === "orderDate") {
        comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal || "").localeCompare(String(bVal || ""));
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [orders, filters]);

  const handleAddOrUpdateOrder = async (orderData: any) => {
    if (!selectedOrgId) {
      const errorMsg = "Please select an organization first.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setError(null);
      const isEditing = !!editingOrder;
      
      if (isEditing) {
        await updateOrder(selectedOrgId, editingOrder.id, orderData);
        toast.success("Order updated successfully");
      } else {
        await addOrder(selectedOrgId, orderData);
        toast.success("Order created successfully");
      }
      
      await fetchOrders();
      setIsDialogOpen(false);
      setEditingOrder(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save order.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!selectedOrgId) return;

    try {
      setError(null);
      await deleteOrder(selectedOrgId, id);
      await fetchOrders();
      setSelectedOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success("Order deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete order.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (!selectedOrgId || selectedOrderIds.size === 0) return;

    try {
      const updates = Array.from(selectedOrderIds).map(id => {
        const order = orders.find(o => o.id === id);
        return {
          id,
          data: {
            orderDate: order?.orderDate || new Date().toISOString(),
            status,
            totalAmount: order?.totalAmount || 0,
            orderItems: order?.orderItems || [],
          }
        };
      });

      await bulkUpdateOrders(selectedOrgId, updates);
      await fetchOrders();
      setSelectedOrderIds(new Set());
      toast.success(`Updated ${updates.length} orders successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update orders.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleExport = () => {
    // Basic CSV export functionality
    const csvData = filteredOrders.map(order => ({
      ID: order.id,
      Date: new Date(order.orderDate).toLocaleDateString(),
      Customer: order.customer.name,
      Email: order.customer.email,
      Status: order.status,
      Total: order.totalAmount,
      Items: order.orderItems.length,
    }));

    const csvString = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (orgs.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-0">
          <header className="flex items-center justify-between px-6 py-4 h-16  bg-background shrink-0">
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
              <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
              <p className="text-muted-foreground mb-4">
                You need to create or join an organization to manage orders.
              </p>
              <Button onClick={() => window.location.href = '/organization'}>
                Create Organization
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedOrgId) {
    return (
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-0">
          <header className="flex items-center justify-between px-6 py-4 h-16  bg-background shrink-0">
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
              <h2 className="text-xl font-semibold mb-2">Select Organization</h2>
              <p className="text-muted-foreground">
                Please select an organization to view and manage orders.
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
                disabled={false}
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
          <Separator/>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4 md:p-8 pt-6">
            {error && (
              <ErrorAlert 
                message={error} 
                onDismiss={() => setError(null)}
              />
            )}

            {/* Stats Cards */}
            {orders.length > 0 && (
              <OrderStats orders={orders} />
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  onClick={() => { 
                    setEditingOrder(null); 
                    setIsDialogOpen(true); 
                  }} 
                  disabled={isLoading}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => fetchOrders(true)}
                  disabled={isRefreshing}
                  className="shrink-0"
                >
                  <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {filteredOrders.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="shrink-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>

              <div className="shrink-0">
                {(orders.length > 0 || isLoading) && (
                  <OrderFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    totalOrders={orders.length}
                    filteredCount={filteredOrders.length}
                  />
                )}
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedOrderIds.size > 0 && (
              <BulkActionsBar
                selectedCount={selectedOrderIds.size}
                onStatusUpdate={handleBulkStatusUpdate}
                onClearSelection={() => setSelectedOrderIds(new Set())}
              />
            )}

            {/* Main Content */}
            {isLoading ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <EmptyState onAddOrder={() => setIsDialogOpen(true)} />
            ) : filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No orders match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters to find orders.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    search: "",
                    sortBy: "order_date",
                    sortOrder: "desc",
                    statusFilter: "all",
                    dateFrom: null,
                    dateTo: null,
                  })}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="pb-6">
                <OrderTable
                  orders={filteredOrders}
                  selectedIds={selectedOrderIds}
                  onSelectionChange={setSelectedOrderIds}
                  onDelete={handleDeleteOrder}
                  onEdit={handleEditOrder}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  onSort={(field, order) => setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }))}
                />
              </div>
            )}

            <AddOrderDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onSave={handleAddOrUpdateOrder}
              initialData={editingOrder}
              orgId={selectedOrgId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
