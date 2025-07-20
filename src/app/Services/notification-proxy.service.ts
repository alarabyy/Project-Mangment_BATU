// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // For the persistent list of notifications (e.g., on a notifications page)
  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this._notifications.asObservable();

  // For unread count display (e.g., in a header badge)
  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this._unreadCount.asObservable();

  // For transient/toast notifications that appear and fade away
  private _toastNotifications = new BehaviorSubject<AppNotification[]>([]);
  public toastNotifications$: Observable<AppNotification[]> = this._toastNotifications.asObservable();

  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio('assets/sounds/notification.wav');
    this.audio.load();
    this.loadFromLocalStorage();
  }

  /**
   * Triggers a new notification. This will add it to the historical list
   * and potentially trigger a transient toast display if duration is provided.
   * @param message The notification message (can be HTML for advanced use).
   * @param type The type of notification ('success', 'info', 'error').
   * @param duration Optional duration for toast display in milliseconds. If 0 or undefined, it won't show as a toast.
   */
  public showNotification(message: string, type: 'success' | 'info' | 'error' = 'info', duration?: number): void {
    this.playSound();

    const newNotification: AppNotification = {
      id: Date.now(), // Unique ID for each notification
      message,
      type,
      timestamp: new Date(),
      isRead: false,
      duration // Pass duration to the notification object
    };

    // Add to the persistent list (for the Notifications Page)
    const currentNotifications = this._notifications.getValue();
    const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50); // Limit size for history
    this._notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();

    // If duration is specified, also add to the transient list (for toasts)
    if (duration !== undefined && duration > 0) {
      const currentToasts = this._toastNotifications.getValue();
      this._toastNotifications.next([...currentToasts, newNotification]);
    }
  }

  /** Convenience method for success notifications (default toast duration 3s). */
  public showSuccess(message: string, duration: number = 3000): void {
    this.showNotification(message, 'success', duration);
  }

  /** Convenience method for informational notifications (default toast duration 5s). */
  public showInfo(message: string, duration: number = 5000): void {
    this.showNotification(message, 'info', duration);
  }

  /** Convenience method for error notifications (default toast duration 7s). */
  public showError(message: string, duration: number = 7000): void {
    this.showNotification(message, 'error', duration);
  }

  /** Removes a toast notification from the transient list (called by ToastContainer). */
  public dismissToast(id: number): void {
    const currentToasts = this._toastNotifications.getValue();
    this._toastNotifications.next(currentToasts.filter(n => n.id !== id));
  }

  // --- Existing methods from original code (adjusted for internal calls) ---

  private playSound(): void {
    this.audio.currentTime = 0; // Rewind to start for quick replays
    this.audio.play().catch(error => {
      console.warn("Notification audio play was prevented (user interaction required):", error);
    });
  }

  /** Marks all current persistent notifications as read. */
  public markAllAsRead(): void {
    const notifications = this._notifications.getValue().map(n => ({ ...n, isRead: true }));
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  /** Toggles the read status of a specific persistent notification. */
  public toggleReadStatus(id: number): void {
    const notifications = this._notifications.getValue().map(n =>
      n.id === id ? { ...n, isRead: !n.isRead } : n
    );
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  /** Deletes a specific persistent notification. */
  public deleteNotification(id: number): void {
    const notifications = this._notifications.getValue().filter(n => n.id !== id);
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  /** Clears all persistent notifications and local storage. */
  public clearAll(): void {
    this._notifications.next([]);
    this._unreadCount.next(0); // Also reset unread count immediately
    localStorage.removeItem('app-notifications');
  }

  /** Recalculates and updates the unread notification count. */
  private updateUnreadCount(): void {
    const count = this._notifications.getValue().filter(n => !n.isRead).length;
    this._unreadCount.next(count);
  }

  /** Saves current persistent notifications to local storage. */
  private saveToLocalStorage(): void {
    localStorage.setItem('app-notifications', JSON.stringify(this._notifications.getValue()));
  }

  /** Loads persistent notifications from local storage on service initialization. */
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('app-notifications');
    if (stored) {
      // Parse dates correctly when loading from JSON
      const notifications: AppNotification[] = JSON.parse(stored).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      this._notifications.next(notifications);
      this.updateUnreadCount();
    }
  }
}
