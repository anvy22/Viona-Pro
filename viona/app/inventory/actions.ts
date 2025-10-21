'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserRole, hasPermission, ensureOrganizationMember } from '@/lib/auth'; 
import { Product } from '../api/inventory/products/route';
import { revalidatePath } from 'next/cache';
import { CacheService } from '@/lib/cache';

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

export async function addProduct(orgId: string, newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  
  // Input validation
  if (!orgId) throw new Error('Organization ID is required');
  if (!newProduct) throw new Error('Product data is required');
  if (!newProduct.name?.trim()) throw new Error('Product name is required');
  if (!newProduct.sku?.trim()) throw new Error('Product SKU is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    console.log(`addProduct: Retrieved role "${role}" (type: ${typeof role}) for orgId ${orgId}`);
    
    // Permission check with explicit role validation
    if (!role || !hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error(`Insufficient permissions to add products. Current role: "${role}"`);
    }

    // Get or create user record
    const user = await getOrCreateUser(userId);
    
    // Sanitize input data
    const trimmedSku = newProduct.sku.trim();
    const trimmedName = newProduct.name.trim();
    const imageUrl = newProduct.image?.trim() || null;
    const stockQuantity = Math.max(0, newProduct.stock || 0);
    const retailPrice = Math.max(0, newProduct.price || 0);

    // Check for duplicate SKU within organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: trimmedSku,
        org_id: bigOrgId,
      },
      select: { product_id: true, name: true }
    });

    if (existingProduct) {
      throw new Error(`A product with SKU "${trimmedSku}" already exists in this organization`);
    }

    // Validate numeric inputs
    if (stockQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    if (retailPrice < 0) {
      throw new Error('Product price cannot be negative');
    }

    // Execute transaction for atomic product creation
    const result = await prisma.$transaction(async (tx) => {
      console.log(`Transaction: Creating product "${trimmedName}" with SKU "${trimmedSku}"`);
      
      // Create the product
      const product = await tx.product.create({
        data: {
          org_id: bigOrgId,
          name: trimmedName,
          sku: trimmedSku,
          description: newProduct.description?.trim() ?? null,
          image_url: imageUrl,
          status: 'active', // Set default status
          created_by: user.user_id,
        },
        select: { 
          product_id: true, 
          name: true, 
          sku: true,
          created_at: true 
        }
      });

      console.log(`Transaction: Created product ${product.product_id}`);

      // Get or create default warehouse for the organization
      const warehouse = await getOrCreateDefaultWarehouse(bigOrgId);
      
      console.log(`Transaction: Using warehouse ${warehouse.warehouse_id} for stock`);

      // Create initial stock record
      const stockRecord = await tx.productStock.create({
        data: {
          product_id: product.product_id,
          warehouse_id: warehouse.warehouse_id,
          quantity: stockQuantity,
        },
        select: { stock_id: true, quantity: true }
      });

      console.log(`Transaction: Created stock record ${stockRecord.stock_id} with quantity ${stockRecord.quantity}`);

      // Create initial price record
      const priceRecord = await tx.productPrice.create({
        data: {
          product_id: product.product_id,
          retail_price: retailPrice,
          actual_price: retailPrice, // Set same as retail for now
          valid_from: new Date(),
          // valid_to is null for current price
        },
        select: { price_id: true, retail_price: true }
      });

      console.log(`Transaction: Created price record ${priceRecord.price_id} with price ${priceRecord.retail_price}`);

      return {
        productId: product.product_id.toString(),
        name: product.name,
        sku: product.sku,
        stock: stockRecord.quantity,
        price: Number(priceRecord.retail_price),
        createdAt: product.created_at,
        warehouseId: warehouse.warehouse_id.toString(),
        warehouseName: warehouse.name
      };
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (5 seconds)
      timeout: 10000, // Maximum time for the transaction to run (10 seconds)
    });

    console.log(`addProduct: Successfully created product:`, result);

    // Invalidate cache after successful creation
    await CacheService.invalidateProducts(orgId);
    console.log(`addProduct: Cache invalidated for orgId: ${orgId}`);

    // Revalidate relevant pages to update cached data
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    revalidatePath(`/inventory/${orgId}`);

    return {
      success: true,
      productId: result.productId,
      data: result,
      message: `Product "${result.name}" with SKU "${result.sku}" has been successfully added to inventory`
    };

  } catch (error) {
    console.error('Error in addProduct:', error);
    
    // Handle specific error types for better user feedback
    if (error instanceof Error) {
      // Handle BigInt conversion errors
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization ID format');
      }
      
      // Handle database constraint errors
      if (error.message.includes('Unique constraint')) {
        throw new Error('A product with this SKU already exists in the organization');
      }
      
      // Handle foreign key constraint errors
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Invalid organization or user reference');
      }
      
      // Handle transaction timeout errors
      if (error.message.includes('timeout')) {
        throw new Error('Operation timed out. Please try again.');
      }
      
      // Re-throw known application errors
      throw error;
    }
    
    // Generic fallback for unknown errors
    throw new Error('Failed to add product. Please try again.');
  }
}

