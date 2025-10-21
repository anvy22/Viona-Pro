// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserRole, hasPermission } from '@/lib/auth';

export type Order = {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  // Customer Information
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
  // Internal tracking
  placedBy: {
    id: string;
    email: string;
  };
  orderItems: {
    id: string;
    product: {
      id: string;
      name: string;
      sku: string;
    };
    quantity: number;
    priceAtOrder: number;
  }[];
  // Additional order info
  notes?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get('orgId');
  
  if (!orgId) {
    console.log('Orders API: Missing orgId parameter');
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  console.log(`Orders API: Checking permissions for orgId: ${orgId}`);

  try {
    const role = await getUserRole(orgId);
    console.log(`Orders API: User role in org ${orgId}: ${role}`);
    
    if (!hasPermission(role, ['reader', 'writer', 'read-write', 'admin'])) {
      console.log(`Orders API: Permission denied for role: ${role}`);
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        debug: { role, orgId, requiredRoles: ['reader', 'writer', 'read-write', 'admin'] }
      }, { status: 403 });
    }

    console.log('Orders API: Fetching from database (cache disabled)');

    const bigOrgId = BigInt(orgId);
    console.log(`Orders API: Fetching orders for org: ${bigOrgId}`);
    
    const orders = await prisma.order.findMany({
      where: { org_id: bigOrgId },
      include: {
        orderItems: {
          include: { 
            product: { 
              select: { product_id: true, name: true, sku: true } 
            } 
          }
        },
        placedBy: { 
          select: { user_id: true, email: true } 
        },
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`Orders API: Found ${orders.length} orders from database`);

    const mappedOrders: Order[] = orders.map((o) => {
      // Type-safe access with fallbacks
      const orderData = o as any; // Temporary any cast to access potentially new fields
      
      return {
        id: o.order_id.toString(),
        orderDate: o.order_date?.toISOString() || new Date().toISOString(),
        status: o.status || 'pending',
        totalAmount: Number(o.total_amount || 0),
        customer: {
          name: orderData.customer_name || '',
          email: orderData.customer_email || '',
          phone: orderData.customer_phone || '',
          address: {
            street: orderData.shipping_street || '',
            city: orderData.shipping_city || '',
            state: orderData.shipping_state || '',
            zipCode: orderData.shipping_zip || '',
            country: orderData.shipping_country || 'USA',
          },
        },
        placedBy: {
          id: o.placedBy?.user_id.toString() || '',
          email: o.placedBy?.email || 'unknown',
        },
        orderItems: o.orderItems.map((item) => ({
          id: item.order_item_id.toString(),
          product: {
            id: item.product.product_id.toString(),
            name: item.product.name || '',
            sku: item.product.sku || '',
          },
          quantity: item.quantity || 0,
          priceAtOrder: Number(item.price_at_order || 0),
        })),
        notes: orderData.notes || '',
        shippingMethod: orderData.shipping_method || '',
        paymentMethod: orderData.payment_method || '',
        createdAt: o.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: o.updated_at?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json(mappedOrders, {
      headers: {
        'X-Cache': 'DISABLED',
        'X-DB-Count': mappedOrders.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Orders API error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
