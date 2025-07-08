import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PopupService, PopupState } from '../../../Services/popup.service'; // تأكد من صحة المسار

@Component({
  selector: 'app-general-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './general-popup.component.html',
  styleUrls: ['./general-popup.component.css']
})
export class GeneralPopupComponent implements OnInit, OnDestroy {
  state: PopupState = { isOpen: false };
  isClosing = false;
  private subscription!: Subscription;

  constructor(private popupService: PopupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = this.popupService.popupState$.subscribe(newState => {
      if (newState.isOpen) {
        this.isClosing = false;
        this.state = newState;
      } else if (this.state.isOpen) {
        this.startCloseAnimation();
      }
      // لا تحتاج إلى detectChanges هنا غالبًا، Angular يقوم بذلك
    });
  }

  // FIX: تم تعديل onConfirm
  onConfirmClick(): void {
    // 1. قم بتنفيذ الإجراء المطلوب أولاً (إذا كان موجودًا)
    if (this.state.onConfirm) {
      this.state.onConfirm();
    }
    // 2. بعد ذلك، اطلب من الخدمة أن تغلق الـ Popup
    // الـ subscribe سيتولى الباقي (الأنيميشن والإخفاء)
    this.popupService.close();
  }

  // FIX: تم تعديل onCancel
  onCancelClick(): void {
    // ببساطة اطلب من الخدمة أن تغلق الـ Popup
    this.popupService.close();
  }

  // FIX: تم تعديل onOverlay
  onOverlayClick(): void {
    // لا تغلق الـ Popup عند النقر على الخلفية إذا كان من نوع 'confirm'
    if (this.state.type !== 'confirm') {
      this.popupService.close();
    }
  }

  private startCloseAnimation(): void {
    this.isClosing = true;
    this.cdr.detectChanges(); // تأكد من أن الـ view يعلم بالتغيير

    setTimeout(() => {
      // بعد انتهاء الأنيميشن، قم بإخفاء العنصر بالكامل
      this.state = { isOpen: false };
      this.isClosing = false;
      this.cdr.detectChanges();
    }, 400); // يجب أن تكون هذه المدة مطابقة لمدة الأنيميشن في CSS
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