export async function updateProduct(orgId: string, id: string, updatedProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!id) throw new Error('Product ID is required');
  if (!updatedProduct) throw new Error('Product data is required');
  if (!updatedProduct.name?.trim()) throw new Error('Product name is required');
  if (!updatedProduct.sku?.trim()) throw new Error('Product SKU is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to update products');
    }

    const productId = BigInt(id);
    const user = await getOrCreateUser(userId);
    const trimmedSku = updatedProduct.sku.trim();
    const trimmedName = updatedProduct.name.trim();
    const imageUrl = updatedProduct.image?.trim() || null;
    const stockQuantity = Math.max(0, updatedProduct.stock || 0);
    const retailPrice = Math.max(0, updatedProduct.price || 0);

    // Check if product exists and belongs to the organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        product_id: productId,
        org_id: bigOrgId,
      },
      select: { product_id: true }
    });

    if (!existingProduct) {
      throw new Error('Product not found in this organization');
    }

    // Check if SKU already exists for another product in this organization
    const duplicateSku = await prisma.product.findFirst({
      where: {
        sku: trimmedSku,
        org_id: bigOrgId,
        NOT: {
          product_id: productId,
        },
      },
      select: { product_id: true }
    });

    if (duplicateSku) {
      throw new Error('A product with this SKU already exists in this organization');
    }

    // Validate numeric inputs
    if (stockQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    if (retailPrice < 0) {
      throw new Error('Product price cannot be negative');
    }

    const result = await prisma.$transaction(async (tx) => {
      console.log(`Transaction: Updating product ${productId} - "${trimmedName}"`);
      
      // Update the product
      await tx.product.update({
        where: { product_id: productId },
        data: {
          name: trimmedName,
          sku: trimmedSku,
          description: updatedProduct.description?.trim() ?? null,
          image_url: imageUrl,
          modified_by: user.user_id,
        },
      });

      console.log(`Transaction: Updated product details`);

      const warehouse = await getOrCreateDefaultWarehouse(bigOrgId);
      console.log(`Transaction: Using warehouse ${warehouse.warehouse_id} for stock update`);

      // Find existing stock record
      const existingStock = await tx.productStock.findFirst({
        where: {
          product_id: productId,
          warehouse_id: warehouse.warehouse_id
        },
        select: { stock_id: true, quantity: true }
      });

      if (existingStock) {
        // Update existing stock record
        await tx.productStock.update({
          where: {
            stock_id: existingStock.stock_id
          },
          data: {
            quantity: stockQuantity
          }
        });
        console.log(`Transaction: Updated existing stock record ${existingStock.stock_id} from ${existingStock.quantity} to ${stockQuantity}`);
      } else {
        // Create new stock record
        const newStock = await tx.productStock.create({
          data: {
            product_id: productId,
            warehouse_id: warehouse.warehouse_id,
            quantity: stockQuantity,
          },
          select: { stock_id: true }
        });
        console.log(`Transaction: Created new stock record ${newStock.stock_id} with quantity ${stockQuantity}`);
      }

      // Handle price updates
      const latestPrice = await tx.productPrice.findFirst({
        where: { product_id: productId },
        orderBy: { valid_from: 'desc' },
        select: { price_id: true, retail_price: true }
      });

      if (latestPrice && Number(latestPrice.retail_price) === retailPrice) {
        // Price hasn't changed, no need to update
        console.log(`Transaction: Price unchanged at ${retailPrice}`);
      } else if (latestPrice) {
        // Update existing price
        await tx.productPrice.update({
          where: { price_id: latestPrice.price_id },
          data: { retail_price: retailPrice },
        });
        console.log(`Transaction: Updated price from ${latestPrice.retail_price} to ${retailPrice}`);
      } else {
        // Create new price record
        const newPrice = await tx.productPrice.create({
          data: {
            product_id: productId,
            retail_price: retailPrice,
            valid_from: new Date(),
          },
          select: { price_id: true }
        });
        console.log(`Transaction: Created new price record ${newPrice.price_id} with price ${retailPrice}`);
      }

      return {
        productId: productId.toString(),
        name: trimmedName,
        sku: trimmedSku,
        stock: stockQuantity,
        price: retailPrice,
        warehouseId: warehouse.warehouse_id.toString(),
        warehouseName: warehouse.name
      };
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (5 seconds)
      timeout: 10000, // Maximum time for the transaction to run (10 seconds)
    });

    console.log(`updateProduct: Successfully updated product:`, result);

    // Invalidate cache after successful update
    await CacheService.invalidateProducts(orgId);
    console.log(`updateProduct: Cache invalidated for orgId: ${orgId}`);

    // Revalidate inventory pages
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    revalidatePath(`/inventory/${orgId}`);

    return {
      success: true,
      productId: result.productId,
      data: result,
      message: `Product "${result.name}" with SKU "${result.sku}" has been successfully updated`,
    };

  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle specific error types for better user feedback
    if (error instanceof Error) {
      // Handle BigInt conversion errors
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization or product ID format');
      }
      
      // Handle database constraint errors
      if (error.message.includes('Unique constraint')) {
        throw new Error('A product with this SKU already exists in the organization');
      }
      
      // Handle foreign key constraint errors
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Invalid organization or user reference');
      }
      
      // Handle transaction timeout errors
      if (error.message.includes('timeout')) {
        throw new Error('Operation timed out. Please try again.');
      }
      
      // Re-throw known application errors
      throw error;
    }
    
    // Generic fallback for unknown errors
    throw new Error('Failed to update product. Please try again.');
  }
}

