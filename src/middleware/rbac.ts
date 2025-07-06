import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  READONLY = 'readonly'
}

/**
 * Permissions for different operations
 */
export enum Permission {
  READ_FINANCIAL_DATA = 'read:financial_data',
  WRITE_FINANCIAL_DATA = 'write:financial_data',
  DELETE_FINANCIAL_DATA = 'delete:financial_data',
  MANAGE_USERS = 'manage:users',
  SYSTEM_ADMIN = 'system:admin'
}

/**
 * Role-based permissions mapping
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.READ_FINANCIAL_DATA,
    Permission.WRITE_FINANCIAL_DATA,
    Permission.DELETE_FINANCIAL_DATA,
    Permission.MANAGE_USERS,
    Permission.SYSTEM_ADMIN
  ],
  [UserRole.USER]: [
    Permission.READ_FINANCIAL_DATA,
    Permission.WRITE_FINANCIAL_DATA,
    Permission.DELETE_FINANCIAL_DATA
  ],
  [UserRole.READONLY]: [
    Permission.READ_FINANCIAL_DATA
  ]
};

/**
 * Get user role from Firestore
 */
async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      logger.warn('User document not found, defaulting to USER role', { userId });
      return UserRole.USER;
    }
    
    const role = userData.role as UserRole;
    if (!Object.values(UserRole).includes(role)) {
      logger.warn('Invalid user role found, defaulting to USER', { userId, role });
      return UserRole.USER;
    }
    
    return role;
  } catch (error) {
    logger.error('Failed to get user role, defaulting to USER', { error, userId });
    return UserRole.USER;
  }
}

/**
 * Check if user has required permission
 */
function hasPermission(userRole: UserRole, requiredPermission: Permission): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Validate user authentication and authorization
 */
export async function validateUserAccess(
  request: NextRequest,
  requiredPermission: Permission
): Promise<{ success: true; userId: string; role: UserRole } | { success: false; response: NextResponse }> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Missing or invalid authorization header' },
          { status: 401 }
        )
      };
    }

    const idToken = authHeader.substring(7);
    if (!idToken) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Missing token' },
          { status: 401 }
        )
      };
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Invalid user ID' },
          { status: 401 }
        )
      };
    }

    // Get user role
    const userRole = await getUserRole(userId);

    // Check permissions
    if (!hasPermission(userRole, requiredPermission)) {
      logger.warn('User lacks required permission', { 
        userId, 
        userRole, 
        requiredPermission,
        endpoint: request.nextUrl.pathname 
      });
      
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        )
      };
    }

    logger.info('User access validated successfully', { 
      userId, 
      userRole, 
      requiredPermission,
      endpoint: request.nextUrl.pathname 
    });

    return {
      success: true,
      userId,
      role: userRole
    };

  } catch (error) {
    logger.error('Failed to validate user access', { 
      error,
      endpoint: request.nextUrl.pathname 
    });
    
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    };
  }
}

/**
 * Middleware for API routes that require specific permissions
 */
export function createPermissionMiddleware(requiredPermission: Permission) {
  return async (request: NextRequest) => {
    const validation = await validateUserAccess(request, requiredPermission);
    
    if (!validation.success) {
      return validation.response;
    }
    
    // Add user context to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-ID', validation.userId);
    requestHeaders.set('X-User-Role', validation.role);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  };
}

/**
 * Helper function to create a user with specific role (for admin use)
 */
export async function createUserWithRole(
  userId: string,
  email: string,
  role: UserRole = UserRole.USER
): Promise<void> {
  try {
    await db.collection('users').doc(userId).set({
      email,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    logger.info('User created with role', { userId, email, role });
  } catch (error) {
    logger.error('Failed to create user with role', { error, userId, email, role });
    throw error;
  }
}

/**
 * Helper function to update user role (for admin use)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<void> {
  try {
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: new Date()
    });
    
    logger.info('User role updated', { userId, newRole });
  } catch (error) {
    logger.error('Failed to update user role', { error, userId, newRole });
    throw error;
  }
}

const rbacUtils = {
  UserRole,
  Permission,
  validateUserAccess,
  createPermissionMiddleware,
  createUserWithRole,
  updateUserRole
};

export default rbacUtils;