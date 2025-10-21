// Enhanced auth functions in lib/auth.ts

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// Helper function to get or create user
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

export async function getUserRole(orgId: string): Promise<string | null> {
  const { userId } = auth();
  if (!userId) return null;

  try {
    const bigOrgId = BigInt(orgId);
    const user = await getOrCreateUser(userId);
    
    // First check if user created this organization
    const createdOrg = await prisma.organization.findFirst({
      where: { 
        org_id: bigOrgId,
        created_by: user.user_id 
      }
    });

    if (createdOrg) {
      // Creator should always be admin - ensure member record exists
      await prisma.organizationMember.upsert({
        where: { 
          org_id_user_id: { 
            org_id: bigOrgId, 
            user_id: user.user_id 
          } 
        },
        update: { role: 'admin' },
        create: {
          org_id: bigOrgId,
          user_id: user.user_id,
          role: 'admin'
        }
      });
      return 'admin';
    }

    // Check member role
    const member = await prisma.organizationMember.findUnique({
      where: { 
        org_id_user_id: { 
          org_id: bigOrgId, 
          user_id: user.user_id 
        } 
      },
      select: { role: true }
    });

    return member?.role || null;
  } catch (error) {
    console.error('getUserRole error:', error);
    return null;
  }
}


export function hasPermission(role: string | null, requiredRoles: string[]): boolean {
  console.log(`hasPermission: Checking role "${role}" (type: ${typeof role}) against required roles:`, requiredRoles);
  
  // Handle all invalid role scenarios
  if (!role || role === "null" || role === "undefined" || role === "" || role === "NULL") {
    console.log('hasPermission: No valid role provided, access denied');
    return false;
  }
  
  // Admin has all permissions
  if (role === 'admin') {
    console.log('hasPermission: Admin role detected, access granted');
    return true;
  }
  
  const hasAccess = requiredRoles.includes(role);
  console.log(`hasPermission: Access ${hasAccess ? 'granted' : 'denied'} for role "${role}"`);
  return hasAccess;
}

// Enhanced ensureOrganizationMember with better error handling
// lib/auth.ts - Enhanced version with better debugging

export async function ensureOrganizationMember(orgId: string): Promise<void> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    console.log(`ensureOrganizationMember: Starting with orgId="${orgId}" (type: ${typeof orgId})`);
    
    // Validate orgId format before conversion
    if (!orgId || orgId.trim() === '' || orgId === 'undefined' || orgId === 'null') {
      throw new Error(`Invalid organization ID provided: "${orgId}"`);
    }

    // Safely convert to BigInt with validation
    let bigOrgId: BigInt;
    try {
      const cleanOrgId = orgId.toString().trim();
      
      // Check if it's a valid number string
      if (!/^\d+$/.test(cleanOrgId)) {
        throw new Error(`Organization ID must be numeric. Received: "${cleanOrgId}"`);
      }
      
      bigOrgId = BigInt(cleanOrgId);
      console.log(`ensureOrganizationMember: Converted orgId to BigInt: ${bigOrgId}`);
    } catch (conversionError) {
      console.error('BigInt conversion error:', conversionError);
      throw new Error(`Invalid organization ID format: "${orgId}"`);
    }
    
    // Get or create user
    const user = await getOrCreateUser(userId);
    console.log(`ensureOrganizationMember: Processing user ${user.user_id} for org ${orgId}`);

    // First, let's check if the organization exists at all
    const orgCheck = await prisma.organization.findUnique({
      where: { org_id: bigOrgId },
      select: { 
        org_id: true, 
        name: true, 
        created_by: true 
      }
    });

    console.log(`ensureOrganizationMember: Organization check result:`, orgCheck);

    if (!orgCheck) {
      // List all organizations for debugging
      const allOrgs = await prisma.organization.findMany({
        select: { 
          org_id: true, 
          name: true, 
          created_by: true 
        },
        take: 10 // Limit to first 10 for debugging
      });
      
      console.log(`ensureOrganizationMember: Available organizations:`, 
        allOrgs.map(org => ({ 
          id: org.org_id.toString(), 
          name: org.name, 
          created_by: org.created_by.toString() 
        }))
      );
      
      throw new Error(`Organization with ID "${orgId}" not found. Please verify the organization ID.`);
    }

    // Check if the current user is the creator
    const isCreator = orgCheck.created_by.toString() === user.user_id.toString();
    console.log(`ensureOrganizationMember: User ${user.user_id} is creator: ${isCreator}`);

    // Use transaction for atomic operations
    await prisma.$transaction(async (tx) => {
      if (isCreator) {
        console.log(`ensureOrganizationMember: User ${user.user_id} is creator of org ${orgId}`);
        
        // Ensure creator has admin member record
        const memberRecord = await tx.organizationMember.upsert({
          where: { 
            org_id_user_id: { 
              org_id: bigOrgId, 
              user_id: user.user_id 
            } 
          },
          update: { 
            role: 'admin' 
          },
          create: {
            org_id: bigOrgId,
            user_id: user.user_id,
            role: 'admin'
          },
          select: { role: true, created_at: true }
        });
        
        console.log(`ensureOrganizationMember: Ensured admin member record with role: "${memberRecord.role}"`);
      } else {
        console.log(`ensureOrganizationMember: User ${user.user_id} is not creator, checking existing membership`);
        
        // Check if they have existing membership
        const existingMember = await tx.organizationMember.findUnique({
          where: { 
            org_id_user_id: { 
              org_id: bigOrgId, 
              user_id: user.user_id 
            } 
          },
          select: { role: true }
        });
        
        if (!existingMember) {
          console.log(`ensureOrganizationMember: User ${user.user_id} has no membership in org ${orgId}`);
          
          // List user's memberships for debugging
          const userMemberships = await tx.organizationMember.findMany({
            where: { user_id: user.user_id },
            select: { 
              org_id: true, 
              role: true,
              org: {
                select: { name: true }
              }
            }
          });
          
          console.log(`ensureOrganizationMember: User's current memberships:`, 
            userMemberships.map(m => ({ 
              org_id: m.org_id.toString(), 
              org_name: m.org.name, 
              role: m.role 
            }))
          );
          
          throw new Error(`Access denied. User is not a member of organization "${orgCheck.name}" (ID: ${orgId}). Please contact an administrator to be added to this organization.`);
        } else {
          console.log(`ensureOrganizationMember: User ${user.user_id} has existing membership with role: "${existingMember.role}"`);
        }
      }
    });
    
    console.log(`ensureOrganizationMember: Successfully ensured membership for user ${user.user_id} in org ${orgId}`);
    
  } catch (error) {
    console.error('ensureOrganizationMember detailed error:', {
      orgId,
      userId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while validating organization membership');
    }
  }
}




// Debug function to check user's organizations and roles
export async function debugUserOrgs(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      include: {
        createdOrganizations: {
          select: { org_id: true, name: true }
        },
        organizationMembers: {
          select: { 
            role: true,
            org: { 
              select: { org_id: true, name: true }
            }
          }
        }
      }
    });

    console.log('Debug User Organizations:', {
      user: user?.user_id,
      createdOrgs: user?.createdOrganizations.map(o => ({ id: o.org_id.toString(), name: o.name })),
      memberOrgs: user?.organizationMembers.map(m => ({ 
        org_id: m.org.org_id.toString(), 
        org_name: m.org.name, 
        role: m.role 
      }))
    });

    return user;
  } catch (error) {
    console.error('debugUserOrgs error:', error);
    return null;
  }
}