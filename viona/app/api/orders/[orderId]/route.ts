// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ensureOrganizationMember } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const { orderId } = params;

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Ensure user is organization member
    await ensureOrganizationMember(orgId);

    const order = await prisma.order.findFirst({
      where: {
        order_id: BigInt(orderId),
        org_id: BigInt(orgId),
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        placedBy: {
          select: {
            user_id: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            user_id: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Transform the data to match the interface
    const transformedOrder = {
      id: order.order_id.toString(),
      orderDate: order.order_date?.toISOString() || new Date().toISOString(),
      status: order.status || 'pending',
      totalAmount: Number(order.total_amount) || 0,
      notes: order.notes || '',
      shippingMethod: order.shipping_method || 'standard',
      paymentMethod: order.payment_method || 'credit_card',
      createdAt: order.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: order.updated_at?.toISOString() || new Date().toISOString(),
      customer: {
        name: order.customer_name || '',
        email: order.customer_email || '',
        phone: order.customer_phone || '',
        address: {
          street: order.shipping_street || '',
          city: order.shipping_city || '',
          state: order.shipping_state || '',
          zipCode: order.shipping_zip || '',
          country: order.shipping_country || 'USA',
        },
      },
      placedBy: {
        id: order.placedBy?.user_id.toString() || '',
        email: order.placedBy?.email || '',
      },
      updatedBy: order.updatedBy ? {
        id: order.updatedBy.user_id.toString(),
        email: order.updatedBy.email,
      } : undefined,
      orderItems: order.orderItems.map(item => ({
        id: item.order_item_id.toString(),
        productId: item.product_id.toString(),
        productName: item.product?.name || 'Unknown Product',
        productSku: item.product?.sku || 'N/A',
        quantity: item.quantity || 0,
        priceAtOrder: Number(item.price_at_order) || 0,
        subtotal: (item.quantity || 0) * (Number(item.price_at_order) || 0),
      })),
      financialBreakdown: {
        subtotal: order.orderItems.reduce((sum, item) => 
          sum + ((item.quantity || 0) * (Number(item.price_at_order) || 0)), 0),
        tax: 0, // Calculate if you have tax logic
        shipping: 0, // Calculate if you have shipping logic
        discount: 0, // Calculate if you have discount logic
        total: Number(order.total_amount) || 0,
      },
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
