// File: app/api/inventory/products/route.ts
// API route with Redis caching implementation

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserRole, hasPermission } from '@/lib/auth';
import { CacheService } from '@/lib/cache';

export type Product = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  stock: number;
  price: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get('orgId');
  
  if (!orgId) {
    console.log('Products API: Missing orgId parameter');
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  console.log(`Products API: Checking permissions for orgId: ${orgId}`);

  try {
    const role = await getUserRole(orgId);
    console.log(`Products API: User role in org ${orgId}: ${role}`);
    
    // Use consistent permission check - allow all roles that can read data
    if (!hasPermission(role, ['reader', 'writer', 'read-write', 'admin'])) {
      console.log(`Products API: Permission denied for role: ${role}`);
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        debug: { role, orgId, requiredRoles: ['reader', 'writer', 'read-write', 'admin'] }
      }, { status: 403 });
    }

    // Try to get from cache first
    const cachedProducts = await CacheService.getProducts(orgId);
    const lastModified = await CacheService.getLastModified('products', orgId);
    
    // If we have cached data and it's recent, return it
    if (cachedProducts && lastModified) {
      const cacheAge = Date.now() - lastModified;
      const maxAge = 1000 * 60 * 5; // 5 minutes
      
      if (cacheAge < maxAge) {
        console.log('Products API: Returning cached data, age:', Math.round(cacheAge / 1000), 'seconds');
        return NextResponse.json(cachedProducts, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Age': Math.round(cacheAge / 1000).toString(),
            'X-Products-Count': cachedProducts.length.toString(),
          },
        });
      } else {
        console.log('Products API: Cache expired, age:', Math.round(cacheAge / 1000), 'seconds');
      }
    }

    console.log('Products API: Cache miss or expired, fetching from database');

    const bigOrgId = BigInt(orgId);
    console.log(`Products API: Fetching products for org: ${bigOrgId}`);
    
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

    console.log(`Products API: Found ${products.length} products from database`);

    const mappedProducts: Product[] = products.map((p) => ({
      id: p.product_id.toString(),
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      stock: p.productStocks.reduce((acc, s) => acc + (s.quantity || 0), 0),
      price: p.productPrices[0]?.retail_price?.toNumber() || 0,
      image: p.image_url,
      createdAt: p.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: p.updated_at?.toISOString() || new Date().toISOString(),
    }));

    // Cache the results for future requests
    await CacheService.setProducts(orgId, mappedProducts);
    console.log(`Products API: Cached ${mappedProducts.length} products for orgId: ${orgId}`);

    return NextResponse.json(mappedProducts, {
      headers: {
        'X-Cache': 'MISS',
        'X-DB-Count': mappedProducts.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Products API error:', error);
    
    // Try to return cached data as fallback if available (even if expired)
    if (error instanceof Error && !error.message.includes('permission')) {
      try {
        const fallbackProducts = await CacheService.getProducts(orgId);
        if (fallbackProducts) {
          console.log('Products API: Returning stale cache data due to database error');
          return NextResponse.json(fallbackProducts, {
            headers: {
              'X-Cache': 'STALE',
              'X-Fallback': 'true',
              'X-Products-Count': fallbackProducts.length.toString(),
            },
          });
        }
      } catch (cacheError) {
        console.error('Products API: Cache fallback also failed:', cacheError);
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
