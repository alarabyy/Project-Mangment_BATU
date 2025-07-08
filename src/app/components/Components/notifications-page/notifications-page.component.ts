import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, BehaviorSubject } from 'rxjs';
import { AppNotification } from '../../../models/notification';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { PopupService } from '../../../Services/popup.service'; // Import PopupService
import { NotificationService } from '../../../Services/notification-proxy.service';

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
    private popupService: PopupService, // Inject PopupService
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

  // FIX: Using the popup service for confirmation
  clearAllNotifications(): void {
    this.popupService.showConfirm({
      title: 'Clear All Notifications?',
      message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
      confirmButtonText: 'Yes, Clear All',
      onConfirm: () => {
        this.notificationService.clearAll();
        // Optional: show a success feedback
        this.popupService.showSuccess('Cleared!', 'All notifications have been deleted.');
      }
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    // No need for a popup for a single delete, it's quick. But you could add it.
    this.notificationService.deleteNotification(id);
  }

  // ... rest of the component logic (groupNotifications, getTimeAgo, etc. remain the same)
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