export async function deleteProduct(orgId: string, id: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!id) throw new Error('Product ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to delete products');
    }

    const productId = BigInt(id);

    // Check if product exists and belongs to the organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        product_id: productId,
        org_id: bigOrgId,
      },
      select: { product_id: true, name: true }
    });

    if (!existingProduct) {
      throw new Error('Product not found in this organization');
    }

    // Check if product is referenced in any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { product_id: productId },
      select: { order_item_id: true }
    });

    if (orderItems) {
      throw new Error('Cannot delete product that has been ordered. Consider deactivating it instead.');
    }

    // Prisma will handle cascading deletes for related records (stock, prices)
    await prisma.product.delete({
      where: { product_id: productId },
    });

    console.log(`deleteProduct: Successfully deleted product ${id}`);

    // Invalidate cache after successful deletion
    await CacheService.invalidateProducts(orgId);
    console.log(`deleteProduct: Cache invalidated for orgId: ${orgId}`);

    // Revalidate inventory pages
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    revalidatePath(`/inventory/${orgId}`);

    return {
      success: true,
      productId: productId.toString(),
      message: 'Product has been successfully deleted'
    };

  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization or product ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to delete product. Please try again.');
  }
}

// Bulk operations with optimized cache management
export async function bulkUpdateProducts(orgId: string, updates: { id: string; data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> }[]) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!updates || updates.length === 0) throw new Error('No updates provided');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to update products');
    }

    const user = await getOrCreateUser(userId);

    // Perform bulk update using transaction
    const results = await prisma.$transaction(async (tx) => {
      const updateResults = [];
      
      for (const update of updates) {
        const productId = BigInt(update.id);
        
        // Update the product
        const updatedProduct = await tx.product.update({
          where: {
            product_id: productId,
            org_id: bigOrgId,
          },
          data: {
            name: update.data.name?.trim(),
            sku: update.data.sku?.trim(),
            description: update.data.description?.trim() ?? null,
            image_url: update.data.image?.trim() ?? null,
            modified_by: user.user_id,
          },
          select: { product_id: true, name: true, sku: true }
        });

        // Update stock if provided
        if (update.data.stock !== undefined) {
          const warehouse = await getOrCreateDefaultWarehouse(bigOrgId);
          
          // Find existing stock record first
          const existingStock = await tx.productStock.findFirst({
            where: {
              product_id: productId,
              warehouse_id: warehouse.warehouse_id,
            },
            select: { stock_id: true }
          });

          if (existingStock) {
            // Update existing stock
            await tx.productStock.update({
              where: { stock_id: existingStock.stock_id },
              data: { quantity: Math.max(0, update.data.stock) }
            });
          } else {
            // Create new stock record
            await tx.productStock.create({
              data: {
                product_id: productId,
                warehouse_id: warehouse.warehouse_id,
                quantity: Math.max(0, update.data.stock),
              }
            });
          }
        }

        // Update price if provided
        if (update.data.price !== undefined) {
          // Find existing price record
          const existingPrice = await tx.productPrice.findFirst({
            where: { product_id: productId },
            orderBy: { valid_from: 'desc' },
            select: { price_id: true }
          });

          if (existingPrice) {
            // Update existing price
            await tx.productPrice.update({
              where: { price_id: existingPrice.price_id },
              data: { retail_price: Math.max(0, update.data.price) }
            });
          } else {
            // Create new price record
            await tx.productPrice.create({
              data: {
                product_id: productId,
                retail_price: Math.max(0, update.data.price),
                valid_from: new Date(),
              }
            });
          }
        }

        updateResults.push({
          productId: updatedProduct.product_id.toString(),
          name: updatedProduct.name,
          sku: updatedProduct.sku,
        });
      }

      return updateResults;
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
      timeout: 30000, // Maximum time for the transaction to run (30 seconds)
    });

    console.log(`bulkUpdateProducts: Successfully updated ${results.length} products`);

    // Invalidate cache once after all updates
    await CacheService.invalidateProducts(orgId);
    console.log(`bulkUpdateProducts: Cache invalidated for orgId: ${orgId}`);
    
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    revalidatePath(`/inventory/${orgId}`);

    return {
      success: true,
      updatedCount: results.length,
      results: results,
      message: `Successfully updated ${results.length} products`
    };

  } catch (error) {
    console.error("Bulk update products error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization or product ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to update products. Please try again.');
  }
}

