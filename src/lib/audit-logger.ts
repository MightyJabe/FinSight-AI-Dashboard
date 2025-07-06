import { db } from '@/lib/firebase-admin';
import logger from '@/lib/logger';

/**
 * Audit event types for financial operations
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth:login_success',
  LOGIN_FAILURE = 'auth:login_failure',
  LOGOUT = 'auth:logout',
  
  // Financial data access
  FINANCIAL_DATA_READ = 'financial:data_read',
  FINANCIAL_DATA_WRITE = 'financial:data_write',
  FINANCIAL_DATA_DELETE = 'financial:data_delete',
  
  // Plaid operations
  PLAID_ACCOUNT_LINKED = 'plaid:account_linked',
  PLAID_ACCOUNT_UNLINKED = 'plaid:account_unlinked',
  PLAID_TRANSACTIONS_FETCH = 'plaid:transactions_fetch',
  PLAID_TOKEN_ENCRYPTED = 'plaid:token_encrypted',
  PLAID_TOKEN_DECRYPTED = 'plaid:token_decrypted',
  
  // AI operations
  AI_CATEGORIZATION = 'ai:categorization',
  AI_BUDGET_RECOMMENDATION = 'ai:budget_recommendation',
  AI_CASH_FLOW_FORECAST = 'ai:cash_flow_forecast',
  AI_INVESTMENT_ADVICE = 'ai:investment_advice',
  
  // Security events
  ENCRYPTION_OPERATION = 'security:encryption',
  DECRYPTION_OPERATION = 'security:decryption',
  RATE_LIMIT_EXCEEDED = 'security:rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'security:unauthorized_access',
  
  // System events
  SYSTEM_ERROR = 'system:error',
  SYSTEM_CONFIG_CHANGE = 'system:config_change'
}

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit logger class for tracking financial operations
 */
class AuditLogger {
  private collectionName = 'audit_logs';
  
  /**
   * Log an audit event
   */
  async log(entry: { 
    eventType: AuditEventType; 
    severity: AuditSeverity;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Filter out undefined values to prevent Firestore issues
      const auditEntry: Record<string, any> = {
        eventType: entry.eventType,
        severity: entry.severity,
        timestamp: new Date(),
        success: entry.success ?? true
      };
      
      // Add only defined optional fields
      if (entry.userId !== undefined) auditEntry.userId = entry.userId;
      if (entry.userEmail !== undefined) auditEntry.userEmail = entry.userEmail;
      if (entry.userRole !== undefined) auditEntry.userRole = entry.userRole;
      if (entry.sessionId !== undefined) auditEntry.sessionId = entry.sessionId;
      if (entry.ipAddress !== undefined) auditEntry.ipAddress = entry.ipAddress;
      if (entry.userAgent !== undefined) auditEntry.userAgent = entry.userAgent;
      if (entry.endpoint !== undefined) auditEntry.endpoint = entry.endpoint;
      if (entry.method !== undefined) auditEntry.method = entry.method;
      if (entry.resource !== undefined) auditEntry.resource = entry.resource;
      if (entry.resourceId !== undefined) auditEntry.resourceId = entry.resourceId;
      if (entry.details !== undefined) auditEntry.details = entry.details;
      if (entry.errorMessage !== undefined) auditEntry.errorMessage = entry.errorMessage;
      if (entry.metadata !== undefined) auditEntry.metadata = entry.metadata;
      
      // Store in Firestore for persistence and querying
      await db.collection(this.collectionName).add(auditEntry);
      
      // Also log to application logger for real-time monitoring
      const logLevel = this.getSeverityLogLevel(entry.severity);
      logger[logLevel]('Audit log entry', {
        eventType: entry.eventType,
        severity: entry.severity,
        userId: entry.userId,
        resource: entry.resource,
        success: entry.success,
        details: entry.details
      });
      
    } catch (error) {
      // Critical: audit logging failure should be logged but not fail the operation
      logger.error('Failed to write audit log', { error, eventType: entry.eventType });
    }
  }
  
  /**
   * Log financial data access
   */
  async logFinancialAccess(params: {
    userId: string;
    userEmail?: string;
    userRole?: string;
    operation: 'read' | 'write' | 'delete';
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      read: AuditEventType.FINANCIAL_DATA_READ,
      write: AuditEventType.FINANCIAL_DATA_WRITE,
      delete: AuditEventType.FINANCIAL_DATA_DELETE
    };
    
    const logEntry: any = {
      eventType: eventTypeMap[params.operation],
      severity: params.operation === 'delete' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      userId: params.userId,
      resource: params.resource,
      success: params.success
    };

    if (params.userEmail) logEntry.userEmail = params.userEmail;
    if (params.userRole) logEntry.userRole = params.userRole;
    if (params.ipAddress) logEntry.ipAddress = params.ipAddress;
    if (params.userAgent) logEntry.userAgent = params.userAgent;
    if (params.endpoint) logEntry.endpoint = params.endpoint;
    if (params.method) logEntry.method = params.method;
    if (params.resourceId) logEntry.resourceId = params.resourceId;
    if (params.errorMessage) logEntry.errorMessage = params.errorMessage;
    if (params.details) logEntry.details = params.details;

    await this.log(logEntry);
  }
  
