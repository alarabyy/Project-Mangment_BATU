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
  @Input() title: string = 'Success!';
  @Input() message: string = 'Operation completed successfully.';
  @Input() confirmButtonText: string = 'Continue';
  @Input() cancelButtonText: string = 'Close';
  @Input() confirmNavigationPath: string | null = null;
  @Input() cancelNavigationPath: string | null = null;

  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  onConfirm(): void {
    if (this.confirmNavigationPath) {
      this.router.navigate([this.confirmNavigationPath]);
    }
    this.close.emit();
  }

  onCancel(): void {
    if (this.cancelNavigationPath) {
        this.router.navigate([this.cancelNavigationPath]);
    }
    this.close.emit();
  }
}