// Cache warming function for better performance
export async function warmupProductCache(orgId: string) {
  try {
    // Ensure user has permission to access this organization
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['reader', 'writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to access products');
    }

    const bigOrgId = BigInt(orgId);
    
    // Fetch products from database
    const products = await prisma.product.findMany({
      where: { org_id: bigOrgId },
      include: {
        productStocks: true,
        productPrices: {
          orderBy: { valid_from: 'desc' },
          take: 1,
        },
      },
    });

 const mappedProducts: Product[] = products.map((p) => ({
  id: p.product_id.toString(),
  name: p.name || '',
  sku: p.sku || '',
  description: p.description || undefined,
  stock: p.productStocks.reduce((acc, s) => acc + (s.quantity || 0), 0),
  price: p.productPrices[0]?.retail_price?.toNumber() || 0,
  image: p.image_url || '',
  createdAt: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
  updatedAt: p.updated_at ? p.updated_at.toISOString() : new Date().toISOString(),
}));

    // Warm up the cache
    await CacheService.warmupCache(orgId, mappedProducts);
    
    console.log(`warmupProductCache: Warmed up cache for orgId: ${orgId} with ${mappedProducts.length} products`);
    
    return {
      success: true,
      cachedCount: mappedProducts.length,
      message: `Cache warmed up with ${mappedProducts.length} products`
    };

  } catch (error) {
    console.error('Error warming up product cache:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to warm up cache');
  }
}


