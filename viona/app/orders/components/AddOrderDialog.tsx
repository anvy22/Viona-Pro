import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Package, DollarSign, Calendar, User, Phone, MapPin, CreditCard, Truck, StickyNote, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  priceAtOrder: number;
}

interface CustomerInfo {
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
}

interface OrderData {
  orderDate: string;
  status: string;
  customer: CustomerInfo;
  orderItems: OrderItem[];
  totalAmount: number;
  notes?: string;
  shippingMethod?: string;
  paymentMethod?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  stock: number;
  price: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: OrderData) => void;
  initialData?: any;
  orgId: string;
}

export function AddOrderDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  initialData, 
  orgId 
}: AddOrderDialogProps) {
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Added submitting state
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Customer Information
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
  });

  // Additional order information
  const [notes, setNotes] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  // Fetch products
  useEffect(() => {
    if (!open || !orgId) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/inventory/products?orgId=${orgId}`);
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Permission denied. Please check your organization access.');
          } else if (res.status === 404) {
            throw new Error('Products API not found.');
          } else {
            throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
          }
        }
        
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (Array.isArray(data)) {
          setProducts(data);
          if (data.length === 0) {
            setError('No products found in your inventory. Please add products first.');
          }
        } else {
          throw new Error('Invalid response format from products API');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch products';
        setError(errorMsg);
        toast.error(errorMsg);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [open, orgId]);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setOrderDate(initialData.orderDate.split('T')[0]);
      setStatus(initialData.status);
      setItems(initialData.orderItems || []);
      setTotal(initialData.totalAmount || 0);
      setCustomer(initialData.customer || {
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
      });
      setNotes(initialData.notes || '');
      setShippingMethod(initialData.shippingMethod || 'standard');
      setPaymentMethod(initialData.paymentMethod || 'credit_card');
    } else {
      // Reset form when not editing
      setOrderDate(new Date().toISOString().split('T')[0]);
      setStatus("pending");
      setItems([]);
      setTotal(0);
      setCustomer({
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
      });
      setNotes('');
      setShippingMethod('standard');
      setPaymentMethod('credit_card');
    }
    setError(null);
    setSubmitting(false); // Reset submitting state when dialog opens/closes
    setSearchTerm("");
  }, [initialData, open]);

  // Calculate total when items change
  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + (item.quantity * item.priceAtOrder), 0);
    setTotal(Math.max(0, sum));
  }, [items]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = () => {
    if (products.length === 0) {
      setError("No products available to add");
      return;
    }
    
    setItems(prev => [...prev, { 
      product: { id: "", name: "", sku: "" },
      quantity: 1, 
      priceAtOrder: 0 
    }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    
    if (field === "product" && typeof value === "string") {
      const product = products.find((p) => p.id === value);
      
      if (product) {
        newItems[index].product = {
          id: product.id,
          name: product.name,
          sku: product.sku
        };
        newItems[index].priceAtOrder = product.price;
      }
    } else if (field === "quantity") {
      const qty = parseInt(value) || 0;
      newItems[index].quantity = Math.max(1, qty);
    } else if (field === "priceAtOrder") {
      const price = parseFloat(value) || 0;
      newItems[index].priceAtOrder = Math.max(0, price);
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateCustomer = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setCustomer(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setCustomer(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateCustomerInfo = () => {
    const errors = [];
    
    if (!customer.name.trim()) errors.push('Customer name is required');
    if (!customer.email.trim()) errors.push('Customer email is required');
    if (!customer.phone.trim()) errors.push('Customer phone is required');
    if (!customer.address.street.trim()) errors.push('Street address is required');
    if (!customer.address.city.trim()) errors.push('City is required');
    if (!customer.address.state.trim()) errors.push('State is required');
    if (!customer.address.zipCode.trim()) errors.push('ZIP code is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (customer.email && !emailRegex.test(customer.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Phone validation (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (customer.phone && !phoneRegex.test(customer.phone)) {
      errors.push('Please enter a valid phone number');
    }
    
    return errors;
  };

  const handleSave = async () => {
    if (submitting) return; // Prevent multiple submissions
    
    setError(null);
    setSubmitting(true);

    try {
      // Validate basic order info
      if (!orderDate) {
        setError("Please select an order date");
        return;
      }

      if (items.length === 0) {
        setError("Please add at least one item to the order");
        return;
      }

      // Validate customer information
      const customerErrors = validateCustomerInfo();
      if (customerErrors.length > 0) {
        setError(`Customer information errors: ${customerErrors.join(', ')}`);
        return;
      }

      // Validate order items
      const hasInvalidItems = items.some(item => 
        !item.product.id || 
        item.quantity <= 0 || 
        item.priceAtOrder < 0
      );

      if (hasInvalidItems) {
        setError("Please ensure all items have valid products, quantities, and prices");
        return;
      }

      // Check for duplicate products
      const productIds = items.map(item => item.product.id);
      const uniqueProductIds = new Set(productIds);
      if (productIds.length !== uniqueProductIds.size) {
        setError("Cannot add the same product multiple times. Please combine quantities.");
        return;
      }

      const orderData: OrderData = { 
        orderDate: new Date(orderDate).toISOString(),
        status, 
        customer,
        orderItems: items, 
        totalAmount: total,
        notes: notes.trim(),
        shippingMethod,
        paymentMethod,
      };

      await onSave(orderData);
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Failed to save order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if form is valid for button state
  const isFormValid = items.length > 0 && customer.name.trim() && customer.email.trim();
  const isDisabled = loading || submitting || !isFormValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {initialData ? "Edit Order" : "Create New Order"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="customer" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="order-info">Order Info</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Customer Information Tab */}
            <TabsContent value="customer" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Customer Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input
                        placeholder="Enter customer name"
                        value={customer.name}
                        onChange={(e) => updateCustomer('name', e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="customer@example.com"
                        value={customer.email}
                        onChange={(e) => updateCustomer('email', e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={customer.phone}
                        onChange={(e) => updateCustomer('phone', e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <h4 className="text-base font-semibold">Shipping Address</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Street Address *</Label>
                        <Input
                          placeholder="123 Main Street, Apt 4B"
                          value={customer.address.street}
                          onChange={(e) => updateCustomer('address.street', e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>City *</Label>
                          <Input
                            placeholder="New York"
                            value={customer.address.city}
                            onChange={(e) => updateCustomer('address.city', e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>State *</Label>
                          <Input
                            placeholder="NY"
                            value={customer.address.state}
                            onChange={(e) => updateCustomer('address.state', e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>ZIP Code *</Label>
                          <Input
                            placeholder="10001"
                            value={customer.address.zipCode}
                            onChange={(e) => updateCustomer('address.zipCode', e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select 
                          value={customer.address.country} 
                          onValueChange={(value) => updateCustomer('address.country', value)}
                          disabled={submitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USA">United States</SelectItem>
                            <SelectItem value="CAN">Canada</SelectItem>
                            <SelectItem value="MEX">Mexico</SelectItem>
                            <SelectItem value="GBR">United Kingdom</SelectItem>
                            <SelectItem value="DEU">Germany</SelectItem>
                            <SelectItem value="FRA">France</SelectItem>
                            <SelectItem value="IND">India</SelectItem>
                            <SelectItem value="AUS">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Order Items Tab */}
            <TabsContent value="items" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Order Items</Label>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={addItem} 
                      disabled={loading || products.length === 0 || submitting}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>

                  {loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading products...
                    </div>
                  )}

                  {!loading && products.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      No products available. Please add products to your inventory first.
                    </div>
                  )}

                  {items.length === 0 && products.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No items added yet. Click "Add Item" to start building your order.
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <Card key={index} className="p-3 bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                          {/* Product Selection */}
                          <div className="md:col-span-5">
                            <Label className="text-xs text-muted-foreground mb-1 block">Product</Label>
                            <Select 
                              value={item.product.id} 
                              onValueChange={(v) => updateItem(index, "product", v)}
                              disabled={submitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2">
                                  <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mb-2"
                                    disabled={submitting}
                                  />
                                </div>
                                {filteredProducts.length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    No products found
                                  </div>
                                ) : (
                                  filteredProducts.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      <div className="flex items-center justify-between w-full min-w-0">
                                        <div className="truncate mr-2">
                                          <div className="font-medium truncate">{p.name}</div>
                                          <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Badge variant="outline" className="text-xs">
                                            Stock: {p.stock}
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            ${p.price.toFixed(2)}
                                          </Badge>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              disabled={submitting}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.priceAtOrder}
                              onChange={(e) => updateItem(index, "priceAtOrder", e.target.value)}
                              disabled={submitting}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">Total</Label>
                            <div className="flex items-center h-9 px-3 py-1 border rounded-md bg-muted font-mono text-sm">
                              ${(item.quantity * item.priceAtOrder).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="md:col-span-1 flex items-end">
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={submitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {items.length > 0 && (
                    <Card className="p-4 bg-primary/5">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {items.length} items • {items.reduce((acc, item) => acc + item.quantity, 0)} total quantity
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">${total.toFixed(2)}</div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Order Info Tab */}
            <TabsContent value="order-info" className="space-y-4">
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Order Date
                    </Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={orderDate} 
                      onChange={(e) => setOrderDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus} disabled={submitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="confirmed">✅ Confirmed</SelectItem>
                        <SelectItem value="processing">⚙️ Processing</SelectItem>
                        <SelectItem value="shipped">🚚 Shipped</SelectItem>
                        <SelectItem value="delivered">📦 Delivered</SelectItem>
                        <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Order Summary */}
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Customer</div>
                    <div className="font-medium">{customer.name || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Items</div>
                    <div className="font-medium">{items.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Amount</div>
                    <div className="font-bold text-lg">${total.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">{status}</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Additional Information Tab */}
            <TabsContent value="additional" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Shipping & Payment</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shipping Method</Label>
                        <Select value={shippingMethod} onValueChange={setShippingMethod} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">📦 Standard Shipping (5-7 days)</SelectItem>
                            <SelectItem value="express">⚡ Express Shipping (2-3 days)</SelectItem>
                            <SelectItem value="overnight">🚀 Overnight Shipping (1 day)</SelectItem>
                            <SelectItem value="pickup">🏪 Store Pickup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          Payment Method
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                            <SelectItem value="debit_card">💳 Debit Card</SelectItem>
                            <SelectItem value="paypal">🟦 PayPal</SelectItem>
                            <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                            <SelectItem value="cash_on_delivery">💵 Cash on Delivery</SelectItem>
                            <SelectItem value="check">📄 Check</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5" />
                      <h4 className="text-base font-semibold">Order Notes</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Additional Notes (Optional)</Label>
                      <Textarea
                        placeholder="Enter any special instructions, delivery notes, or additional information..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={submitting}
                      />
                      <div className="text-xs text-muted-foreground">
                        {notes.length}/500 characters
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="shrink-0 gap-2 pt-4 border-t">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSave} 
            disabled={isDisabled}
          >
            {submitting 
              ? (initialData ? "Updating..." : "Creating...") 
              : (initialData ? "Update Order" : "Create Order")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}