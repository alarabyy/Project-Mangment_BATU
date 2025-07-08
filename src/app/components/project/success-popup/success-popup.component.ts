import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-popup.component.html',
  styleUrls: ['./success-popup.component.css']
})
export class SuccessPopupComponent {
  // المدخلات للتحكم في محتوى الـ Popup
  @Input() title: string = 'Success!';
  @Input() message: string = 'Operation completed successfully.';
  @Input() confirmButtonText: string = 'Continue';
  @Input() cancelButtonText: string = 'Close';

  // المدخلات للتحكم في التنقل
  @Input() confirmNavigationPath: string | null = null;
  @Input() cancelNavigationPath: string | null = null;

  // مدخل جديد للتحكم في نوع الأيقونة واللون
  @Input() popupType: 'success' | 'error' | 'confirm' = 'success';

  // المخرجات لإعلام المكون الأب بالإغلاق
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  onConfirm(): void {
    if (this.confirmNavigationPath) {
      this.router.navigate([this.confirmNavigationPath]);
    }
    // دائمًا أغلق الـ Popup بعد الضغط
    this.close.emit();
  }

  onCancel(): void {
    if (this.cancelNavigationPath) {
        this.router.navigate([this.cancelNavigationPath]);
    }
    // دائمًا أغلق الـ Popup بعد الضغط
    this.close.emit();
  }

  // دالة لإغلاق الـ Popup عند النقر على الخلفية
  onOverlayClick(): void {
    // نغلق الـ Popup فقط إذا كان من النوع 'success' أو 'error'
    // في حالة 'confirm'، يجب على المستخدم اختيار زر.
    if (this.popupType !== 'confirm') {
      this.close.emit();
    }
  }
}
