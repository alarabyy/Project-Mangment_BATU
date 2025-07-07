import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, BehaviorSubject } from 'rxjs';
import { AppNotification } from '../../models/notification';
// **هذا هو المسار الصحيح والموحّد للخدمة**
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { NotificationService } from '../../Services/notification-proxy.service';

interface GroupedNotifications {
  [key: string]: AppNotification[];
}

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
  groupedNotifications$ = new BehaviorSubject<GroupedNotifications>({});

  constructor(
    private notificationService: NotificationService,
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

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
  }

  private groupNotifications(notifications: AppNotification[]): void {
    const groups: GroupedNotifications = {};
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

  getGroupKeys(groups: GroupedNotifications | null): string[] {
    return groups ? Object.keys(groups) : [];
  }

  getTimeAgo(date: Date | string): string {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: enUS });
  }

  toggleRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.toggleReadStatus(id);
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  clearAllNotifications(): void {
    if (confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      this.notificationService.clearAll();
    }
  }

  trackById(index: number, item: AppNotification): number {
    return item.id;
  }
}
