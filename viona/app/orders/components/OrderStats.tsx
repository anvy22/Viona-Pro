import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react";
import type { Order } from "../../api/orders/route";

interface OrderStatsProps {
  orders: Order[];
}

export function OrderStats({ orders }: OrderStatsProps) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const totalItems = orders.reduce((acc, order) => 
    acc + order.orderItems.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0
  );
  
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Items",
      value: totalItems.toLocaleString(),
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(averageOrderValue),
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const statusStats = [
    {
      status: "pending",
      count: statusCounts.pending || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      label: "Pending",
    },
    {
      status: "shipped",
      count: statusCounts.shipped || 0,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      label: "Shipped",
    },
    {
      status: "completed",
      count: statusCounts.completed || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      label: "Completed",
    },
    {
      status: "cancelled",
      count: statusCounts.cancelled || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      label: "Cancelled",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusStats.map((stat) => {
            const IconComponent = stat.icon;
            const percentage = totalOrders > 0 ? Math.round((stat.count / totalOrders) * 100) : 0;
            
            return (
              <div key={stat.status} className="text-center">
                <div className={`inline-flex items-center justify-center p-2 rounded-lg mb-2 ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-lg font-bold">{stat.count}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <Badge variant="outline" className="text-xs mt-1">
                  {percentage}%
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
