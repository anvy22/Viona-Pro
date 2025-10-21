"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

export interface FilterState {
  search: string;
  sortBy: 'name' | 'sku' | 'stock' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  stockFilter: 'all' | 'inStock' | 'lowStock' | 'outOfStock';
}

interface InventoryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalProducts: number;
  filteredCount: number;
}

export function InventoryFilters({ 
  filters, 
  onFiltersChange, 
  totalProducts, 
  filteredCount 
}: InventoryFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      stockFilter: 'all',
    });
  };

  const hasActiveFilters = filters.search || filters.stockFilter !== 'all' || 
                          filters.sortBy !== 'name' || filters.sortOrder !== 'asc';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
         <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span className='text-white'>Filters:</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="updatedAt">Last Modified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => updateFilter('sortOrder', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          

          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.stockFilter}
              onValueChange={(value) => updateFilter('stockFilter', value)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="inStock">In Stock</SelectItem>
                <SelectItem value="lowStock">Low Stock</SelectItem>
                <SelectItem value="outOfStock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 whitespace-nowrap">
           {filteredCount} / {totalProducts} 
        </div>
      </div>
    </div>
  );
}