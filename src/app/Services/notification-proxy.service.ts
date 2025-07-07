import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this._unreadCount.asObservable();

  constructor() {
    this.loadFromLocalStorage();
  }

  public addNotification(message: string, type: 'success' | 'info' | 'error' = 'success'): void {
    this.playSound();
    const currentNotifications = this._notifications.getValue();
    const newNotification: AppNotification = { id: Date.now(), message, type, timestamp: new Date(), isRead: false };
    const updatedNotifications = [newNotification, ...currentNotifications];
    this._notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  private playSound(): void {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.load();
    audio.play().catch(error => console.error("Audio play failed. User interaction might be required.", error));
  }

  public markAllAsRead(): void {
    const notifications = this._notifications.getValue().map(n => ({ ...n, isRead: true }));
    this._notifications.next(notifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  public toggleReadStatus(id: number): void {
    const currentNotifications = this._notifications.getValue();
    const updatedNotifications = currentNotifications.map(n =>
      n.id === id ? { ...n, isRead: !n.isRead } : n
    );
    this._notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  public deleteNotification(id: number): void {
    const updatedNotifications = this._notifications.getValue().filter(n => n.id !== id);
    this._notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  public clearAll(): void {
    this._notifications.next([]);
    this.updateUnreadCount();
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