export async function getProductDetails(orgId: string, productId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!productId) throw new Error('Product ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    const bigProductId = BigInt(productId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['reader', 'writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to view product details');
    }

    // Fetch comprehensive product data using correct relation names from schema
    const product = await prisma.product.findFirst({
      where: {
        product_id: bigProductId,
        org_id: bigOrgId,
      },
      include: {
        createdBy: {  // Using correct relation name from your schema
          select: { user_id: true, email: true }
        },
        modifiedBy: { // Using correct relation name from your schema
          select: { user_id: true, email: true }
        },
        productStocks: {
          include: {
            warehouse: {
              select: { warehouse_id: true, name: true, address: true }
            }
          }
        },
        productPrices: {
          orderBy: { valid_from: 'desc' },
          take: 20 // Last 20 price changes
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get recent orders for this product (last 10)
    const recentOrders = await prisma.orderItem.findMany({
      where: {
        product_id: bigProductId,
        order: {
          org_id: bigOrgId
        }
      },
      include: {
        order: {
          select: {
            order_id: true,
            order_date: true,
            customer_name: true,
            status: true
          }
        }
      },
      orderBy: {
        order: {
          order_date: 'desc'
        }
      },
      take: 10
    });

    // Calculate total stock across all warehouses
    const totalStock = product.productStocks.reduce((acc, stock) => acc + (stock.quantity || 0), 0);
    
    // Get current price (most recent)
    const currentPrice = product.productPrices[0]?.retail_price || 0;

    // Transform data for frontend
    const productDetails = {
      id: product.product_id.toString(),
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      image: product.image_url || '',
      status: product.status || 'active',
      createdAt: product.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: product.updated_at?.toISOString() || new Date().toISOString(),
      createdBy: {
        id: product.createdBy?.user_id.toString() || '',
        email: product.createdBy?.email || 'Unknown'
      },
      modifiedBy: product.modifiedBy ? {
        id: product.modifiedBy.user_id.toString(),
        email: product.modifiedBy.email
      } : null,
      warehouses: product.productStocks.map(stock => ({
        id: stock.warehouse.warehouse_id.toString(),
        name: stock.warehouse.name,
        address: stock.warehouse.address,
        stock: stock.quantity || 0
      })),
      priceHistory: product.productPrices.map(price => ({
        id: price.price_id.toString(),
        retailPrice: Number(price.retail_price || 0),
        actualPrice: price.actual_price ? Number(price.actual_price) : undefined,
        marketPrice: price.market_price ? Number(price.market_price) : undefined,
        validFrom: price.valid_from?.toISOString() || new Date().toISOString(),
        validTo: price.valid_to?.toISOString() || undefined
      })),
      recentOrders: recentOrders.map(orderItem => ({
        orderId: orderItem.order.order_id.toString(),
        orderDate: orderItem.order.order_date?.toISOString() || new Date().toISOString(),
        customerName: orderItem.order.customer_name || 'Unknown Customer',
        quantity: orderItem.quantity || 0,
        priceAtOrder: Number(orderItem.price_at_order || 0),
        status: orderItem.order.status || 'pending'
      })),
      totalStock,
      currentPrice: Number(currentPrice),
      lowStockThreshold: 10
    };

    return productDetails;

  } catch (error) {
    console.error('Error fetching product details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid product or organization ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to fetch product details. Please try again.');
  }
}



export async function updateProductDetails(orgId: string, productId: string, updatedData: any) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!productId) throw new Error('Product ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    const bigProductId = BigInt(productId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to update products');
    }

    const user = await getOrCreateUser(userId);

    const result = await prisma.$transaction(async (tx) => {
      // Update product basic info
      await tx.product.update({
        where: {
          product_id: bigProductId,
          org_id: bigOrgId,
        },
        data: {
          name: updatedData.name?.trim(),
          sku: updatedData.sku?.trim(),
          description: updatedData.description?.trim(),
          image_url: updatedData.image?.trim(),
          status: updatedData.status?.trim(),
          modified_by: user.user_id,
        },
      });

      // If price is updated, create new price record
      if (updatedData.price !== undefined) {
        // End current price by setting valid_to
        await tx.productPrice.updateMany({
          where: {
            product_id: bigProductId,
            valid_to: null,
          },
          data: {
            valid_to: new Date(),
          },
        });

        // Create new price record
        await tx.productPrice.create({
          data: {
            product_id: bigProductId,
            retail_price: updatedData.price,
            actual_price: updatedData.actualPrice,
            market_price: updatedData.marketPrice,
            valid_from: new Date(),
          },
        });
      }

      return { success: true };
    });

    // Invalidate cache
    await CacheService.invalidateProducts(orgId);
    
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);

    return result;

  } catch (error) {
    console.error('Error updating product details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid product or organization ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to update product. Please try again.');
  }
}



