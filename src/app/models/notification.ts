// Assuming this file exists and defines AppNotification
export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error'; // Added 'warning'
  timestamp: Date;
  isRead: boolean;
  duration?: number;
}
