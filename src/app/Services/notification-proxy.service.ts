import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification } from '../models/notification'; // تأكد من المسار ده

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this._unreadCount.asObservable();

  private _toastNotifications = new BehaviorSubject<AppNotification[]>([]);
  public toastNotifications$: Observable<AppNotification[]> = this._toastNotifications.asObservable();

  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio('assets/sounds/notification.wav');
    this.audio.load();
    this.loadFromLocalStorage();
  }

  public showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration?: number): void {
    this.playSound();

    const newNotification: AppNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      isRead: false,
      duration
    };

    const currentNotifications = this._notifications.getValue();
    const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50);
    this._notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();

    if (duration !== undefined && duration > 0) {
      const currentToasts = this._toastNotifications.getValue();
      this._toastNotifications.next([...currentToasts, newNotification]);
    }
  }

  public showSuccess(message: string, duration: number = 3000): void {
    this.showNotification(message, 'success', duration);
  }

  public showInfo(message: string, duration: number = 5000): void {
    this.showNotification(message, 'info', duration);
  }

  // تم إضافة الدالة دي:
  public showWarning(message: string, duration: number = 5000): void {
    this.showNotification(message, 'warning', duration);
  }

  public showError(message: string, duration: number = 7000): void {
    this.showNotification(message, 'error', duration);
  }

  public dismissToast(id: number): void {
    const currentToasts = this._toastNotifications.getValue();
    this._toastNotifications.next(currentToasts.filter(n => n.id !== id));
  }

  private playSound(): void {
    this.audio.currentTime = 0;
    this.audio.play().catch(error => {
      console.warn("Notification audio play was prevented (user interaction required):", error);
    });
  }

  public markAllAsRead(): void {
    const notifications = this._notifications.getValue().map(n => ({ ...n, isRead: true }));
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  public toggleReadStatus(id: number): void {
    const notifications = this._notifications.getValue().map(n =>
      n.id === id ? { ...n, isRead: !n.isRead } : n
    );
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  public deleteNotification(id: number): void {
    const notifications = this._notifications.getValue().filter(n => n.id !== id);
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  public clearAll(): void {
    this._notifications.next([]);
    this._unreadCount.next(0);
    localStorage.removeItem('app-notifications');
  }

  private updateUnreadCount(): void {
    const count = this._notifications.getValue().filter(n => !n.isRead).length;
    this._unreadCount.next(count);
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('app-notifications', JSON.stringify(this._notifications.getValue()));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('app-notifications');
    if (stored) {
      const notifications: AppNotification[] = JSON.parse(stored).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      this._notifications.next(notifications);
      this.updateUnreadCount();
    }
  }
}
