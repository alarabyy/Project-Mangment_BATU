// src/app/components/staff/add-staff/add-staff.component.ts

import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { StaffCreatePayload } from '../../../models/staff';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StaffService } from '../../../Services/staff.service';

@Component({
  selector: 'app-add-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-staff.component.html',
  styleUrls: ['./add-staff.component.css']
})
export class AddStaffComponent {
   @ViewChild('staffForm') staffForm!: NgForm;
   @ViewChild('imageInput') imageInput!: { nativeElement: HTMLInputElement };

  staffModel: StaffCreatePayload = {
    name: '',
    position: '',
    about: '',
    image: null
  };
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSaving = false;

  constructor(
    private staffService: StaffService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.staffModel.image = fileList[0];
      console.log('Selected file:', this.staffModel.image.name);
    } else {
      this.staffModel.image = null;
      console.log('No file selected');
    }
  }

  public createStaff(): void {
    if (this.staffForm.invalid) {
        console.warn('Form is invalid. Preventing submission.');
        this.errorMessage = 'Please fill in all required fields correctly.';
        this.successMessage = null;
        return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const payload: StaffCreatePayload = this.staffModel;

    this.staffService.createStaff(payload).pipe(
      finalize(() => this.isSaving = false),
      catchError((err: HttpErrorResponse | Error) => {
        console.error('Create Staff Error caught in component:', err);
        if (err instanceof Error) {
             this.errorMessage = err.message || 'Failed to create staff member. An unexpected error occurred.';
        } else {
            this.errorMessage = 'An unexpected error occurred.';
        }
        this.successMessage = null;
        return of(null);
      })
    ).subscribe(response => {
       console.log('Create Staff Subscribe Response:', response);

       if (response) {
           this.successMessage = 'Staff member created successfully!';
           this.errorMessage = null;
           this.resetForm();
       } else {
            console.log('Create Staff Subscribe received null response (error was handled).');
       }
    });
  }

  public cancel(): void {
    this.router.navigate(['/admin/staff']);
  }

   resetForm(): void {
       this.staffForm.resetForm({
           name: '',
           position: '',
           about: '',
           image: null
       });

       this.staffModel.image = null;
       if (this.imageInput && this.imageInput.nativeElement) {
           this.imageInput.nativeElement.value = '';
       }
       this.errorMessage = null;
       this.successMessage = null;
       this.isSaving = false;
       console.log('Form has been reset.');
   }

   clearImage(): void {
       this.staffModel.image = null;
        if (this.imageInput && this.imageInput.nativeElement) {
           this.imageInput.nativeElement.value = '';
        }
       console.log('Image cleared.');
   }
}
