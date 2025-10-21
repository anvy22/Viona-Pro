// File: app/organization/actions.ts
// Server actions for organization management

'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { getUserRole, hasPermission, ensureOrganizationMember } from '@/lib/auth'; 
import { revalidatePath } from 'next/cache';

type SimpleOrg = {
  id: string;
  name: string;
  role: string;
};

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

export async function getUserOrganizations(): Promise<SimpleOrg[]> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { clerk_id: userId },
    select: {
      createdOrganizations: {
        select: { org_id: true, name: true }
      },
      organizationMembers: {
        select: { 
          role: true,
          org: { 
            select: { org_id: true, name: true }
          }
        },
      },
    },
  });

  if (!user) throw new Error('User not found');

  const orgs: SimpleOrg[] = [
    ...user.createdOrganizations.map((o) => ({
      id: o.org_id.toString(),
      name: o.name,
      role: 'admin',
    })),
    ...user.organizationMembers.map((m) => ({
      id: m.org.org_id.toString(),
      name: m.org.name,
      role: m.role,
    })),
  ];

  // Remove duplicates by id
  const uniqueOrgs = orgs.filter(
    (org, index, self) => index === self.findIndex((o) => o.id === org.id)
  );

  return uniqueOrgs;
}

export async function createOrganization(name: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!name?.trim()) throw new Error('Organization name is required');

  const trimmedName = name.trim();
  const user = await getOrCreateUser(userId);

  console.log(`Creating organization "${trimmedName}" for user ${user.user_id}`);

  // Case-insensitive duplicate check for user's organizations
  const existingOrg = await prisma.organization.findFirst({
    where: {
      created_by: user.user_id,
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
    },
    select: { org_id: true }
  });

  if (existingOrg) {
    throw new Error('You already have an organization with this name');
  }

  // Use transaction for atomic operations
  const result = await prisma.$transaction(async (tx) => {
    console.log(`Transaction: Creating organization...`);
    const org = await tx.organization.create({
      data: { name: trimmedName, created_by: user.user_id },
      select: { org_id: true, name: true }
    });

    console.log(`Transaction: Created organization ${org.org_id}, now creating member record...`);
    
    const member = await tx.organizationMember.create({
      data: { 
        org_id: org.org_id, 
        user_id: user.user_id, 
        role: 'admin' 
      },
      select: { id: true, role: true }
    });

    console.log(`Transaction: Created member record ${member.id} with role ${member.role}`);

    // Verify the member was created correctly
    const verifyMember = await tx.organizationMember.findUnique({
      where: {
        org_id_user_id: {
          org_id: org.org_id,
          user_id: user.user_id,
        }
      },
      select: { role: true }
    });

    console.log(`Transaction: Verified member role: ${verifyMember?.role}`);

    if (!verifyMember || verifyMember.role !== 'admin') {
      throw new Error('Failed to create organization member record');
    }

    return {
      orgId: org.org_id.toString(),
      name: org.name
    };
  });

  console.log(`Organization created successfully:`, result);

  // Revalidate organizations list
  revalidatePath('/organization');
  return result.orgId;
}

export async function updateOrganization(orgId: string, name: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');
  if (!name?.trim()) throw new Error('Organization name is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['admin'])) {
      throw new Error('Only admins can update organizations');
    }

    await prisma.organization.update({
      where: { org_id: bigOrgId },
      data: { name: name.trim() },
    });

    // Revalidate related pages
    revalidatePath('/organization');
    revalidatePath('/dashboard');
    
    return { success: true };

  } catch (error) {
    console.error('Error updating organization:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to update organization. Please try again.');
  }
}

