import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PopupType = 'success' | 'error' | 'confirm';

export interface PopupState {
  isOpen: boolean;
  type?: PopupType;
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupState = new BehaviorSubject<PopupState>({ isOpen: false });
  public popupState$ = this.popupState.asObservable();

  showSuccess(title: string, message: string, onConfirm?: () => void) {
    this.popupState.next({
      isOpen: true,
      type: 'success',
      title,
      message,
      confirmButtonText: 'OK',
      onConfirm: onConfirm || (() => this.close()),
    });
  }

  showError(title: string, message: string, onConfirm?: () => void) {
    this.popupState.next({
      isOpen: true,
      type: 'error',
      title,
      message,
      confirmButtonText: 'Close',
      onConfirm: onConfirm || (() => this.close()),
    });
  }

  showConfirm(config: { title: string; message: string; onConfirm: () => void; confirmButtonText?: string; cancelButtonText?: string; }) {
    this.popupState.next({
      isOpen: true,
      type: 'confirm',
      title: config.title,
      message: config.message,
      confirmButtonText: config.confirmButtonText || 'Confirm',
      cancelButtonText: config.cancelButtonText || 'Cancel',
      onConfirm: () => {
        config.onConfirm();
        this.close();
      },
    });
  }

  close() {
    this.popupState.next({ isOpen: false });
  }
}
