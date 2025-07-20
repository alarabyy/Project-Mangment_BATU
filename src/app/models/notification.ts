// src/app/models/notification.ts
export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
  timestamp: Date;
  isRead: boolean;
  duration?: number; // Optional: how long toast should show in milliseconds
}
