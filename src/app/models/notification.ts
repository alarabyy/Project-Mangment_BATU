export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
  timestamp: Date;
  isRead: boolean;
}