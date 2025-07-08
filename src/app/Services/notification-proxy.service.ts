// src/app/Services/notification-proxy.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService { // Renamed from NotificationProxyService for clarity

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this._unreadCount.asObservable();

  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio('assets/sounds/notification.wav');
    this.audio.load(); // Preload the audio
    this.loadFromLocalStorage();
  }

  // This is a central method to trigger notifications from other services (e.g., project service)
  public showNotification(message: string, type: 'success' | 'info' | 'error' = 'success'): void {
    // Only play sound if there's user interaction context, but for now we try.
    this.playSound();

    const currentNotifications = this._notifications.getValue();
    const newNotification: AppNotification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date(),
        isRead: false
    };
    const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50); // Keep only the last 50
    this._notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveToLocalStorage();
  }

  private playSound(): void {
    this.audio.currentTime = 0; // Rewind to start
    this.audio.play().catch(error => {
      // This error is expected in modern browsers if the user hasn't interacted with the page yet.
      // We can safely ignore it or log it minimally.
      console.log("Audio play was prevented. This is normal until the user clicks something.");
    });
  }

  // Methods for the notifications page
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
    this.updateUnreadCount();
    localStorage.removeItem('app-notifications');
  }

  // Helper methods
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
