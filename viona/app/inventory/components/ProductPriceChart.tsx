// app/inventory/components/ProductPriceChart.tsx
"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  DollarSign, 
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Calendar
} from "lucide-react";

interface PriceHistory {
  id: string;
  retailPrice: number;
  actualPrice?: number;
  marketPrice?: number;
  validFrom: string;
  validTo?: string;
}

interface ProductPriceChartProps {
  priceHistory: PriceHistory[];
}

// Color scheme for the chart
const CHART_COLORS = {
  retail: '#2563eb',      // Blue for retail price
  actual: '#059669',      // Green for actual cost
  market: '#dc2626',      // Red for market price
  margin: '#7c3aed',      // Purple for margin
  variance: '#ea580c',    // Orange for variance
  trend: '#6b7280'        // Gray for trend lines
};

export function ProductPriceChart({ priceHistory }: ProductPriceChartProps) {
  const [timeRange, setTimeRange] = useState<string>("all");
  const [chartType, setChartType] = useState<"line" | "area" | "composed">("composed");
  const [showTrends, setShowTrends] = useState(true);

  // Process and prepare chart data
  const chartData = useMemo(() => {
    if (priceHistory.length === 0) return [];

    // Sort by date
    const sortedHistory = [...priceHistory].sort(
      (a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime()
    );

    // Filter by time range
    let filteredHistory = sortedHistory;
    if (timeRange !== "all") {
      const now = new Date();
      const daysBack = parseInt(timeRange);
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      filteredHistory = sortedHistory.filter(
        item => new Date(item.validFrom) >= cutoffDate
      );
    }

    return filteredHistory.map((item, index) => {
      const date = new Date(item.validFrom);
      const retailPrice = item.retailPrice || 0;
      const actualPrice = item.actualPrice || 0;
      const marketPrice = item.marketPrice || 0;
      
      // Calculate metrics
      const margin = actualPrice > 0 ? ((retailPrice - actualPrice) / retailPrice) * 100 : 0;
      const marketVariance = marketPrice > 0 ? ((retailPrice - marketPrice) / marketPrice) * 100 : 0;
      const competitivenessScore = marketPrice > 0 ? (retailPrice <= marketPrice ? 100 : Math.max(0, 100 - marketVariance)) : 50;

      // Previous values for trend calculation
      const prevItem = index > 0 ? filteredHistory[index - 1] : null;
      const retailTrend = prevItem ? retailPrice - (prevItem.retailPrice || 0) : 0;
      const actualTrend = prevItem ? actualPrice - (prevItem.actualPrice || 0) : 0;
      const marketTrend = prevItem ? marketPrice - (prevItem.marketPrice || 0) : 0;

      return {
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
        }),
        fullDate: date.toISOString(),
        retailPrice,
        actualPrice: actualPrice || null,
        marketPrice: marketPrice || null,
        margin,
        marketVariance,
        competitivenessScore,
        retailTrend,
        actualTrend,
        marketTrend,
        // Moving averages (7-period)
        retailMA: index >= 6 ? 
          filteredHistory.slice(Math.max(0, index - 6), index + 1)
            .reduce((sum, item) => sum + (item.retailPrice || 0), 0) / Math.min(7, index + 1) : null,
      };
    });
  }, [priceHistory, timeRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const retailPrices = chartData.map(d => d.retailPrice).filter(p => p > 0);
    const actualPrices = chartData.map(d => d.actualPrice).filter(p => p && p > 0) as number[];
    const marketPrices = chartData.map(d => d.marketPrice).filter(p => p && p > 0) as number[];
    
    const avgRetail = retailPrices.reduce((a, b) => a + b, 0) / retailPrices.length;
    const avgActual = actualPrices.length > 0 ? actualPrices.reduce((a, b) => a + b, 0) / actualPrices.length : 0;
    const avgMarket = marketPrices.length > 0 ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length : 0;
    
    const currentPrice = chartData[chartData.length - 1];
    const firstPrice = chartData[0];
    const priceChange = currentPrice.retailPrice - firstPrice.retailPrice;
    const priceChangePercent = (priceChange / firstPrice.retailPrice) * 100;
    
    const avgMargin = chartData
      .map(d => d.margin)
      .filter(m => m > 0)
      .reduce((a, b, _, arr) => a + b / arr.length, 0);

    // Volatility calculation (standard deviation of price changes)
    const priceChanges = chartData.slice(1).map((item, index) => 
      item.retailPrice - chartData[index].retailPrice
    );
    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const volatility = Math.sqrt(
      priceChanges.reduce((a, b) => a + Math.pow(b - avgChange, 2), 0) / priceChanges.length
    );

    return {
      avgRetail,
      avgActual,
      avgMarket,
      currentPrice: currentPrice.retailPrice,
      priceChange,
      priceChangePercent,
      avgMargin,
      volatility,
      dataPoints: chartData.length,
      timeSpan: `${Math.ceil((new Date(currentPrice.fullDate).getTime() - new Date(firstPrice.fullDate).getTime()) / (1000 * 60 * 60 * 24))} days`
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[250px]">
          <p className="font-medium mb-2">{label}</p>
          
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: entry.color }} 
                  />
                  <span>{entry.name}:</span>
                </div>
                <span className="font-medium">
                  {entry.name.includes('%') 
                    ? `${entry.value.toFixed(1)}%`
                    : `$${entry.value.toFixed(2)}`
                  }
                </span>
              </div>
            ))}
          </div>

          {data.margin > 0 && (
            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Profit Margin:</span>
                <span>{data.margin.toFixed(1)}%</span>
              </div>
              {data.marketVariance !== 0 && (
                <div className="flex justify-between">
                  <span>vs Market:</span>
                  <span className={data.marketVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                    {data.marketVariance > 0 ? '+' : ''}{data.marketVariance.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No price history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={(value: "line" | "area" | "composed") => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="composed">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showTrends ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTrends(!showTrends)}
          >
            <Activity className="h-4 w-4 mr-1" />
            Trends
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${statistics.currentPrice.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                statistics.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {statistics.priceChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {statistics.priceChangePercent.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.avgMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Margin</div>
              <div className="text-xs text-muted-foreground mt-1">
                ${(statistics.avgRetail - statistics.avgActual).toFixed(2)} profit
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${statistics.volatility.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Volatility</div>
              <div className="text-xs text-muted-foreground mt-1">
                Price stability
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.dataPoints}
              </div>
              <div className="text-sm text-muted-foreground">Data Points</div>
              <div className="text-xs text-muted-foreground mt-1">
                {statistics.timeSpan}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Price Trend Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                Retail
              </Badge>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                Cost
              </Badge>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                Market
              </Badge>
              {chartType === "composed" && (
                <Badge variant="outline" className="text-xs">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-1" />
                  Margin
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "composed" ? (
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    yAxisId="price"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <YAxis 
                    yAxisId="percentage"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Price lines */}
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="retailPrice"
                    stroke={CHART_COLORS.retail}
                    strokeWidth={3}
                    name="Retail Price"
                    dot={{ fill: CHART_COLORS.retail, r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="actualPrice"
                    stroke={CHART_COLORS.actual}
                    strokeWidth={2}
                    name="Cost Price"
                    dot={{ fill: CHART_COLORS.actual, r: 3 }}
                    connectNulls={false}
                    strokeDasharray="5 5"
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="marketPrice"
                    stroke={CHART_COLORS.market}
                    strokeWidth={2}
                    name="Market Price"
                    dot={{ fill: CHART_COLORS.market, r: 3 }}
                    connectNulls={false}
                    strokeDasharray="10 5"
                  />

                  {/* Margin bars */}
                  <Bar
                    yAxisId="percentage"
                    dataKey="margin"
                    fill={CHART_COLORS.margin}
                    name="Profit Margin %"
                    fillOpacity={0.3}
                  />

                  {/* Moving average */}
                  {showTrends && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="retailMA"
                      stroke={CHART_COLORS.trend}
                      strokeWidth={1}
                      name="7-Day Moving Avg"
                      dot={false}
                      connectNulls={false}
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Reference lines */}
                  {statistics && (
                    <>
                      <ReferenceLine 
                        yAxisId="price"
                        y={statistics.avgRetail} 
                        stroke={CHART_COLORS.retail} 
                        strokeDasharray="8 8"
                        strokeOpacity={0.5}
                        label={{ value: `Avg: $${statistics.avgRetail.toFixed(2)}`, position: "topRight" }}
                      />
                    </>
                  )}
                </ComposedChart>
              ) : chartType === "area" ? (
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="#6b7280"
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Area
                    type="monotone"
                    dataKey="marketPrice"
                    stackId="1"
                    stroke={CHART_COLORS.market}
                    fill={CHART_COLORS.market}
                    fillOpacity={0.2}
                    name="Market Price"
                  />
                  <Area
                    type="monotone"
                    dataKey="actualPrice"
                    stackId="2"
                    stroke={CHART_COLORS.actual}
                    fill={CHART_COLORS.actual}
                    fillOpacity={0.3}
                    name="Cost Price"
                  />
                  <Line
                    type="monotone"
                    dataKey="retailPrice"
                    stroke={CHART_COLORS.retail}
                    strokeWidth={3}
                    name="Retail Price"
                    dot={{ fill: CHART_COLORS.retail, r: 4 }}
                  />
                </ComposedChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="#6b7280"
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  <Line
                    type="monotone"
                    dataKey="retailPrice"
                    stroke={CHART_COLORS.retail}
                    strokeWidth={3}
                    name="Retail Price"
                    dot={{ fill: CHART_COLORS.retail, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualPrice"
                    stroke={CHART_COLORS.actual}
                    strokeWidth={2}
                    name="Cost Price"
                    dot={{ fill: CHART_COLORS.actual, r: 3 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="marketPrice"
                    stroke={CHART_COLORS.market}
                    strokeWidth={2}
                    name="Market Price"
                    dot={{ fill: CHART_COLORS.market, r: 3 }}
                    connectNulls={false}
                  />
                  
                  {/* Moving average trend */}
                  {showTrends && (
                    <Line
                      type="monotone"
                      dataKey="retailMA"
                      stroke={CHART_COLORS.trend}
                      strokeWidth={1}
                      name="Trend Line"
                      dot={false}
                      connectNulls={false}
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Price Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Range:</span>
                  <span>${Math.min(...chartData.map(d => d.retailPrice)).toFixed(2)} - ${Math.max(...chartData.map(d => d.retailPrice)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Price:</span>
                  <span>${statistics.avgRetail.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Change:</span>
                  <span className={statistics.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {statistics.priceChange >= 0 ? '+' : ''}${statistics.priceChange.toFixed(2)} ({statistics.priceChangePercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volatility:</span>
                  <span className={statistics.volatility < 2 ? 'text-green-600' : statistics.volatility < 5 ? 'text-yellow-600' : 'text-red-600'}>
                    ${statistics.volatility.toFixed(2)} ({statistics.volatility < 2 ? 'Low' : statistics.volatility < 5 ? 'Medium' : 'High'})
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profitability Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Margin:</span>
                  <span className={`${statistics.avgMargin >= 30 ? 'text-green-600' : statistics.avgMargin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {statistics.avgMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Cost:</span>
                  <span>${statistics.avgActual.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Profit:</span>
                  <span className="text-green-600">
                    ${(statistics.avgRetail - statistics.avgActual).toFixed(2)}
                  </span>
                </div>
                {statistics.avgMarket > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">vs Market:</span>
                    <span className={statistics.avgRetail <= statistics.avgMarket ? 'text-green-600' : 'text-red-600'}>
                      {statistics.avgRetail <= statistics.avgMarket ? 'Competitive' : 'Premium'}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
