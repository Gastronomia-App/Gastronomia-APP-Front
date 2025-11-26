import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { type Notification, NotificationType, getNotificationConfig } from '../../models/notification.model';
import { environment } from '../../../../enviroments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.css']
})
export class NotificationBell implements OnInit, OnDestroy {
  private notificationService: NotificationService | null = null;
  private authService: AuthService | null = null;
  
  // Signals for reactive state
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  isOpen = signal<boolean>(false);
  isConnected = signal<boolean>(false);
  
  private subscriptions: Subscription[] = [];
  
  constructor() {
    try {
      this.notificationService = inject(NotificationService);
      this.authService = inject(AuthService);
    } catch (error) {
      console.error('Error injecting services:', error);
    }
  }
  
  ngOnInit() {
    if (!this.notificationService) {
      console.warn('NotificationService not available');
      return;
    }
    
    try {
      // Subscribe to notification history
      const historySub = this.notificationService.notificationHistory$.subscribe(history => {
        this.notifications.set(history);
        this.unreadCount.set(history.length);
      });
      this.subscriptions.push(historySub);
      
      // Subscribe to connection status
      const statusSub = this.notificationService.connectionStatus$.subscribe(status => {
        this.isConnected.set(status);
      });
      this.subscriptions.push(statusSub);
      
      // Play sound for high priority notifications
      const notifSub = this.notificationService.notifications$.subscribe(notification => {
        if (this.isHighPriority(notification.type)) {
          this.playNotificationSound();
        }
      });
      this.subscriptions.push(notifSub);
      
      // Initialize WebSocket connection (non-blocking)
      setTimeout(() => {
        if (!this.notificationService || !this.authService) return;
        
        const businessId = this.authService.businessId();
        
        if (businessId && environment.wsUrl) {
          try {
            this.notificationService.connect(environment.wsUrl);
            // Load and filter notifications based on user's dismissed list
            this.notificationService.loadNotifications();
          } catch (error) {
            console.error('Error connecting to WebSocket:', error);
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Error in NotificationBell initialization:', error);
    }
  }
  
  ngOnDestroy() {
    try {
      // Clean up subscriptions
      this.subscriptions.forEach(sub => sub.unsubscribe());
      
      // Disconnect WebSocket
      if (this.notificationService) {
        this.notificationService.disconnect();
      }
    } catch (error) {
      console.error('Error in NotificationBell cleanup:', error);
    }
  }
  
  /**
   * Toggle notification panel
   */
  togglePanel(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      // Mark all as read when opening
      setTimeout(() => this.unreadCount.set(0), 300);
    }
  }
  
  /**
   * Close notification panel
   */
  closePanel(): void {
    this.isOpen.set(false);
  }
  
  /**
   * Clear all notifications
   */
  clearAll(): void {
    if (this.notificationService) {
      this.notificationService.clearHistory();
    }
    this.closePanel();
  }
  
  /**
   * Mark notification as read and remove it
   */
  markAsRead(notificationId: string | undefined, event: Event): void {
    event.stopPropagation();
    if (notificationId && this.notificationService) {
      this.notificationService.markAsRead(notificationId);
    }
  }
  
  /**
   * Get notification configuration for display
   */
  getNotificationConfig(type: NotificationType) {
    return getNotificationConfig(type);
  }
  
  /**
   * Format timestamp for display
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }
  
  /**
   * Check if notification is high priority
   */
  private isHighPriority(type: NotificationType): boolean {
    return [
      NotificationType.ORDER_CREATED,
      NotificationType.SEATING_ALL_OCCUPIED,
      NotificationType.STOCK_OUT
    ].includes(type);
  }
  
  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Could not play sound:', err));
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }
  
  /**
   * Get notification type label for display
   */
  getTypeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      [NotificationType.AUDIT_CREATED]: 'Auditoría Creada',
      [NotificationType.AUDIT_FINALIZED]: 'Auditoría Finalizada',
      [NotificationType.ORDER_CREATED]: 'Nueva Orden',
      [NotificationType.ORDER_FINALIZED]: 'Orden Finalizada',
      [NotificationType.SEATING_ALL_OCCUPIED]: 'Mesas Ocupadas',
      [NotificationType.SEATING_AVAILABLE]: 'Mesa Disponible',
      [NotificationType.STOCK_LOW]: 'Stock Bajo',
      [NotificationType.STOCK_OUT]: 'Sin Stock'
    };
    return labels[type] || type;
  }
}
