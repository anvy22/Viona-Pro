// app/inventory/[productId]/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  Warehouse,
  History,
  TrendingUp,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  Activity,
  ShoppingCart,
  AlertCircle,
  Image as ImageIcon,
  BarChart3,
  PieChart,
  LineChart,
  Plus,
  Minus,
  RefreshCw,
  BaggageClaim,
  Settings,
  Info,
  Target,
  Zap,
  Eye,
  TrendingDown,
  Percent,
} from "lucide-react";
import { useOrgStore } from "@/hooks/useOrgStore";
import { toast } from "sonner";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ImageUpload } from "@/components/ui/image-upload";

// Enhanced Chart Components with Recharts
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

import {
  getProductDetails,
  updateProductDetails,
  deleteProductDetails,
  updateProductStock,
  transferStock,
  getWarehouseList,
} from "../actions";
import { EditProductDialog } from "../components/EditProductDialog";
import { StockTransferDialog } from "../components/StockTransferDialog";
import { RecentOrdersTable } from "../components/RecentOrdersTable";

// Updated interface with proper pricing structure
interface ProductDetails {
  id: string;
  name: string;
  sku: string;
  description?: string;
  image?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
  };
  modifiedBy?: {
    id: string;
    email: string;
  };
  warehouses: Array<{
    id: string;
    name: string;
    address?: string;
    stock: number;
    capacity?: number;
    lastUpdated?: string;
  }>;
  priceHistory: Array<{
    id: string;
    retailPrice: number;
    actualPrice?: number;
    marketPrice?: number;
    validFrom: string;
    validTo?: string;
  }>;
  recentOrders: Array<{
    orderId: string;
    orderDate: string;
    customerName: string;
    quantity: number;
    priceAtOrder: number;
    status: string;
  }>;
  totalStock: number;
  currentPrice: number;
  // Add current pricing fields
  currentActualPrice?: number;
  currentMarketPrice?: number;
  lowStockThreshold: number;
  stockMovements?: Array<{
    date: string;
    type: "in" | "out" | "transfer";
    quantity: number;
    warehouse: string;
    reason: string;
  }>;
  performanceMetrics?: {
    turnoverRate: number;
    avgOrderQuantity: number;
    reorderPoint: number;
    daysUntilStockout: number;
    profitMargin?: number;
    competitiveAdvantage?: number;
  };
}

interface WarehouseOption {
  id: string;
  name: string;
  address?: string;
}

// Chart color schemes
const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#8dd1e1",
  "#d084d0",
  "#87ceeb",
  "#ffb6c1",
  "#32cd32",
  "#ff6347",
];

