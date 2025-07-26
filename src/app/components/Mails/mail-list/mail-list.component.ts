// src/app/components/admin/mail-list/mail-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NotificationService } from '../../../Services/notification-proxy.service'; // تأكد أن هذا المسار صحيح
import { Mail, MailService, MailReplyRequest } from '../../../Services/mail.service.service'; // تأكد أن هذا المسار صحيح

@Component({
  selector: 'app-mail-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './mail-list.component.html',
  styleUrls: ['./mail-list.component.css']
})
export class MailListComponent implements OnInit {
  mails: Mail[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  showReplyModal: boolean = false;
  currentReplyMailId: number | null = null;
  replyMessage: string = '';

  // متغيرات جديدة للحذف
  showDeleteConfirmModal: boolean = false;
  mailToDeleteId: number | null = null;

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

  openReply(mailId: number): void {
    this.currentReplyMailId = mailId;
    this.replyMessage = '';
    this.showReplyModal = true;
  }

  closeReplyModal(): void {
    this.showReplyModal = false;
    this.currentReplyMailId = null;
    this.replyMessage = '';
  }

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
        this.closeReplyModal();
        // اختياري: إذا كنت تريد تحديث حالة الرسالة في القائمة بعد الرد (مثلاً وضع علامة "تم الرد")
        // يمكنك إعادة جلب القائمة: this.fetchMails();
      },
      error: (err) => {
        console.error('Error sending reply:', err);
        this.notificationService.showError('Failed to send reply. Please try again.');
      }
    });
  }

  // دوال جديدة للتعامل مع الحذف
  openDeleteConfirm(mailId: number): void {
    this.mailToDeleteId = mailId;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.mailToDeleteId = null;
  }

  confirmDelete(): void {
    if (this.mailToDeleteId === null) {
      this.notificationService.showError('No mail selected for deletion.');
      this.closeDeleteConfirmModal();
      return;
    }

    this.mailService.deleteMail(this.mailToDeleteId).subscribe({
      next: () => {
        this.notificationService.showSuccess(`Mail ID ${this.mailToDeleteId} deleted successfully.`);
        // إزالة الرسالة من القائمة محلياً لتحديث الواجهة
        this.mails = this.mails.filter(m => m.id !== this.mailToDeleteId);
        this.closeDeleteConfirmModal();
      },
      error: (err) => {
        console.error('Error deleting mail:', err);
        this.notificationService.showError('Failed to delete mail. Please try again.');
        this.closeDeleteConfirmModal();
      }
    });
  }

  navigateToAddMail(): void {
    this.router.navigate(['/mail/compose']);
  }
}
