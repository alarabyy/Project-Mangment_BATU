import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, BehaviorSubject } from 'rxjs';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { NotificationService } from '../../../Services/notification-proxy.service';
import { PopupService } from '../../../Services/popup.service';
import { AppNotification } from '../../../models/notification';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.css']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  private notificationsSubscription!: Subscription;
  isLoading = true;
  groupedNotifications$ = new BehaviorSubject<any>({});

  constructor(
    private notificationService: NotificationService,
    private popupService: PopupService, // Assuming PopupService is available
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notificationService.markAllAsRead();
    this.notificationsSubscription = this.notificationService.notifications$.subscribe(notifications => {
      this.groupNotifications(notifications);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  clearAllNotifications(): void {
    this.popupService.showConfirm({
      title: 'Clear All Notifications?',
      message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
      confirmButtonText: 'Yes, Clear All',
      onConfirm: () => {
        this.notificationService.clearAll();
        // Corrected: Combined messages into a single string argument for showSuccess
        this.notificationService.showSuccess('Cleared! All notifications have been deleted.');
      }
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
    // Optional: show a success feedback toast for this action
    this.notificationService.showSuccess('Notification deleted.', 2000); // This one was already correct
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
  }

  private groupNotifications(notifications: AppNotification[]): void {
    const groups: { [key: string]: AppNotification[] } = {};
    notifications.forEach(n => {
      const date = new Date(n.timestamp);
      let groupKey: string;
      if (isToday(date)) { groupKey = 'Today'; }
      else if (isYesterday(date)) { groupKey = 'Yesterday'; }
      else { groupKey = format(date, 'MMMM d, yyyy'); }
      if (!groups[groupKey]) { groups[groupKey] = []; }
      groups[groupKey].push(n);
    });
    this.groupedNotifications$.next(groups);
  }

  getGroupKeys(groups: any | null): string[] {
    return groups ? Object.keys(groups) : [];
  }

  getTimeAgo(date: Date | string): string {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  toggleRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.toggleReadStatus(id);
  }

  trackById(index: number, item: AppNotification): number {
    return item.id;
  }
}
