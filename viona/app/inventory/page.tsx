// File: app/inventory/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ProductTable } from "./components/ProductTable";
import { AddProductDialog } from "./components/AddProductDialog";
import { InventoryFilters, FilterState } from "./components/InventoryFilters";
import DesktopSidebar from "@/components/DesktopSidebar";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchBar } from "@/components/SearchBar";
import { OrganizationSelector } from "@/app/organization/components/OrganizationSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Package, Plus } from "lucide-react";
import { addProduct, updateProduct, deleteProduct } from "./actions";
import { useOrgStore } from "@/hooks/useOrgStore";
import type { Product } from "../api/inventory/products/route";
import { LoadingSpinner } from "@/components/LoadingSpinner";


export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    stockFilter: "all",
  });

  // Get data from Zustand store - organizations are now loaded globally
  const { selectedOrgId, orgs, setSelectedOrgId } = useOrgStore();

  // Organization selection handler
  const selectOrganization = useCallback((orgId: string | null) => {
    setSelectedOrgId(orgId);
  }, [setSelectedOrgId]);

  // Auto-hide error after 5 seconds with smooth animation
  useEffect(() => {
    if (error) {
      setIsErrorVisible(true);
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
        // Remove error completely after animation
        setTimeout(() => setError(null), 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProducts = async () => {
    if (!selectedOrgId) {
      setProducts([]); // Clear products when no org selected
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/products?orgId=${selectedOrgId}`);
      if (!res.ok) {
        if (res.status === 404) {
          // No products found - this is not an error
          setProducts([]);
          return;
        }
        throw new Error(`Failed to fetch products: ${res.status}`);
      }
      
      const data: Product[] = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Fetch products error:', fetchError);
      setProducts([]);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedOrgId]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    let filtered = [...products];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.stockFilter !== "all") {
      filtered = filtered.filter((product) => {
        switch (filters.stockFilter) {
          case "inStock":
            return product.stock >= 10;
          case "lowStock":
            return product.stock > 0 && product.stock < 10;
          case "outOfStock":
            return product.stock === 0;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy];
      const bVal = b[filters.sortBy];
      let comparison = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [products, filters]);

  const handleAddProduct = async (newProduct: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    if (!selectedOrgId) {
      setError("Please select an organization first");
      return;
    }

    try {
      setError(null);
      await addProduct(selectedOrgId, newProduct);
      await fetchProducts(); // Refresh the products list
      setIsDialogOpen(false);
    } catch (addError) {
      console.error('Add product error:', addError);
      setError(addError instanceof Error ? addError.message : "Failed to add product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!selectedOrgId) {
      setError("Please select an organization first");
      return;
    }

    try {
      setError(null);
      await deleteProduct(selectedOrgId, id);
      await fetchProducts(); // Refresh the products list
    } catch (deleteError) {
      console.error('Delete product error:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product");
    }
  };

  const handleUpdateProduct = async (id: string, updatedProduct: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    if (!selectedOrgId) {
      setError("Please select an organization first");
      return;
    }

    try {
      setError(null);
      await updateProduct(selectedOrgId, id, updatedProduct);
      await fetchProducts(); // Refresh the products list
    } catch (updateError) {
      console.error('Update product error:', updateError);
      setError(updateError instanceof Error ? updateError.message : "Failed to update product");
    }
  };

  const dismissError = () => {
    setIsErrorVisible(false);
    setTimeout(() => setError(null), 300);
  };

  // Case 1: No organizations exist at all
  if (orgs.length === 0) {
    return (
      <div className="flex h-screen">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-screen">
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
          
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <Building2 className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
                <h2 className="text-3xl font-bold mb-4">Create an Organization to Get Started</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  You need to create an organization first before you can manage inventory. 
                  Organizations help you organize your products, orders, and team members.
                </p>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => window.location.href = '/organization'}
                    size="lg"
                    className="w-full"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Organization
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Once you create an organization, you can:</p>
                    <ul className="mt-2 space-y-1 text-left">
                      <li>• Add and manage products</li>
                      <li>• Track inventory levels</li>
                      <li>• Invite team members</li>
                      <li>• Process orders</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Organizations exist but none is selected
  if (!selectedOrgId) {
    return (
      <div className="flex h-screen">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-screen">
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
          <Separator />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Select an Organization</h2>
                <p className="text-muted-foreground mb-6">
                  You have {orgs.length} organization{orgs.length === 1 ? '' : 's'} available. 
                  Please select one from the dropdown above to manage your inventory.
                </p>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Available organizations:</p>
                    <ul className="mt-2 space-y-1">
                      {orgs.slice(0, 3).map((org) => (
                        <li key={org.id} className="truncate">
                          • {org.name} ({org.role})
                        </li>
                      ))}
                      {orgs.length > 3 && (
                        <li className="text-xs">... and {orgs.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Organization is selected - show inventory interface
  return (
    <div className="flex h-screen">
      <DesktopSidebar />
      <div className="flex flex-col flex-1 min-h-screen">
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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Error Alert with smooth animation */}
          {error && (
            <div 
              className={`transition-all duration-300 ease-in-out transform ${
                isErrorVisible 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 -translate-y-2 scale-95'
              }`}
            >
              <Alert variant="destructive" className="relative">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="pr-8">
                  {error}
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-red-100"
                  onClick={dismissError}
                >
                  <span className="text-red-600">×</span>
                </Button>
              </Alert>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            
            {/* Only show filters if we have products or are loading */}
            {(products.length > 0 || isLoading) && (
              <InventoryFilters
                filters={filters}
                onFiltersChange={setFilters}
                totalProducts={products.length}
                filteredCount={filteredProducts.length}
              />
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <LoadingSpinner/>
          ) : products.length === 0 ? (
            /* Empty State - No Products */
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md mx-auto">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by adding your first product to the inventory. You can track stock levels, prices, and manage your product catalog.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            </div>
          ) : (
            /* Products Table */
            <>
              {filteredProducts.length === 0 && products.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No products match your current filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      search: "",
                      sortBy: "name",
                      sortOrder: "asc",
                      stockFilter: "all",
                    })}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onDelete={handleDeleteProduct}
                  onUpdate={handleUpdateProduct}
                />
              )}
            </>
          )}

          <AddProductDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={handleAddProduct}
          />
        </div>
      </div>
    </div>
  );
}
