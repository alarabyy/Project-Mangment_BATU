// src/app/components/mail/mail-compose/mail-compose.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm, FormGroup } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MailCreateRequest, MailService } from '../../../Services/mail.service.service';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-mail-compose',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mail-compose.component.html',
  styleUrls: ['./mail-compose.component.css']
})
export class MailComposeComponent implements OnInit {
  composeMailData: MailCreateRequest = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  isSendingMail: boolean = false;
  composeError: string | null = null;
  // composeSuccessMessage: string | null = null; // لن نحتاجه كنص عادي بعد الآن
  showSuccessPopup: boolean = false; // NEW: للتحكم في ظهور الـ Popup

  @ViewChild('mailComposeForm') mailComposeForm!: NgForm;

  constructor(
    private mailService: MailService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.prefillComposeForm();
  }

  private prefillComposeForm(): void {
    if (this.authService.isLoggedIn()) {
      const decodedToken = this.authService.getDecodedToken();
      if (decodedToken) {
        this.composeMailData.name = decodedToken.name || decodedToken.given_name || '';
        this.composeMailData.email = decodedToken.email || '';
      }
    } else {
        console.warn('User not logged in, cannot prefill compose form.');
    }
  }

  onSubmit(): void {
    if (this.mailComposeForm && this.mailComposeForm.valid) {
      this.isSendingMail = true;
      this.composeError = null;
      // this.composeSuccessMessage = null; // إزالة تعيين الرسالة النصية هنا

      this.mailService.createMail(this.composeMailData).pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error sending mail:', err);
          if (err.status >= 400 && err.status < 500) {
            this.composeError = `Failed to send message: ${err.error?.message || err.error?.title || 'Invalid data provided.'}`;
          } else {
            this.composeError = 'An unexpected error occurred. Please try again later.';
          }
          this.isSendingMail = false;
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          // this.composeSuccessMessage = 'Message sent successfully! Redirecting to inbox...'; // إزالة تعيين الرسالة النصية هنا
          this.showSuccessPopup = true; // NEW: إظهار الـ Popup
          console.log('Mail sent successfully:', response);
          this.isSendingMail = false;

          // بعد فترة قصيرة، إخفاء الـ Popup وإعادة التوجيه
          setTimeout(() => {
            this.showSuccessPopup = false; // إخفاء الـ Popup
            this.router.navigate(['/mail/list']); // إعادة التوجيه
          }, 2500); // 2.5 ثانية لعرض الـ Popup
        }
      });
    } else {
      this.composeError = 'Please fill in all required fields correctly.';
      this.markFormGroupTouched(this.mailComposeForm.form);
    }
  }

  goBack(): void {
    this.router.navigate(['allMails']);
  }

  // هذه الدالة ستظل كما هي
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
