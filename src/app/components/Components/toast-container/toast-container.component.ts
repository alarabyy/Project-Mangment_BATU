// src/app/components/Components/toast-container/toast-container.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppNotification } from '../../../models/notification'; // <-- Corrected path
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../Services/notification-proxy.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: AppNotification[] = [];
  private subscription!: Subscription;

  constructor(private notificationService: NotificationService, private zone: NgZone) {}

  ngOnInit(): void {
    // Explicitly type newToasts as AppNotification[]
    this.subscription = this.notificationService.toastNotifications$.subscribe((newToasts: AppNotification[]) => {
      this.zone.run(() => {
        this.toasts = newToasts;
        this.toasts.forEach(toast => {
          if (!toast.isRead && toast.duration && toast.duration > 0) {
            // A small delay before setting the timeout to allow rendering
            setTimeout(() => {
              this.dismissToast(toast.id);
            }, toast.duration);
            // Mark as 'processed' for the toast display logic, not related to the history 'isRead' status
            // This is a temporary flag to ensure timeout is only set once per toast instance
            toast.isRead = true;
          }
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  dismissToast(id: number): void {
    this.notificationService.dismissToast(id);
  }

  // Add this trackById function if you haven't already from previous fix
  trackById(index: number, toast: AppNotification): number {
    return toast.id;
  }
}
