/**
 * Notification color constants
 */
export const NOTIFICATION_COLORS = {
  INFO_BLUE: '#3b82f6',
  SUCCESS_GREEN: '#10b981',
  PRIORITY_PURPLE: '#8b5cf6',
  DANGER_RED: '#ef4444',
  WARNING_ORANGE: '#f59e0b'
} as const;

/**
 * Notification types matching backend NotificationType enum
 */
export enum NotificationType {
  AUDIT_CREATED = 'AUDIT_CREATED',
  AUDIT_FINALIZED = 'AUDIT_FINALIZED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_FINALIZED = 'ORDER_FINALIZED',
  SEATING_ALL_OCCUPIED = 'SEATING_ALL_OCCUPIED',
  SEATING_AVAILABLE = 'SEATING_AVAILABLE',
  STOCK_LOW = 'STOCK_LOW',
  STOCK_OUT = 'STOCK_OUT'
}

/**
 * Notification response DTO matching backend NotificationResponseDTO
 */
export interface Notification {
  type: NotificationType;
  message: string;
  timestamp: string; // ISO format date-time string
  data?: any; // Optional additional data (e.g., audit details, order details, product info)
  businessId: number;
  id?: string; // Unique identifier for client-side management
  isRead?: boolean; // Read status flag
}

/**
 * Notification configuration for UI display
 */
export interface NotificationConfig {
  icon: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Get notification configuration based on type
 */
export function getNotificationConfig(type: NotificationType): NotificationConfig {
  const configs: Record<NotificationType, NotificationConfig> = {
    [NotificationType.AUDIT_CREATED]: {
      icon: '',
      color: NOTIFICATION_COLORS.INFO_BLUE,
      priority: 'medium'
    },
    [NotificationType.AUDIT_FINALIZED]: {
      icon: '',
      color: NOTIFICATION_COLORS.SUCCESS_GREEN,
      priority: 'medium'
    },
    [NotificationType.ORDER_CREATED]: {
      icon: '',
      color: NOTIFICATION_COLORS.PRIORITY_PURPLE,
      priority: 'high'
    },
    [NotificationType.ORDER_FINALIZED]: {
      icon: '',
      color: NOTIFICATION_COLORS.SUCCESS_GREEN,
      priority: 'low'
    },
    [NotificationType.SEATING_ALL_OCCUPIED]: {
      icon: '',
      color: NOTIFICATION_COLORS.DANGER_RED,
      priority: 'high'
    },
    [NotificationType.SEATING_AVAILABLE]: {
      icon: '',
      color: NOTIFICATION_COLORS.SUCCESS_GREEN,
      priority: 'medium'
    },
    [NotificationType.STOCK_LOW]: {
      icon: '',
      color: NOTIFICATION_COLORS.WARNING_ORANGE,
      priority: 'medium'
    },
    [NotificationType.STOCK_OUT]: {
      icon: '',
      color: NOTIFICATION_COLORS.DANGER_RED,
      priority: 'high'
    }
  };

  return configs[type];
}