export async function deleteOrganization(orgId: string, force: boolean = false) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!orgId) throw new Error('Organization ID is required');

  try {
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const role = await getUserRole(orgId);
    if (!hasPermission(role, ['admin'])) {
      throw new Error('Only admins can delete organizations');
    }

    // Check for related data - use counts for better performance
    const [warehouses, products, orders] = await Promise.all([
      prisma.warehouse.count({ where: { org_id: bigOrgId } }),
      prisma.product.count({ where: { org_id: bigOrgId } }),
      prisma.order.count({ where: { org_id: bigOrgId } }),
    ]);

    // If there's existing data and force is not enabled, provide detailed error
    if ((warehouses > 0 || products > 0 || orders > 0) && !force) {
      const dataDetails = [];
      if (warehouses > 0) dataDetails.push(`${warehouses} warehouse${warehouses === 1 ? '' : 's'}`);
      if (products > 0) dataDetails.push(`${products} product${products === 1 ? '' : 's'}`);
      if (orders > 0) dataDetails.push(`${orders} order${orders === 1 ? '' : 's'}`);
      
      throw new Error(
        `Cannot delete organization. It contains: ${dataDetails.join(', ')}. ` +
        `To delete this organization and all its data permanently, use the force delete option. ` +
        `This action cannot be undone.`
      );
    }

    // Use transaction for atomic deletion
    await prisma.$transaction(async (tx) => {
      console.log(`Transaction: Starting deletion of organization ${orgId}`);
      
      if (force && (warehouses > 0 || products > 0 || orders > 0)) {
        console.log(`Transaction: Force deleting organization with existing data`);
        
        // Delete in correct order to handle foreign key constraints
        
        // 1. Delete order items first
        const orderItemsDeleted = await tx.orderItem.deleteMany({
          where: { 
            order: { org_id: bigOrgId } 
          }
        });
        console.log(`Transaction: Deleted ${orderItemsDeleted.count} order items`);

        // 2. Delete orders
        const ordersDeleted = await tx.order.deleteMany({ 
          where: { org_id: bigOrgId } 
        });
        console.log(`Transaction: Deleted ${ordersDeleted.count} orders`);

        // 3. Delete product prices
        const pricesDeleted = await tx.productPrice.deleteMany({
          where: { 
            product: { org_id: bigOrgId } 
          }
        });
        console.log(`Transaction: Deleted ${pricesDeleted.count} product prices`);

        // 4. Delete product stock
        const stockDeleted = await tx.productStock.deleteMany({
          where: { 
            product: { org_id: bigOrgId } 
          }
        });
        console.log(`Transaction: Deleted ${stockDeleted.count} stock records`);

        // 5. Delete products
        const productsDeleted = await tx.product.deleteMany({ 
          where: { org_id: bigOrgId } 
        });
        console.log(`Transaction: Deleted ${productsDeleted.count} products`);

        // 6. Delete warehouses
        const warehousesDeleted = await tx.warehouse.deleteMany({ 
          where: { org_id: bigOrgId } 
        });
        console.log(`Transaction: Deleted ${warehousesDeleted.count} warehouses`);
      }

      // 7. Delete organization invites
      const invitesDeleted = await tx.organizationInvite.deleteMany({ 
        where: { org_id: bigOrgId } 
      });
      console.log(`Transaction: Deleted ${invitesDeleted.count} invitations`);

      // 8. Delete organization members
      const membersDeleted = await tx.organizationMember.deleteMany({ 
        where: { org_id: bigOrgId } 
      });
      console.log(`Transaction: Deleted ${membersDeleted.count} members`);

      // 9. Finally delete the organization
      const organization = await tx.organization.delete({ 
        where: { org_id: bigOrgId },
        select: { name: true }
      });
      console.log(`Transaction: Deleted organization "${organization.name}"`);

      return organization.name;
    });

    console.log(`deleteOrganization: Successfully deleted organization ${orgId}`);

    // Revalidate pages
    revalidatePath('/organization');
    revalidatePath('/dashboard');
    revalidatePath('/inventory');

    return { 
      success: true,
      message: force 
        ? 'Organization and all its data have been permanently deleted'
        : 'Organization deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting organization:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Handle BigInt conversion errors
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization ID format');
      }
      
      // Handle foreign key constraint errors
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Cannot delete organization due to data dependencies. Please use force delete.');
      }
      
      // Re-throw known application errors
      throw error;
    }
    
    // Generic fallback for unknown errors
    throw new Error('Failed to delete organization. Please try again.');
  }
}

export async function inviteEmployee(orgId: string, email: string, role: string) {
  if (!orgId) throw new Error('Organization ID is required');
  if (!email?.trim()) throw new Error('Email is required');
  if (!role?.trim()) throw new Error('Role is required');

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const bigOrgId = BigInt(orgId);
    
    // Ensure user is organization member and has proper role
    await ensureOrganizationMember(orgId);
    
    // Get user role after ensuring membership
    const currentRole = await getUserRole(orgId);
    if (!hasPermission(currentRole, ['admin'])) {
      throw new Error('Only admins can invite employees');
    }

    // Check if user is already a member or has pending invite
    const [existingMember, pendingInvite] = await Promise.all([
      prisma.organizationMember.findFirst({
        where: {
          org_id: bigOrgId,
          user: { email: normalizedEmail }
        },
        select: { user_id: true }
      }),
      prisma.organizationInvite.findFirst({
        where: {
          org_id: bigOrgId,
          email: normalizedEmail,
          status: 'pending',
          expires_at: { gte: new Date() }
        },
        select: { token: true }
      })
    ]);

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    if (pendingInvite) {
      throw new Error('A pending invitation already exists for this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.organizationInvite.create({
      data: {
        org_id: bigOrgId,
        email: normalizedEmail,
        token,
        role: role.trim(),
        expires_at: expiresAt,
      },
    });

    return token;

  } catch (error) {
    console.error('Error inviting employee:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot convert') && error.message.includes('BigInt')) {
        throw new Error('Invalid organization ID format');
      }
      throw error;
    }
    
    throw new Error('Failed to invite employee. Please try again.');
  }
}

export async function acceptInvite(token: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  if (!token?.trim()) throw new Error('Invalid invitation token');

  try {
    const invite = await prisma.organizationInvite.findUnique({
      where: { token: token.trim() },
      select: {
        org_id: true,
        email: true,
        role: true,
        status: true,
        expires_at: true
      }
    });

 if (!invite || invite.status !== 'pending') {
  throw new Error('Invalid invitation');
}

if (!invite.expires_at || new Date(invite.expires_at) < new Date()) {
  throw new Error('Invitation has expired');
}
    const user = await getOrCreateUser(userId);

    if (invite.email !== user.email) {
      throw new Error('Email mismatch - invitation not for this user');
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        org_id_user_id: {
          org_id: invite.org_id,
          user_id: user.user_id,
        },
      },
      select: { user_id: true }
    });

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Use transaction for atomic operations
    const orgId = await prisma.$transaction(async (tx) => {
      await tx.organizationMember.create({
        data: { 
          org_id: invite.org_id, 
          user_id: user.user_id, 
          role: invite.role 
        },
      });

      await tx.organizationInvite.update({
        where: { token: token.trim() },
        data: { status: 'accepted' },
      });

      return invite.org_id.toString();
    });

    // Revalidate organizations list
    revalidatePath('/organization');
    return orgId;

  } catch (error) {
    console.error('Error accepting invite:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to accept invitation. Please try again.');
  }
}
