// app/orders/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserRole, hasPermission, ensureOrganizationMember } from '@/lib/auth'; 
import { revalidatePath } from 'next/cache';

// Cache user lookup to avoid repeated queries
async function getOrCreateUser(userId: string) {
  let user = await prisma.user.findUnique({ 
    where: { clerk_id: userId },
    select: { user_id: true, email: true, clerk_id: true }
  });
  
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      throw new Error('Unable to get user email from Clerk');
    }
    
    user = await prisma.user.create({
      data: { 
        clerk_id: userId, 
        email: clerkUser.emailAddresses[0].emailAddress
      },
      select: { user_id: true, email: true, clerk_id: true }
    });
  }
  
  return user;
}

async function getOrCreateDefaultWarehouse(orgId: BigInt) {
  let warehouse = await prisma.warehouse.findFirst({
    where: { org_id: Number(orgId)},
    select: { warehouse_id: true, name: true }
  });
  
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        org_id: Number(orgId),
        name: 'Default Warehouse',
        address: 'Default Address',
      },
      select: { warehouse_id: true, name: true }
    });
  }
  
  return warehouse;
}

export async function addOrder(orgId: string, newOrder: any) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  
  // Input validation
  if (!orgId) throw new Error('Organization ID is required');
  if (!newOrder) throw new Error('Order data is required');
  if (!newOrder.orderDate) throw new Error('Order date is required');
  if (!newOrder.status?.trim()) throw new Error('Order status is required');
  if (!newOrder.orderItems || newOrder.orderItems.length === 0) throw new Error('At least one order item is required');
  
  // Customer information validation
  if (!newOrder.customer) throw new Error('Customer information is required');
  if (!newOrder.customer.name?.trim()) throw new Error('Customer name is required');
  if (!newOrder.customer.email?.trim()) throw new Error('Customer email is required');
  if (!newOrder.customer.phone?.trim()) throw new Error('Customer phone is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    console.log(`addOrder: Retrieved role "${role}" (type: ${typeof role}) for orgId ${orgId}`);
    
    // Permission check with explicit role validation
    if (!role || !hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error(`Insufficient permissions to add orders. Current role: "${role}"`);
    }

    // Get or create user record
    const user = await getOrCreateUser(userId);
    
    // Sanitize input data
    const orderDate = new Date(newOrder.orderDate);
    const trimmedStatus = newOrder.status.trim();
    const totalAmount = newOrder.totalAmount;

    // Validate order items
    for (const item of newOrder.orderItems) {
      if (!item.product.id) throw new Error('Product ID is required for each item');
      if (item.quantity <= 0) throw new Error('Quantity must be positive');
    }

    // Execute transaction for atomic order creation
    const result = await prisma.$transaction(async (tx) => {
      console.log(`Transaction: Creating order with status "${trimmedStatus}" on ${orderDate}`);
      
      // Create the order with customer information
      const order = await tx.order.create({
        data: {
          org_id: bigOrgId,
          placed_by: user.user_id,
          order_date: orderDate,
          status: trimmedStatus,
          total_amount: totalAmount,
          // Customer Information
          customer_name: newOrder.customer.name.trim(),
          customer_email: newOrder.customer.email.trim(),
          customer_phone: newOrder.customer.phone.trim(),
          // Shipping Address
          shipping_street: newOrder.customer.address.street?.trim() || '',
          shipping_city: newOrder.customer.address.city?.trim() || '',
          shipping_state: newOrder.customer.address.state?.trim() || '',
          shipping_zip: newOrder.customer.address.zipCode?.trim() || '',
          shipping_country: newOrder.customer.address.country?.trim() || 'USA',
          // Additional Information
          notes: newOrder.notes?.trim() || '',
          shipping_method: newOrder.shippingMethod?.trim() || 'standard',
          payment_method: newOrder.paymentMethod?.trim() || 'credit_card',
        },
        select: { 
          order_id: true, 
          order_date: true, 
          status: true,
          total_amount: true,
          customer_name: true,
          customer_email: true,
          created_at: true 
        }
      });

      console.log(`Transaction: Created order ${order.order_id} for customer ${order.customer_name}`);

      const warehouse = await getOrCreateDefaultWarehouse(bigOrgId);
      console.log(`Transaction: Using warehouse ${warehouse.warehouse_id} for stock updates`);

      let calculatedTotal = 0;

      for (const item of newOrder.orderItems) {
        const productId = BigInt(item.product.id);
        
        // Fetch current product price if not provided
        let priceAtOrder = item.priceAtOrder;
        if (!priceAtOrder) {
          const latestPrice = await tx.productPrice.findFirst({
            where: { product_id: productId },
            orderBy: { valid_from: 'desc' },
            select: { retail_price: true }
          });
          if (!latestPrice) throw new Error(`No price found for product ${productId}`);
          priceAtOrder = Number(latestPrice.retail_price);
        }

        calculatedTotal += priceAtOrder * item.quantity;

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            order_id: order.order_id,
            product_id: productId,
            quantity: item.quantity,
            price_at_order: priceAtOrder,
          },
          select: { order_item_id: true }
        });

        console.log(`Transaction: Created order item ${orderItem.order_item_id}`);

        // Deduct stock (assuming sales order)
        const stockRecord = await tx.productStock.findFirst({
          where: {
            product_id: productId,
            warehouse_id: warehouse.warehouse_id
          },
          select: { stock_id: true, quantity: true }
        });

        if (!stockRecord) throw new Error(`No stock found for product ${productId}`);
        if (stockRecord.quantity < item.quantity) throw new Error(`Insufficient stock for product ${productId}`);

        await tx.productStock.update({
          where: { stock_id: stockRecord.stock_id },
          data: { quantity: stockRecord.quantity - item.quantity }
        });

        console.log(`Transaction: Deducted ${item.quantity} from stock for product ${productId}`);
      }

      // Update total if calculated differs
      if (calculatedTotal !== totalAmount) {
        await tx.order.update({
          where: { order_id: order.order_id },
          data: { total_amount: calculatedTotal }
        });
        console.log(`Transaction: Updated total to ${calculatedTotal}`);
      }

      return {
        orderId: order.order_id.toString(),
        orderDate: order.order_date.toISOString(),
        status: order.status,
        totalAmount: Number(order.total_amount),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        createdAt: order.created_at,
        warehouseId: warehouse.warehouse_id.toString(),
        warehouseName: warehouse.name
      };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    console.log(`addOrder: Successfully created order for customer ${result.customerName}:`, result);

    // Revalidate relevant pages
    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orgId}`);

    return {
      success: true,
      orderId: result.orderId,
      data: result,
      message: `Order has been successfully created for ${result.customerName}`
    };

  } catch (error) {
    console.error('Error in addOrder:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization ID format');
      }
      if (error.message.includes('Unique constraint')) {
        throw new Error('Database constraint violation');
      }
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Invalid reference');
      }
      if (error.message.includes('timeout')) {
        throw new Error('Operation timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('Failed to add order. Please try again.');
  }
}

export async function updateOrder(orgId: string, id: string, updatedOrder: any) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!id) throw new Error('Order ID is required');
  if (!updatedOrder) throw new Error('Order data is required');

  // Customer information validation for updates
  if (updatedOrder.customer) {
    if (!updatedOrder.customer.name?.trim()) throw new Error('Customer name is required');
    if (!updatedOrder.customer.email?.trim()) throw new Error('Customer email is required');
    if (!updatedOrder.customer.phone?.trim()) throw new Error('Customer phone is required');
  }

  // Add validation for order items structure - FIX FOR THE ERROR
  if (updatedOrder.orderItems) {
    console.log('Validating order items structure:', JSON.stringify(updatedOrder.orderItems, null, 2));
    
    for (let i = 0; i < updatedOrder.orderItems.length; i++) {
      const item = updatedOrder.orderItems[i];
      console.log(`Item ${i}:`, JSON.stringify(item, null, 2));
      
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Invalid quantity for item ${i + 1}`);
      }
      
      // Check for product reference in multiple possible formats
      const hasProductId = item.product?.id || item.productId || item.product_id;
      if (!hasProductId) {
        console.error(`Missing product reference in item ${i}:`, item);
        throw new Error(`Item ${i + 1} is missing product reference. Expected item.product.id, item.productId, or item.product_id`);
      }
    }
  }

  try {
    const bigOrgId = BigInt(orgId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to update orders');
    }

    const orderId = BigInt(id);
    const user = await getOrCreateUser(userId);

    // Check if order exists and belongs to the organization
    const existingOrder = await prisma.order.findFirst({
      where: {
        order_id: orderId,
        org_id: bigOrgId,
      },
      select: { 
        order_id: true, 
        orderItems: true,
        customer_name: true 
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found in this organization');
    }

    const result = await prisma.$transaction(async (tx) => {
      console.log(`Transaction: Updating order ${orderId}`);
      
      // Prepare update data
      const updateData: any = {
        order_date: updatedOrder.orderDate ? new Date(updatedOrder.orderDate) : undefined,
        status: updatedOrder.status?.trim(),
        total_amount: updatedOrder.totalAmount,
        updated_by: user.user_id,
      };

      // Add customer information if provided
      if (updatedOrder.customer) {
        updateData.customer_name = updatedOrder.customer.name.trim();
        updateData.customer_email = updatedOrder.customer.email.trim();
        updateData.customer_phone = updatedOrder.customer.phone.trim();
        updateData.shipping_street = updatedOrder.customer.address.street?.trim() || '';
        updateData.shipping_city = updatedOrder.customer.address.city?.trim() || '';
        updateData.shipping_state = updatedOrder.customer.address.state?.trim() || '';
        updateData.shipping_zip = updatedOrder.customer.address.zipCode?.trim() || '';
        updateData.shipping_country = updatedOrder.customer.address.country?.trim() || 'USA';
      }

      // Add additional information if provided
      if (updatedOrder.notes !== undefined) {
        updateData.notes = updatedOrder.notes?.trim() || '';
      }
      if (updatedOrder.shippingMethod !== undefined) {
        updateData.shipping_method = updatedOrder.shippingMethod?.trim() || 'standard';
      }
      if (updatedOrder.paymentMethod !== undefined) {
        updateData.payment_method = updatedOrder.paymentMethod?.trim() || 'credit_card';
      }

      // Update the order
      const updatedOrderRecord = await tx.order.update({
        where: { order_id: orderId },
        data: updateData,
        select: {
          customer_name: true,
          customer_email: true
        }
      });

      console.log(`Transaction: Updated order details for customer ${updatedOrderRecord.customer_name}`);

      const warehouse = await getOrCreateDefaultWarehouse(bigOrgId);

      // Handle order items updates if provided
      if (updatedOrder.orderItems) {
        // To handle item updates, first add back stock for existing items
        for (const existingItem of existingOrder.orderItems) {
          const stockRecord = await tx.productStock.findFirst({
            where: {
              product_id: existingItem.product_id,
              warehouse_id: warehouse.warehouse_id
            },
            select: { stock_id: true, quantity: true }
          });

          if (stockRecord) {
            await tx.productStock.update({
              where: { stock_id: stockRecord.stock_id },
              data: { quantity: stockRecord.quantity + (existingItem.quantity || 0) }
            });
          }
        }

        // Delete existing items
        await tx.orderItem.deleteMany({
          where: { order_id: orderId }
        });

        let calculatedTotal = 0;

        // Create new items and deduct stock - FIXED TO HANDLE MULTIPLE DATA FORMATS
        for (const item of updatedOrder.orderItems) {
          console.log('Processing item:', JSON.stringify(item, null, 2));
          
          // Handle different possible data structures for product ID - THE FIX
          let productId: BigInt;
          
          if (item.product && item.product.id) {
            // Case 1: item has product object with id
            productId = BigInt(item.product.id);
          } else if (item.productId) {
            // Case 2: item has direct productId field
            productId = BigInt(item.productId);
          } else if (item.product_id) {
            // Case 3: item has product_id field (database format)
            productId = BigInt(item.product_id);
          } else {
            console.error('Invalid item structure:', item);
            throw new Error(`Invalid product reference in order item. Expected item.product.id, item.productId, or item.product_id`);
          }
          
          let priceAtOrder = item.priceAtOrder || item.price_at_order;
          if (!priceAtOrder) {
            const latestPrice = await tx.productPrice.findFirst({
              where: { product_id: productId },
              orderBy: { valid_from: 'desc' },
              select: { retail_price: true }
            });
            priceAtOrder = Number(latestPrice?.retail_price || 0);
          }

          calculatedTotal += priceAtOrder * item.quantity;

          await tx.orderItem.create({
            data: {
              order_id: orderId,
              product_id: productId,
              quantity: item.quantity,
              price_at_order: priceAtOrder,
            },
          });

          const stockRecord = await tx.productStock.findFirst({
            where: {
              product_id: productId,
              warehouse_id: warehouse.warehouse_id
            },
            select: { stock_id: true, quantity: true }
          });

          if (!stockRecord || stockRecord.quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${productId}`);
          }

          await tx.productStock.update({
            where: { stock_id: stockRecord.stock_id },
            data: { quantity: stockRecord.quantity - item.quantity }
          });
        }

        // Update total
        await tx.order.update({
          where: { order_id: orderId },
          data: { total_amount: calculatedTotal }
        });
      }

      return {
        orderId: orderId.toString(),
        orderDate: updatedOrder.orderDate,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        customerName: updatedOrderRecord.customer_name,
        customerEmail: updatedOrderRecord.customer_email,
        warehouseId: warehouse.warehouse_id.toString(),
        warehouseName: warehouse.name
      };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orgId}`);

    return {
      success: true,
      orderId: result.orderId,
      data: result,
      message: `Order has been successfully updated for ${result.customerName}`,
    };

  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization or order ID format');
      }
      if (error.message.includes('Unique constraint')) {
        throw new Error('Database constraint violation');
      }
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Invalid reference');
      }
      if (error.message.includes('timeout')) {
        throw new Error('Operation timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('Failed to update order. Please try again.');
  }
}

export async function deleteOrder(orgId: string, id: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!id) throw new Error('Order ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to delete orders');
    }

    const orderId = BigInt(id);

    // Check if order exists - FIXED: Use only include, not both include and select
    const existingOrder = await prisma.order.findFirst({
      where: {
        order_id: orderId,
        org_id: bigOrgId,
      },
      include: { 
        orderItems: true 
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found in this organization');
    }

    // Perhaps check status, e.g., only delete if pending
    if (existingOrder.status !== 'pending') {
      throw new Error('Can only delete pending orders');
    }

    await prisma.$transaction(async (tx) => {
      const warehouse = await getOrCreateDefaultWarehouse(bigOrgId);

      // Add back stock
      for (const item of existingOrder.orderItems) {
        const stockRecord = await tx.productStock.findFirst({
          where: {
            product_id: item.product_id,
            warehouse_id: warehouse.warehouse_id
          },
          select: { stock_id: true, quantity: true }
        });

        if (stockRecord) {
          await tx.productStock.update({
            where: { stock_id: stockRecord.stock_id },
            data: { quantity: stockRecord.quantity + (item.quantity || 0) }
          });
        }
      }

      // Delete items
      await tx.orderItem.deleteMany({
        where: { order_id: orderId }
      });

      // Delete order
      await tx.order.delete({
        where: { order_id: orderId },
      });
    });

    console.log(`deleteOrder: Successfully deleted order ${id} for customer ${existingOrder.customer_name}`);

    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orgId}`);

    return {
      success: true,
      orderId: orderId.toString(),
      message: `Order for ${existingOrder.customer_name || 'customer'} has been successfully deleted`
    };

  } catch (error) {
    console.error('Error deleting order:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization or order ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to delete order. Please try again.');
  }
}

// Bulk operations
export async function bulkUpdateOrders(orgId: string, updates: { id: string; data: any }[]) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!updates || updates.length === 0) throw new Error('No updates provided');

  try {
    const bigOrgId = BigInt(orgId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to update orders');
    }

    const user = await getOrCreateUser(userId);

    const results = await prisma.$transaction(async (tx) => {
      const updateResults = [];
      
      for (const update of updates) {
        const orderId = BigInt(update.id);
        
        // Prepare update data (keeping customer info if provided)
        const updateData: any = {
          order_date: update.data.orderDate ? new Date(update.data.orderDate) : undefined,
          status: update.data.status?.trim(),
          total_amount: update.data.totalAmount,
          updated_by: user.user_id,
        };

        // Add customer information if provided in bulk update
        if (update.data.customer) {
          updateData.customer_name = update.data.customer.name?.trim();
          updateData.customer_email = update.data.customer.email?.trim();
          updateData.customer_phone = update.data.customer.phone?.trim();
        }

        await tx.order.update({
          where: {
            order_id: orderId,
            org_id: bigOrgId,
          },
          data: updateData,
        });

        updateResults.push({
          orderId: orderId.toString(),
        });
      }

      return updateResults;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });
    
    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath(`/orders/${orgId}`);

    return {
      success: true,
      updatedCount: results.length,
      results: results,
      message: `Successfully updated ${results.length} orders`
    };

  } catch (error) {
    console.error("Bulk update orders error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization or order ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to update orders. Please try again.');
  }
}