  /**
   * Log Plaid operations
   */
  async logPlaidOperation(params: {
    userId: string;
    userEmail?: string;
    operation: 'link' | 'unlink' | 'fetch_transactions' | 'encrypt_token' | 'decrypt_token';
    itemId?: string;
    institutionName?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      link: AuditEventType.PLAID_ACCOUNT_LINKED,
      unlink: AuditEventType.PLAID_ACCOUNT_UNLINKED,
      fetch_transactions: AuditEventType.PLAID_TRANSACTIONS_FETCH,
      encrypt_token: AuditEventType.PLAID_TOKEN_ENCRYPTED,
      decrypt_token: AuditEventType.PLAID_TOKEN_DECRYPTED
    };
    
    const logEntry: any = {
      eventType: eventTypeMap[params.operation],
      severity: ['link', 'unlink', 'encrypt_token', 'decrypt_token'].includes(params.operation) 
        ? AuditSeverity.HIGH 
        : AuditSeverity.MEDIUM,
      userId: params.userId,
      resource: 'plaid_account',
      success: params.success
    };

    if (params.userEmail) logEntry.userEmail = params.userEmail;
    if (params.ipAddress) logEntry.ipAddress = params.ipAddress;
    if (params.userAgent) logEntry.userAgent = params.userAgent;
    if (params.endpoint) logEntry.endpoint = params.endpoint;
    if (params.itemId) logEntry.resourceId = params.itemId;
    if (params.errorMessage) logEntry.errorMessage = params.errorMessage;
    if (params.details || params.institutionName) {
      logEntry.details = {
        ...params.details,
        institutionName: params.institutionName
      };
    }

    await this.log(logEntry);
  }
  
  /**
   * Log security events
   */
  async logSecurityEvent(params: {
    eventType: AuditEventType;
    severity: AuditSeverity;
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    resource?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const logEntry: any = {
      eventType: params.eventType,
      severity: params.severity,
      success: params.success
    };

    if (params.userId) logEntry.userId = params.userId;
    if (params.userEmail) logEntry.userEmail = params.userEmail;
    if (params.ipAddress) logEntry.ipAddress = params.ipAddress;
    if (params.userAgent) logEntry.userAgent = params.userAgent;
    if (params.endpoint) logEntry.endpoint = params.endpoint;
    if (params.method) logEntry.method = params.method;
    if (params.resource) logEntry.resource = params.resource;
    if (params.errorMessage) logEntry.errorMessage = params.errorMessage;
    if (params.details) logEntry.details = params.details;

    await this.log(logEntry);
  }
  
  /**
   * Log AI operations
   */
  async logAIOperation(params: {
    userId: string;
    userEmail?: string;
    operation: 'categorization' | 'budget_recommendation' | 'cash_flow_forecast' | 'investment_advice';
    dataProcessed?: number;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      categorization: AuditEventType.AI_CATEGORIZATION,
      budget_recommendation: AuditEventType.AI_BUDGET_RECOMMENDATION,
      cash_flow_forecast: AuditEventType.AI_CASH_FLOW_FORECAST,
      investment_advice: AuditEventType.AI_INVESTMENT_ADVICE
    };
    
    const logEntry: any = {
      eventType: eventTypeMap[params.operation],
      severity: AuditSeverity.MEDIUM,
      userId: params.userId,
      resource: 'ai_service',
      success: params.success
    };

    if (params.userEmail) logEntry.userEmail = params.userEmail;
    if (params.ipAddress) logEntry.ipAddress = params.ipAddress;
    if (params.userAgent) logEntry.userAgent = params.userAgent;
    if (params.endpoint) logEntry.endpoint = params.endpoint;
    if (params.errorMessage) logEntry.errorMessage = params.errorMessage;
    if (params.details || params.dataProcessed) {
      logEntry.details = {
        ...params.details,
        dataProcessed: params.dataProcessed
      };
    }

    await this.log(logEntry);
  }
  
  /**
   * Query audit logs (for admin/compliance purposes)
   */
  async queryLogs(params: {
    userId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = db.collection(this.collectionName).orderBy('timestamp', 'desc');
      
      if (params.userId) {
        query = query.where('userId', '==', params.userId);
      }
      
      if (params.eventType) {
        query = query.where('eventType', '==', params.eventType);
      }
      
      if (params.severity) {
        query = query.where('severity', '==', params.severity);
      }
      
      if (params.startDate) {
        query = query.where('timestamp', '>=', params.startDate);
      }
      
      if (params.endDate) {
        query = query.where('timestamp', '<=', params.endDate);
      }
      
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry & { id: string }));
      
    } catch (error) {
      logger.error('Failed to query audit logs', { error, params });
      throw error;
    }
  }
  
  /**
   * Get appropriate log level for severity
   */
  private getSeverityLogLevel(severity: AuditSeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
      case AuditSeverity.LOW:
        return 'info';
      case AuditSeverity.MEDIUM:
        return 'info';
      case AuditSeverity.HIGH:
        return 'warn';
      case AuditSeverity.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export helper functions for common operations
export async function logFinancialAccess(
  userId: string, 
  operation: 'read' | 'write' | 'delete',
  resource: string,
  options: {
    resourceId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  } = {}
): Promise<void> {
  await auditLogger.logFinancialAccess({
    userId,
    operation,
    resource,
    ...options
  });
}

export async function logPlaidOperation(
  userId: string,
  operation: 'link' | 'unlink' | 'fetch_transactions' | 'encrypt_token' | 'decrypt_token',
  options: {
    itemId?: string;
    institutionName?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  } = {}
): Promise<void> {
  await auditLogger.logPlaidOperation({
    userId,
    operation,
    ...options
  });
}

export async function logSecurityEvent(
  eventType: AuditEventType,
  severity: AuditSeverity,
  options: {
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    resource?: string;
    success?: boolean;
    errorMessage?: string;
    details?: Record<string, any>;
  } = {}
): Promise<void> {
  await auditLogger.logSecurityEvent({
    eventType,
    severity,
    ...options
  });
}

export default auditLogger;