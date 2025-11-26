import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, map } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { type Notification, NotificationType } from '../models/notification.model';
import { AuthService } from '../../core/services/auth.service';

// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs.min.js';

/**
 * Service for managing WebSocket connections and real-time notifications
 * Connects to Spring Boot backend using SockJS and STOMP protocol
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly authService = inject(AuthService);
  
  private stompClient: Client | null = null;
  private notificationsSubject = new Subject<Notification>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private allNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  private dismissedNotificationsSubject = new BehaviorSubject<Set<string>>(new Set());
  
  // Public observables
  public notifications$: Observable<Notification> = this.notificationsSubject.asObservable();
  public connectionStatus$: Observable<boolean> = this.connectionStatusSubject.asObservable();
  
  // Observable that filters notifications based on user's dismissed list
  // Uses combineLatest to react to changes in both allNotifications AND dismissed list
  public notificationHistory$: Observable<Notification[]> = combineLatest([
    this.allNotificationsSubject,
    this.dismissedNotificationsSubject
  ]).pipe(
    map(([allNotifications, dismissed]) => {
      return allNotifications.filter(n => !n.id || !dismissed.has(n.id));
    })
  );
  
  private maxHistorySize = 50; // Maximum number of notifications to keep in history
  private readonly STORAGE_KEY = 'dismissed_notifications';
  
  /**
   * Get dismissed notification IDs from localStorage (user-specific)
   */
  private getDismissedNotifications(): Set<string> {
    const employeeId = this.authService.employeeId();
    if (!employeeId) return new Set();
    
    const key = `${this.STORAGE_KEY}_${employeeId}`;
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  }
  
  /**
   * Save dismissed notification IDs to localStorage (user-specific)
   */
  private saveDismissedNotifications(dismissed: Set<string>): void {
    const employeeId = this.authService.employeeId();
    if (!employeeId) return;
    
    const key = `${this.STORAGE_KEY}_${employeeId}`;
    localStorage.setItem(key, JSON.stringify(Array.from(dismissed)));
    
    // Update the subject to trigger the observable pipe
    this.dismissedNotificationsSubject.next(dismissed);
  }
  
  /**
   * Load dismissed notifications from localStorage on init
   */
  private loadDismissedNotifications(): void {
    const dismissed = this.getDismissedNotifications();
    this.dismissedNotificationsSubject.next(dismissed);
  }
  
  /**
   * Connect to WebSocket server
   * @param wsUrl WebSocket URL (e.g., 'http://localhost:8080/ws')
   */
  connect(wsUrl: string): void {
    const businessId = this.authService.businessId();
    
    if (!businessId) {
      console.warn('Cannot connect to notifications: No business ID available');
      return;
    }
    
    if (this.stompClient && this.stompClient.connected) {
      console.log('WebSocket already connected');
      return;
    }
    
    // Load user's dismissed notifications
    this.loadDismissedNotifications();
    
    // Create STOMP client with SockJS
    this.stompClient = new Client({
      webSocketFactory: () => new (SockJS as any)(wsUrl),
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000, // Reconnect after 5 seconds if connection is lost
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('WebSocket connected successfully');
        this.connectionStatusSubject.next(true);
        this.subscribeToNotifications(businessId);
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connectionStatusSubject.next(false);
      },
      
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
        this.connectionStatusSubject.next(false);
      },
      
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next(false);
      }
    });
    
    // Activate the STOMP client
    this.stompClient.activate();
  }
  
  /**
   * Subscribe to business-specific notification topic
   */
  private subscribeToNotifications(businessId: number): void {
    if (!this.stompClient) {
      return;
    }
    
    const topic = `/topic/notifications/${businessId}`;
    
    this.stompClient.subscribe(topic, (message: IMessage) => {
      try {
        const notification: Notification = JSON.parse(message.body);
        console.log('Received notification:', notification);
        
        // Emit notification to subscribers
        this.notificationsSubject.next(notification);
        
        // Add to history
        this.addToHistory(notification);
        
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });
    
    console.log(`Subscribed to notifications topic: ${topic}`);
  }
  
  /**
   * Add notification to history (limited to maxHistorySize)
   * All notifications are stored, filtering happens in the observable
   */
  private addToHistory(notification: Notification): void {
    const currentHistory = this.allNotificationsSubject.value;
    const notificationId = `${notification.type}-${notification.timestamp}-${notification.businessId}`;
    
    const notificationWithId = {
      ...notification,
      id: notificationId,
      isRead: false
    };
    
    const newHistory = [notificationWithId, ...currentHistory].slice(0, this.maxHistorySize);
    this.allNotificationsSubject.next(newHistory);
  }
  
  /**
   * Check if notification type is high priority
   */
  private isHighPriority(type: NotificationType): boolean {
    return [
      NotificationType.ORDER_CREATED,
      NotificationType.SEATING_ALL_OCCUPIED,
      NotificationType.STOCK_OUT
    ].includes(type);
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectionStatusSubject.next(false);
      console.log('WebSocket disconnected');
    }
  }
  
  /**
   * Clear notification history (only for current user's view)
   */
  clearHistory(): void {
    const allNotifications = this.allNotificationsSubject.value;
    const dismissed = this.getDismissedNotifications();
    
    // Add all visible notifications to dismissed list
    allNotifications.forEach(n => {
      if (n.id) dismissed.add(n.id);
    });
    
    this.saveDismissedNotifications(dismissed);
  }
  
  /**
   * Mark a notification as read (dismiss for current user only)
   */
  markAsRead(notificationId: string): void {
    const dismissed = this.getDismissedNotifications();
    dismissed.add(notificationId);
    this.saveDismissedNotifications(dismissed);
  }
  
  /**
   * Get unread notifications count (filtered by user)
   */
  getUnreadCount(): number {
    const allNotifications = this.allNotificationsSubject.value;
    const dismissed = this.dismissedNotificationsSubject.value;
    return allNotifications.filter(n => !n.id || !dismissed.has(n.id)).length;
  }
  
  /**
   * Load dismissed notifications from localStorage
   */
  loadNotifications(): void {
    this.loadDismissedNotifications();
  }
  
  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.stompClient?.connected ?? false;
  }
  
  /**
   * Get notification count (filtered by user)
   */
  getNotificationCount(): number {
    return this.getUnreadCount();
  }
}
