import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../Services/notification-proxy.service';
import { Mail, MailService } from '../../../Services/mail.service.service'; // تأكد من استيراد Mail هنا

@Component({
  selector: 'app-mail-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './mail-list.component.html',
  styleUrls: ['./mail-list.component.css']
})
export class MailListComponent implements OnInit {
  // Array to hold mail objects
  mails: Mail[] = [];
  // Flag to indicate if data is being loaded
  isLoading: boolean = true;
  // Holds error messages if data fetching fails
  error: string | null = null;

  constructor(
    private mailService: MailService,
    private router: Router,
    private notificationService: NotificationService // Inject NotificationService
  ) { }

  ngOnInit(): void {
    // Fetch mails when the component initializes
    this.fetchMails();
  }

  /**
   * Fetches the list of mails from the mail service.
   * Updates loading state, handles success and error notifications.
   */
  fetchMails(): void {
    this.isLoading = true;
    this.error = null;
    this.mailService.listMails().subscribe({
      next: (data) => {
        this.mails = data;
        this.isLoading = false;
        this.notificationService.showInfo('Mails loaded successfully.'); // Info message on load
      },
      error: (err) => {
        console.error('Error fetching mails:', err);
        this.error = 'Failed to load mail messages. Please try again.';
        this.isLoading = false;
        this.notificationService.showError('Failed to load mail messages.');
      }
    });
  }

  /**
   * Marks a specific mail as read.
   * Only proceeds if the mail is not already marked as read.
   * Updates local state and shows success/error notifications.
   * @param mail The mail object to mark as read.
   */
  markAsRead(mail: Mail): void {
    if (!mail.isRead) { // Only mark if not already read
      this.mailService.markMailAsRead(mail.id).subscribe({
        next: () => {
          mail.isRead = true; // Update local state
          this.notificationService.showSuccess('Message successfully marked as read.');
        },
        error: (err) => {
          console.error('Error marking mail as read:', err);
          this.notificationService.showError('Failed to mark message as read.');
        }
      });
    }
  }

  /**
   * Navigates to the reply page for a specific mail.
   * @param mailId The ID of the mail to reply to.
   */
  openReply(mailId: number): void {
    // **تم التصحيح هنا:** يجب أن يكون المسار بدون ':id' عند التوجيه البرمجي.
    this.router.navigate(['/replayMails', mailId]);
  }

  /**
   * Navigates to the Add Mail page.
   */
  navigateToAddMail(): void {
    this.router.navigate(['/mail/compose']); // Navigate to the '/mail/compose' path
  }
}
