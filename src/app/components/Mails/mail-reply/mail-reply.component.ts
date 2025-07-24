import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs'; // استخدمنا EMPTY هنا
import { Mail, MailReplyRequest, MailService } from '../../../Services/mail.service.service';
import { NotificationService } from '../../../Services/notification-proxy.service';

@Component({
  selector: 'app-mail-reply',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mail-reply.component.html',
  styleUrls: ['./mail-reply.component.css']
})
export class MailReplyComponent implements OnInit {
  mailId: number | null = null;
  originalMail: Mail | null = null;
  replyMessage: string = '';
  isLoading: boolean = true;
  error: string | null = null; // رسالة خطأ عامة للصفحة

  @ViewChild('replyForm') replyForm!: NgForm;

  constructor(
    private route: ActivatedRoute,
    public router: Router, // لازم تكون public عشان تستخدم في الـ HTML
    private mailService: MailService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // استخدمنا subscribe بدل pipe هنا عشان نقدر نتعامل مع الـ ID مباشرة
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.mailId = +id; // تحويل الـ string لـ number
        this.isLoading = true; // ابدأ التحميل
        this.error = null; // امسح أي أخطاء سابقة

        this.mailService.getMailById(this.mailId).pipe(
          catchError(err => {
            console.error('Error fetching mail details from API:', err);
            // لو فيه مشكلة في الـ API، ممكن نطبع تفاصيل أكتر من الـ error object
            let apiErrorMessage = 'حدث خطأ غير متوقع.';
            if (err.status === 404) {
              apiErrorMessage = 'البريد المطلوب غير موجود.';
            } else if (err.status === 0) {
              apiErrorMessage = 'لا يوجد اتصال بالخادم. تحقق من الإنترنت.';
            } else if (err.error && err.error.message) {
              apiErrorMessage = err.error.message; // لو الـ backend بيرجع رسالة خطأ محددة
            } else if (err.message) {
              apiErrorMessage = err.message;
            }

            this.error = `فشل تحميل تفاصيل البريد: ${apiErrorMessage} الرجاء المحاولة مرة أخرى.`;
            this.isLoading = false;
            this.notificationService.showError(this.error); // إظهار رسالة الخطأ للمستخدم
            return EMPTY; // مهم جداً: توقف الـ Observable chain لو حصل خطأ
          })
        ).subscribe(mail => {
          if (mail) {
            this.originalMail = mail;
            // تنسيق الرسالة الأصلية بما فيها التاريخ
            this.replyMessage = `\n\n--- Original Message ---\nFrom: ${this.originalMail.name} <${this.originalMail.email}>\nSubject: ${this.originalMail.subject}\nDate: ${this.originalMail.createdAt ? new Date(this.originalMail.createdAt).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}\n\n${this.originalMail.message}\n------------------------\n\n`;
            this.isLoading = false;

            // لو الرسالة مش مقروءة، علم عليها إنها مقروءة
            if (this.originalMail && !this.originalMail.isRead) {
              this.mailService.markMailAsRead(this.originalMail.id).subscribe({
                next: () => {
                  if (this.originalMail) {
                    this.originalMail.isRead = true; // تحديث الحالة المحلية
                    this.notificationService.showSuccess('تم وضع علامة على الرسالة كمقروءة بنجاح.');
                  }
                },
                error: (markErr) => {
                  console.error('Error marking mail as read:', markErr);
                  this.notificationService.showError('فشل في وضع علامة على الرسالة كمقروءة.');
                }
              });
            }
          } else {
            // لو الـ mail جيه null (من الـ EMPTY) أو لأي سبب آخر
            this.isLoading = false;
            // الـ error message هيكون اتحدد بالفعل في الـ catchError
          }
        });
      } else {
        // لو الـ ID نفسه مش موجود في الـ URL
        this.error = 'معرف البريد (ID) غير موجود في الرابط. لا يمكن تحميل التفاصيل.';
        this.isLoading = false;
        this.notificationService.showError(this.error);
        // ممكن ترجع المستخدم لصفحة قائمة البريد
        this.router.navigate(['/allMails']);
      }
    });
  }

  onSubmitReply(): void {
    if (this.replyForm.invalid || !this.replyMessage.trim() || this.mailId === null) {
      this.notificationService.showWarning('رسالة الرد لا يمكن أن تكون فارغة ويجب أن يكون البريد صالحًا.');
      this.replyForm.control.markAllAsTouched(); // عشان تظهر رسائل التحقق
      return;
    }

    const replyData: MailReplyRequest = {
      id: this.mailId,
      message: this.replyMessage.trim()
    };

    this.mailService.replyMail(replyData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('تم إرسال الرد بنجاح!');
        this.replyMessage = ''; // مسح حقل الرد
        this.replyForm.resetForm(); // إعادة ضبط الفورم
        this.router.navigate(['/allMails']); // الرجوع لصفحة كل الإيميلات
      },
      error: (err) => {
        console.error('Error sending reply:', err);
        let errorMessage = 'فشل في إرسال الرد. الرجاء المحاولة مرة أخرى.';

        if (err.status === 400) {
          errorMessage = 'خطأ في الطلب: تأكد من صحة بيانات الرد.';
        } else if (err.status === 401 || err.status === 403) {
          errorMessage = 'غير مصرح لك بالرد. الرجاء تسجيل الدخول.';
        } else if (err.status === 404) {
          errorMessage = 'معرف البريد غير موجود أو لا يمكن الرد عليه.';
        } else if (err.status === 500) {
          errorMessage = 'خطأ داخلي في الخادم عند إرسال الرد. الرجاء المحاولة لاحقًا.';
        } else if (err.error && typeof err.error === 'object' && err.error.message) {
          // لو الـ backend بيرجع رسالة خطأ محددة في الـ body
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          // لو الـ backend بيرجع رسالة خطأ كنص عادي
          errorMessage = err.error;
        }

        this.notificationService.showError(errorMessage);
      }
    });
  }
}