export async function deleteProductDetails(orgId: string, productId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!productId) throw new Error('Product ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    const bigProductId = BigInt(productId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to delete products');
    }

    // Check if product has orders
    const orderCount = await prisma.orderItem.count({
      where: {
        product_id: bigProductId,
      },
    });

    if (orderCount > 0) {
      throw new Error('Cannot delete product that has been ordered. Archive it instead.');
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete price history
      await tx.productPrice.deleteMany({
        where: { product_id: bigProductId },
      });

      // Delete stock records
      await tx.productStock.deleteMany({
        where: { product_id: bigProductId },
      });

      // Delete product
      await tx.product.delete({
        where: {
          product_id: bigProductId,
          org_id: bigOrgId,
        },
      });
    });

    // Invalidate cache
    await CacheService.invalidateProducts(orgId);
    
    revalidatePath('/inventory');

    return { success: true };

  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid product or organization ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to delete product. Please try again.');
  }
}

export async function updateProductStock(orgId: string, productId: string, warehouseId: string, adjustment: number) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!productId) throw new Error('Product ID is required');
  if (!warehouseId) throw new Error('Warehouse ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    const bigProductId = BigInt(productId);
    const bigWarehouseId = BigInt(warehouseId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to update stock');
    }

    const user = await getOrCreateUser(userId);

    await prisma.$transaction(async (tx) => {
      // Find existing stock record
      const existingStock = await tx.productStock.findFirst({
        where: {
          product_id: bigProductId,
          warehouse_id: bigWarehouseId
        },
        select: { stock_id: true, quantity: true }
      });

      const newQuantity = (existingStock?.quantity || 0) + adjustment;
      
      if (newQuantity < 0) {
        throw new Error('Insufficient stock for this adjustment');
      }

      if (existingStock) {
        // Update existing stock record
        await tx.productStock.update({
          where: { stock_id: existingStock.stock_id },
          data: { quantity: newQuantity }
        });
      } else {
        // Create new stock record
        await tx.productStock.create({
          data: {
            product_id: bigProductId,
            warehouse_id: bigWarehouseId,
            quantity: Math.max(0, adjustment)
          }
        });
      }

      // Log the stock movement
      await tx.stockMovement.create({
        data: {
          product_id: bigProductId,
          warehouse_id: bigWarehouseId,
          type: adjustment > 0 ? 'in' : 'out',
          quantity: Math.abs(adjustment),
          reason: adjustment > 0 ? 'Stock increase' : 'Stock decrease',
          created_by: user.user_id
        }
      });
    });

    // Invalidate cache
    await CacheService.invalidateProducts(orgId);
    
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);

    return { success: true };

  } catch (error) {
    console.error('Error updating product stock:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to update stock. Please try again.');
  }
}

