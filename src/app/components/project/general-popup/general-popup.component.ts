import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PopupService, PopupState } from '../../../Services/popup.service'; // Adjust path

@Component({
  selector: 'app-general-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './general-popup.component.html',
  styleUrls: ['./general-popup.component.css']
})
export class GeneralPopupComponent implements OnInit, OnDestroy {
  state: PopupState = { isOpen: false };
  private subscription!: Subscription;

  constructor(private popupService: PopupService) {}

  ngOnInit(): void {
    this.subscription = this.popupService.popupState$.subscribe(state => {
      this.state = state;
    });
  }

  onConfirm() {
    if (this.state.onConfirm) {
      this.state.onConfirm();
    }
  }

  onCancel() {
    this.popupService.close();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
