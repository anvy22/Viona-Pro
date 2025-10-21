import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, X, Calendar, SortAsc } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface FilterState {
  search: string;
  sortBy: "orderDate" | "totalAmount" | "status";
  sortOrder: "asc" | "desc";
  statusFilter: "all" | "pending" | "shipped" | "completed" | "cancelled";
  dateFrom: string | null;
  dateTo: string | null;
}

interface OrderFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalOrders: number;
  filteredCount: number;
}

export function OrderFilters({ 
  filters, 
  onFiltersChange, 
  totalOrders, 
  filteredCount 
}: OrderFiltersProps) {
  const hasActiveFilters = 
    filters.search !== "" ||
    filters.statusFilter !== "all" ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      sortBy: "orderDate",
      sortOrder: "desc",
      statusFilter: "all",
      dateFrom: null,
      dateTo: null,
    });
  };

  const clearDateRange = () => {
    onFiltersChange({
      ...filters,
      dateFrom: null,
      dateTo: null,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search Input */}
      <div className="relative min-w-[240px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders, products, or users..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9 pr-4"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, search: "" })}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Advanced Filters Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {[
                  filters.statusFilter !== "all" ? 1 : 0,
                  filters.dateFrom ? 1 : 0,
                  filters.dateTo && filters.dateFrom !== filters.dateTo ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filter Orders</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.statusFilter} 
                onValueChange={(value) => 
                  onFiltersChange({ ...filters, statusFilter: value as FilterState['statusFilter'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="shipped">🚚 Shipped</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Date Range</Label>
                {(filters.dateFrom || filters.dateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearDateRange}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => 
                      onFiltersChange({ ...filters, dateFrom: e.target.value || null })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => 
                      onFiltersChange({ ...filters, dateTo: e.target.value || null })
                    }
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort Options */}
      <Select 
        value={`${filters.sortBy}_${filters.sortOrder}`} 
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split('_') as [FilterState['sortBy'], FilterState['sortOrder']];
          onFiltersChange({ ...filters, sortBy, sortOrder });
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SortAsc className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="orderDate_desc">📅 Newest First</SelectItem>
          <SelectItem value="orderDate_asc">📅 Oldest First</SelectItem>
          <SelectItem value="totalAmount_desc">💰 Highest Amount</SelectItem>
          <SelectItem value="totalAmount_asc">💰 Lowest Amount</SelectItem>
          <SelectItem value="status_asc">📊 Status A-Z</SelectItem>
          <SelectItem value="status_desc">📊 Status Z-A</SelectItem>
        </SelectContent>
      </Select>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
        <Badge variant="outline" className="font-mono">
          {filteredCount}
        </Badge>
        {filteredCount !== totalOrders && (
          <>
            <span>of</span>
            <Badge variant="outline" className="font-mono">
              {totalOrders}
            </Badge>
          </>
        )}
        <span>orders</span>
      </div>
    </div>
  );
}