// Transfer stock between warehouses
export async function transferStock(
  orgId: string, 
  productId: string, 
  fromWarehouseId: string, 
  toWarehouseId: string, 
  quantity: number,
  reason: string,
  notes?: string
) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!productId) throw new Error('Product ID is required');
  if (!fromWarehouseId || !toWarehouseId) throw new Error('Both warehouses are required');
  if (quantity <= 0) throw new Error('Quantity must be positive');

  try {
    const bigOrgId = BigInt(orgId);
    const bigProductId = BigInt(productId);
    const bigFromWarehouseId = BigInt(fromWarehouseId);
    const bigToWarehouseId = BigInt(toWarehouseId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to transfer stock');
    }

    const user = await getOrCreateUser(userId);

    await prisma.$transaction(async (tx) => {
      // Find source stock
      const sourceStock = await tx.productStock.findFirst({
        where: {
          product_id: bigProductId,
          warehouse_id: bigFromWarehouseId
        },
        select: { stock_id: true, quantity: true }
      });

      if (!sourceStock || sourceStock.quantity < quantity) {
        throw new Error('Insufficient stock in source warehouse');
      }

      // Update source warehouse stock
      await tx.productStock.update({
        where: { stock_id: sourceStock.stock_id },
        data: { quantity: sourceStock.quantity - quantity }
      });

      // Find or create destination stock
      const destStock = await tx.productStock.findFirst({
        where: {
          product_id: bigProductId,
          warehouse_id: bigToWarehouseId
        },
        select: { stock_id: true, quantity: true }
      });

      if (destStock) {
        // Update existing destination stock
        await tx.productStock.update({
          where: { stock_id: destStock.stock_id },
          data: { quantity: destStock.quantity + quantity }
        });
      } else {
        // Create new destination stock
        await tx.productStock.create({
          data: {
            product_id: bigProductId,
            warehouse_id: bigToWarehouseId,
            quantity: quantity
          }
        });
      }

      // Log stock movements
      await tx.stockMovement.createMany({
        data: [
          {
            product_id: bigProductId,
            warehouse_id: bigFromWarehouseId,
            type: 'out',
            quantity: quantity,
            reason: `Transfer to warehouse ${bigToWarehouseId}: ${reason}`,
            notes: notes,
            created_by: user.user_id
          },
          {
            product_id: bigProductId,
            warehouse_id: bigToWarehouseId,
            type: 'in',
            quantity: quantity,
            reason: `Transfer from warehouse ${bigFromWarehouseId}: ${reason}`,
            notes: notes,
            created_by: user.user_id
          }
        ]
      });
    });

    // Invalidate cache
    await CacheService.invalidateProducts(orgId);
    
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);

    return { success: true };

  } catch (error) {
    console.error('Error transferring stock:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to transfer stock. Please try again.');
  }
}

export async function getWarehouseList(orgId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    await ensureOrganizationMember(orgId);
    
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['reader', 'writer', 'read-write', 'admin'])) {
      throw new Error('Insufficient permissions to view warehouses');
    }

    // Only select fields that exist in your Warehouse schema
    const warehouses = await prisma.warehouse.findMany({
      where: { org_id: bigOrgId },
      select: {
        warehouse_id: true,
        name: true,
        address: true,
        created_at: true,
        updated_at: true
      }
    });

    return warehouses.map(warehouse => ({
      id: warehouse.warehouse_id.toString(),
      name: warehouse.name,
      address: warehouse.address || '',
      createdAt: warehouse.created_at?.toISOString(),
      updatedAt: warehouse.updated_at?.toISOString()
    }));

  } catch (error) {
    console.error('Error fetching warehouses:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to fetch warehouses. Please try again.');
  }
}