const STOCK_COLORS = {
  good: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
  empty: "#6b7280",
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.productId as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockTransferOpen, setIsStockTransferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const { selectedOrgId, orgs, setSelectedOrgId } = useOrgStore();

  // Organization selection handler
  const selectOrganization = useCallback(
    (orgId: string | null) => {
      setSelectedOrgId(orgId);
    },
    [setSelectedOrgId]
  );

  // Enhanced function to get current pricing from price history
  const getCurrentPricingData = useCallback((product: ProductDetails) => {
    const latestPrice = product.priceHistory
      .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())
      [0];
    
    return {
      retailPrice: product.currentPrice,
      actualPrice: product.currentActualPrice || latestPrice?.actualPrice || 0,
      marketPrice: product.currentMarketPrice || latestPrice?.marketPrice || 0,
    };
  }, []);

  // Enhanced function to calculate profit metrics
  const calculateProfitMetrics = useCallback((product: ProductDetails) => {
    const pricing = getCurrentPricingData(product);
    
    const profitMargin = pricing.actualPrice 
      ? ((pricing.retailPrice - pricing.actualPrice) / pricing.retailPrice) * 100
      : 0;
      
    const competitiveAdvantage = pricing.marketPrice && pricing.marketPrice > 0
      ? ((pricing.marketPrice - pricing.retailPrice) / pricing.marketPrice) * 100
      : 0;
    
    return { profitMargin, competitiveAdvantage };
  }, [getCurrentPricingData]);

  // Fetch product details and warehouse list
  const fetchProductDetails = useCallback(async (showLoading = true) => {
    if (!selectedOrgId || !productId) {
      setProduct(null);
      return;
    }

    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [productData, warehouseData] = await Promise.all([
        getProductDetails(selectedOrgId, productId),
        getWarehouseList(selectedOrgId),
      ]);

      // Enhance product data with current pricing from price history if not directly available
      if (productData && productData.priceHistory.length > 0 && !productData.currentActualPrice) {
        const latestPrice = productData.priceHistory
          .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())
          [0];
        
        productData.currentActualPrice = latestPrice?.actualPrice;
        productData.currentMarketPrice = latestPrice?.marketPrice;
      }

      setProduct(productData);
      setWarehouses(warehouseData || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load product details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [selectedOrgId, productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // Handle product update
  const handleUpdateProduct = async (updatedData: any) => {
    if (!selectedOrgId || !productId) return;

    try {
      await updateProductDetails(selectedOrgId, productId, updatedData);
      await fetchProductDetails();
      setIsEditDialogOpen(false);
      toast.success("Product updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update product";
      toast.error(errorMessage);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!selectedOrgId || !productId) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteProductDetails(selectedOrgId, productId);
      toast.success("Product deleted successfully");
      window.location.href = "/inventory";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete product";
      toast.error(errorMessage);
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (
      !selectedOrgId ||
      !productId ||
      !selectedWarehouse ||
      stockAdjustment === 0
    )
      return;

    setIsUpdatingStock(true);
    try {
      await updateProductStock(
        selectedOrgId,
        productId,
        selectedWarehouse,
        stockAdjustment
      );
      await fetchProductDetails();
      setStockAdjustment(0);
      setSelectedWarehouse("");
      toast.success("Stock updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update stock";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Get stock status with enhanced logic
  const getStockStatus = (stock: number, threshold: number = 10) => {
    if (stock === 0)
      return {
        status: "Out of Stock",
        color: "destructive" as const,
        bgColor: STOCK_COLORS.empty,
      };
    if (stock < threshold)
      return {
        status: "Low Stock",
        color: "warning" as const,
        bgColor: STOCK_COLORS.critical,
      };
    if (stock < threshold * 2)
      return {
        status: "Moderate",
        color: "default" as const,
        bgColor: STOCK_COLORS.warning,
      };
    return {
      status: "In Stock",
      color: "default" as const,
      bgColor: STOCK_COLORS.good,
    };
  };

  // Prepare chart data with enhanced pricing
  const prepareStockChartData = () => {
    if (!product) return [];
    return product.warehouses.map((warehouse) => ({
      name: warehouse.name,
      stock: warehouse.stock,
      percentage: (warehouse.stock / product.totalStock) * 100,
      capacity: warehouse.capacity || 1000,
      utilization: warehouse.capacity
        ? (warehouse.stock / warehouse.capacity) * 100
        : 0,
    }));
  };

  const preparePriceChartData = () => {
    if (!product) return [];
    return product.priceHistory
      .sort(
        (a, b) =>
          new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime()
      )
      .map((price) => ({
        date: new Date(price.validFrom).toLocaleDateString(),
        retailPrice: price.retailPrice,
        actualPrice: price.actualPrice || 0,
        marketPrice: price.marketPrice || 0,
        margin: price.actualPrice
          ? ((price.retailPrice - price.actualPrice) / price.retailPrice) * 100
          : 0,
        competitiveGap: price.marketPrice 
          ? price.marketPrice - price.retailPrice
          : 0,
      }));
  };

  const prepareOrderTrendData = () => {
    if (!product) return [];

    // Group orders by month
    const monthlyOrders = product.recentOrders.reduce((acc: any, order) => {
      const month = new Date(order.orderDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      if (!acc[month]) {
        acc[month] = { month, quantity: 0, revenue: 0, orders: 0 };
      }
      acc[month].quantity += order.quantity;
      acc[month].revenue += order.quantity * order.priceAtOrder;
      acc[month].orders += 1;
      return acc;
    }, {});

    return Object.values(monthlyOrders).sort(
      (a: any, b: any) =>
        new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  };

  // Enhanced UI components
  const StockDistributionChart = () => {
    const data = prepareStockChartData();

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) =>
                `${name} (${percentage.toFixed(1)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="stock"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4">
          {data.map((warehouse, index) => (
            <Card key={warehouse.name} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span className="font-medium text-sm">{warehouse.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{warehouse.stock}</div>
                  <div className="text-xs text-muted-foreground">
                    {warehouse.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const PriceHistoryChart = () => {
    const data = preparePriceChartData();

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="price" label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="margin" orientation="right" label={{ value: 'Margin (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'margin') return [`${Number(value).toFixed(1)}%`, 'Profit Margin'];
              if (name === 'competitiveGap') return [`$${Number(value).toFixed(2)}`, 'vs Market Price'];
              return [`$${Number(value).toFixed(2)}`, name];
            }}
          />
          <Legend />
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="marketPrice"
            stackId="1"
            stroke="#ff7300"
            fill="#ff7300"
            fillOpacity={0.3}
            name="Market Price"
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="retailPrice"
            stroke="#8884d8"
            strokeWidth={3}
            name="Retail Price"
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="actualPrice"
            stroke="#82ca9d"
            strokeWidth={2}
            name="Actual Cost"
          />
          <Bar
            yAxisId="margin"
            dataKey="margin"
            fill="#ffc658"
            fillOpacity={0.6}
            name="Profit Margin"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const OrderTrendChart = () => {
    const data = prepareOrderTrendData();

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="quantity" />
          <YAxis yAxisId="revenue" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="quantity" dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#ff7300"
            strokeWidth={2}
            name="Revenue ($)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
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
                You need to create or join an organization to view products.
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
                Please select an organization to view product details.
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
              <Link href="/inventory">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Inventory
                </Button>
              </Link>

              {product && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsStockTransferOpen(true)}
                    className="gap-2"
                  >
                    <BaggageClaim className="h-4 w-4" />
                    Transfer Stock
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProduct}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
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

            {/* Product Details */}
            {product && (
              <>
                {/* Enhanced Product Header */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <Card className="xl:col-span-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-base">
                            SKU: {product.sku}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const stockStatus = getStockStatus(
                              product.totalStock,
                              product.lowStockThreshold
                            );
                            return (
                              <Badge variant={stockStatus.color}>
                                {stockStatus.status}
                              </Badge>
                            );
                          })()}
                          <Badge variant="outline" className="capitalize">
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Enhanced Key Metrics with Pricing */}
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                          <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {product.totalStock.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-300">
                            Total Stock
                          </div>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            ${product.currentPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-300">
                            Retail Price
                          </div>
                        </div>

                        {/* New: Actual Price */}
                        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg">
                          <TrendingDown className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                            ${getCurrentPricingData(product).actualPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-300">
                            Actual Cost
                          </div>
                        </div>

                        {/* New: Market Price */}
                        <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                          <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                            ${getCurrentPricingData(product).marketPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-indigo-600 dark:text-indigo-300">
                            Market Price
                          </div>
                        </div>

                        {/* New: Profit Margin */}
                        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg">
                          <Percent className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {calculateProfitMetrics(product).profitMargin.toFixed(1)}%
                          </div>
                          <div className="text-sm text-emerald-600 dark:text-emerald-300">
                            Profit Margin
                          </div>
                        </div>

                      </div>

                      {/* Additional Price Comparison Row */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                          <Warehouse className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                          <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                            {product.warehouses.length}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-300">
                            Warehouses
                          </div>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                          <ShoppingCart className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                          <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                            {product.recentOrders.length}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-300">
                            Recent Orders
                          </div>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg">
                          <Target className="h-6 w-6 mx-auto mb-1 text-red-600" />
                          <div className="text-lg font-bold text-red-900 dark:text-red-100">
                            {calculateProfitMetrics(product).competitiveAdvantage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-300">
                            vs Market
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Product Image & Quick Actions */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Product Image Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Product Image
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {product.image ? "Uploaded" : "No Image"}
                            </Badge>
                          </div>

                          {/* ImageUpload Component Integration */}
                          <div className="relative rounded-md ">
                            <ImageUpload
                              value={product.image || ""}
                              onChange={async (imageUrl) => {
                                setIsImageUploading(true);
                                try {
                                  await updateProductDetails(
                                    selectedOrgId!,
                                    productId!,
                                    { image: imageUrl }
                                  );
                                  await fetchProductDetails(false);
                                  toast.success("Image uploaded successfully");
                                } catch (error) {
                                  toast.error("Failed to update product image");
                                  console.error("Image update error:", error);
                                } finally {
                                  setIsImageUploading(false);
                                }
                              }}
                              onRemove={async () => {
                                setIsImageUploading(true);
                                try {
                                  await updateProductDetails(
                                    selectedOrgId!,
                                    productId!,
                                    { image: "" }
                                  );
                                  await fetchProductDetails(false);
                                  toast.success("Product image removed successfully");
                                } catch (error) {
                                  toast.error("Failed to remove product image");
                                } finally {
                                  setIsImageUploading(false);
                                }
                              }}
                              disabled={isImageUploading}
                              maxSizeInMB={5}
                              acceptedFormats={[
                                "image/jpeg",
                                "image/png",
                                "image/webp",
                              ]}
                              showPreview={true}
                              uploadPreset="viona_products"
                              className="w-full"
                            />
                            {isImageUploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                                <LoadingSpinner />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Performance Indicators with Pricing */}
                        {product.performanceMetrics && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Performance Metrics
                            </Label>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium">
                                    Turnover Rate
                                  </span>
                                </div>
                                <span className="font-bold text-blue-700 dark:text-blue-300">
                                  {product.performanceMetrics.turnoverRate.toFixed(
                                    1
                                  )}
                                  %
                                </span>
                              </div>

                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium">
                                    Reorder Point
                                  </span>
                                </div>
                                <span className="font-bold text-green-700 dark:text-green-300">
                                  {product.performanceMetrics.reorderPoint}{" "}
                                  units
                                </span>
                              </div>

                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-medium">
                                    Days Until Stockout
                                  </span>
                                </div>
                                <span
                                  className={`font-bold ${
                                    product.performanceMetrics
                                      .daysUntilStockout < 30
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {product.performanceMetrics.daysUntilStockout}{" "}
                                  days
                                </span>
                              </div>

                              {/* New: Profit Margin Indicator */}
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Percent className="h-4 w-4 text-emerald-600" />
                                  <span className="text-sm font-medium">
                                    Current Margin
                                  </span>
                                </div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                  {calculateProfitMetrics(product).profitMargin.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Tabs with Charts */}
                <Card>
                  <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="stock">
                          Stock Management
                        </TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Enhanced Product Information with Pricing */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Product Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">
                                    Product ID
                                  </p>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {product.id}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">SKU</p>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {product.sku}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Status</p>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {product.status}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">
                                    Low Stock Alert
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {product.lowStockThreshold} units
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              {/* Enhanced Pricing Information */}
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Current Pricing</p>
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-green-600" />
                                      Retail Price
                                    </span>
                                    <span className="font-bold text-green-700 dark:text-green-300">
                                      ${product.currentPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                      <TrendingDown className="h-4 w-4 text-yellow-600" />
                                      Actual Cost
                                    </span>
                                    <span className="font-bold text-yellow-700 dark:text-yellow-300">
                                      ${getCurrentPricingData(product).actualPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                                      Market Price
                                    </span>
                                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                      ${getCurrentPricingData(product).marketPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                      <Percent className="h-4 w-4 text-emerald-600" />
                                      Profit Margin
                                    </span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                      {calculateProfitMetrics(product).profitMargin.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Description
                                </p>
                                <ScrollArea className="h-20">
                                  <p className="text-sm text-muted-foreground">
                                    {product.description ||
                                      "No description available"}
                                  </p>
                                </ScrollArea>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Audit Trail */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Audit Trail
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Created By
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {product.createdBy.email}
                                </p>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Created At
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(product.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Separator />
                              {product.modifiedBy && (
                                <>
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">
                                      Last Modified By
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {product.modifiedBy.email}
                                    </p>
                                  </div>
                                  <Separator />
                                </>
                              )}
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Last Updated
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(product.updatedAt).toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Enhanced Stock Management Tab */}
                      <TabsContent value="stock" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Stock Distribution Chart */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Stock Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <StockDistributionChart />
                            </CardContent>
                          </Card>

                          {/* Warehouse Details */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Warehouse className="h-5 w-5" />
                                Warehouse Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {product.warehouses.map((warehouse) => {
                                  const stockStatus = getStockStatus(
                                    warehouse.stock
                                  );
                                  const utilizationRate = warehouse.capacity
                                    ? (warehouse.stock / warehouse.capacity) *
                                      100
                                    : 0;

                                  return (
                                    <div
                                      key={warehouse.id}
                                      className="p-4 border rounded-lg space-y-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                          <p className="font-medium">
                                            {warehouse.name}
                                          </p>
                                          {warehouse.address && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {warehouse.address}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right space-y-1">
                                          <p className="font-bold text-lg">
                                            {warehouse.stock}
                                          </p>
                                          <Badge
                                            variant={stockStatus.color}
                                            className="text-xs"
                                          >
                                            {stockStatus.status}
                                          </Badge>
                                        </div>
                                      </div>

                                      {warehouse.capacity && (
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-sm">
                                            <span>Capacity Utilization</span>
                                            <span>
                                              {utilizationRate.toFixed(1)}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                              className={`h-2 rounded-full transition-all ${
                                                utilizationRate > 90
                                                  ? "bg-red-500"
                                                  : utilizationRate > 75
                                                  ? "bg-yellow-500"
                                                  : "bg-green-500"
                                              }`}
                                              style={{
                                                width: `${Math.min(
                                                  utilizationRate,
                                                  100
                                                )}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex gap-2">
                                        <Link
                                          href={`/warehouses/${warehouse.id}`}
                                          className="flex-1"
                                        >
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                          </Button>
                                        </Link>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedWarehouse(warehouse.id);
                                            setIsStockTransferOpen(true);
                                          }}
                                        >
                                          <BaggageClaim className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Enhanced Analytics Tab */}
                      <TabsContent value="analytics" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {/* Enhanced Price Trends */}
                          <Card className="xl:col-span-2">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <LineChart className="h-5 w-5" />
                                Price History & Margin Analysis
                              </CardTitle>
                              <CardDescription>
                                Track pricing trends, profit margins, and competitive positioning over time
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <PriceHistoryChart />
                            </CardContent>
                          </Card>

                          {/* Order Trends */}
                          <Card className="xl:col-span-2">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Order Trends & Revenue
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <OrderTrendChart />
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Enhanced Orders Tab */}
                      <TabsContent value="orders" className="space-y-6 mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Recent Orders
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RecentOrdersTable orders={product.recentOrders} />
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Settings Tab */}
                      <TabsContent value="settings" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Inventory Settings
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>Low Stock Threshold</Label>
                                <Input
                                  type="number"
                                  value={product.lowStockThreshold}
                                  placeholder="Enter threshold"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Reorder Quantity</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter reorder quantity"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="electronics">
                                      Electronics
                                    </SelectItem>
                                    <SelectItem value="clothing">
                                      Clothing
                                    </SelectItem>
                                    <SelectItem value="food">
                                      Food & Beverages
                                    </SelectItem>
                                    <SelectItem value="books">Books</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button className="w-full">Save Settings</Button>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Performance Targets
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>Target Turnover Rate (%)</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter target rate"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Maximum Stock Days</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter maximum days"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Minimum Margin (%)</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter minimum margin"
                                />
                              </div>
                              <Button className="w-full">Update Targets</Button>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Enhanced Dialogs */}
            <EditProductDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              onSave={handleUpdateProduct}
              initialData={product ? {
                ...product,
                // Pass current pricing data to the dialog
                actualPrice: getCurrentPricingData(product).actualPrice,
                marketPrice: getCurrentPricingData(product).marketPrice,
              } : null}
            />

            <StockTransferDialog
              open={isStockTransferOpen}
              onOpenChange={setIsStockTransferOpen}
              productId={productId}
              orgId={selectedOrgId}
              warehouses={warehouses}
              onSuccess={fetchProductDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
