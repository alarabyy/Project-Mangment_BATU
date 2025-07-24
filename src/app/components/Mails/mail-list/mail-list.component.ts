import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // **أضف هذا الاستيراد**

import { NotificationService } from '../../../Services/notification-proxy.service';
import { Mail, MailService, MailReplyRequest } from '../../../Services/mail.service.service';

@Component({
  selector: 'app-mail-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule], // **أضف FormsModule هنا**
  templateUrl: './mail-list.component.html',
  styleUrls: ['./mail-list.component.css']
})
export class MailListComponent implements OnInit {
  mails: Mail[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  // **متغيرات جديدة للتعامل مع المودال**
  showReplyModal: boolean = false;
  currentReplyMailId: number | null = null;
  replyMessage: string = ''; // لربطها بـ textarea في المودال

  constructor(
    private mailService: MailService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchMails();
  }

  fetchMails(): void {
    this.isLoading = true;
    this.error = null;
    this.mailService.listMails().subscribe({
      next: (data) => {
        this.mails = data;
        this.isLoading = false;
        this.notificationService.showInfo('Mails loaded successfully.');
      },
      error: (err) => {
        console.error('Error fetching mails:', err);
        this.error = 'Failed to load mail messages. Please try again.';
        this.isLoading = false;
        this.notificationService.showError('Failed to load mail messages.');
      }
    });
  }

  markAsRead(mail: Mail): void {
    if (!mail.isRead) {
      this.mailService.markMailAsRead(mail.id).subscribe({
        next: () => {
          mail.isRead = true;
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
   * يفتح المودال للرد على رسالة معينة.
   * @param mailId معرف الرسالة للرد عليها.
   */
  openReply(mailId: number): void {
    this.currentReplyMailId = mailId;
    this.replyMessage = ''; // مسح أي رسالة سابقة في textarea
    this.showReplyModal = true;
  }

  /**
   * يغلق مودال الرد ويمسح البيانات المؤقتة.
   */
  closeReplyModal(): void {
    this.showReplyModal = false;
    this.currentReplyMailId = null;
    this.replyMessage = '';
  }

  /**
   * يرسل الرد الفعلي باستخدام MailService.
   */
  sendReply(): void {
    if (this.currentReplyMailId === null || !this.replyMessage.trim()) {
      this.notificationService.showWarning('Please enter a reply message.');
      return;
    }

    const replyData: MailReplyRequest = {
      id: this.currentReplyMailId,
      message: this.replyMessage.trim()
    };

    this.mailService.replyMail(replyData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Reply sent successfully!');
        this.closeReplyModal(); // إغلاق المودال بعد الإرسال بنجاح
        // اختياري: إذا كنت تريد تحديث حالة الرسالة في القائمة بعد الرد (مثلاً وضع علامة "تم الرد")
        // يمكنك إعادة جلب القائمة: this.fetchMails();
      },
      error: (err) => {
        console.error('Error sending reply:', err);
        this.notificationService.showError('Failed to send reply. Please try again.');
        // قد ترغب في عدم إغلاق المودال في حالة الخطأ للسماح للمستخدم بالمحاولة مرة أخرى
      }
    });
  }

  navigateToAddMail(): void {
    this.router.navigate(['/mail/compose']);
  }
}
