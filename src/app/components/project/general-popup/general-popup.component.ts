// src/app/components/project/general-popup/general-popup.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Subscription } from 'rxjs';
import { PopupService, PopupState } from '../../../Services/popup.service';

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
    });
  }

  onConfirmClick(): void {
    if (this.state.onConfirm) {
      this.state.onConfirm();
    }
  }

  onCancelClick(): void {
    this.popupService.close();
  }

  onOverlayClick(): void {
    if (this.state.type !== 'confirm') {
      this.popupService.close();
    }
  }

  private startCloseAnimation(): void {
    this.isClosing = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.state = { isOpen: false };
      this.isClosing = false;
      this.cdr.detectChanges();
    }, 400);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
