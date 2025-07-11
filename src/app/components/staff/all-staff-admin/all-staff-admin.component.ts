// src/app/components/staff/all-staff-admin/all-staff-admin.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Staff, StaffUpdatePayload } from '../../../models/staff';
import { catchError, finalize } from 'rxjs/operators';
import { of, ObservableInput } from 'rxjs'; // استورد ObservableInput لتصحيح خطأ catchError
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { StaffService } from '../../../Services/staff.service';

interface StaffWithUI extends Staff {
  isEditing?: boolean;
  editModel?: StaffUpdatePayload;
  selectedEditImageFile?: File;
  isSavingEdit?: boolean;
  editErrorMessage?: string | null;
}

@Component({
  selector: 'app-all-staff-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './all-staff-admin.component.html',
  styleUrls: ['./all-staff-admin.component.css']
})
export class AllStaffAdminComponent implements OnInit {
  staffMembers: StaffWithUI[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  isDeleting = false;

  constructor(private staffService: StaffService) { }

  ngOnInit(): void {
    this.loadStaff();
  }

  isAnyOperationInProgress(): boolean {
      return this.isDeleting || this.staffMembers.some(s => s.isEditing === true || s.isSavingEdit === true);
  }

   isStaffItemBusy(staff: StaffWithUI): boolean {
       return staff.isEditing === true || staff.isSavingEdit === true;
   }

  loadStaff(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.staffService.getAllStaff().pipe(
      finalize(() => this.isLoading = false),
      catchError((err: HttpErrorResponse | Error) => {
        console.error('Load Staff Error caught in component:', err);
        if (err instanceof Error) {
             this.errorMessage = err.message || 'Failed to load staff members. An unexpected error occurred.';
        } else {
            this.errorMessage = 'An unexpected error occurred.';
        }
        return of([]);
      })
    ).subscribe(staff => {
      this.staffMembers = staff.map(s => ({
          ...s,
          isEditing: false,
          editModel: {
              id: s.id,
              name: s.name,
              position: s.position,
              about: s.about,
               image: undefined,
               removeImage: false
          },
          selectedEditImageFile: undefined,
          isSavingEdit: false,
          editErrorMessage: null
      }));
       console.log('Loaded Staff (Admin):', this.staffMembers);
    });
  }

   getStaffImageUrl(imagePath: string | undefined | null): string | undefined {
       return this.staffService.getStaffImageUrl(imagePath);
   }

  confirmDelete(staff: StaffWithUI): void {
     if (this.isAnyOperationInProgress()) {
         console.log('Another operation is in progress. Cannot initiate delete.');
         return;
     }
     if (this.isStaffItemBusy(staff)) {
          console.log('This item is busy. Cannot delete.');
          return;
     }

    if (confirm(`Are you sure you want to delete ${staff.name}? This action cannot be undone.`)) {
      this.deleteStaff(staff);
    }
  }

  // CORRECTED: تم تصحيح نوع `staff` إلى `StaffWithUI`
  deleteStaff(staff: StaffWithUI): void {
    this.isDeleting = true;
    this.errorMessage = null;

    this.staffService.deleteStaff(staff.id).pipe(
      finalize(() => this.isDeleting = false),
      catchError((err: HttpErrorResponse | Error): ObservableInput<any> => { // CORRECTED: يجب أن تعيد ObservableInput
        console.error('Delete Staff Error caught in component:', err);
        if (err instanceof Error) {
             this.errorMessage = err.message || `Failed to delete ${staff.name}. An unexpected error occurred.`;
        } else {
            this.errorMessage = 'An unexpected error occurred.';
        }
        return of(null); // CORRECTED: يجب أن تعيد قيمة
      })
    ).subscribe(response => {
      console.log('Delete Staff Response:', response);
      if (response !== null) {
         this.staffMembers = this.staffMembers.filter(s => s.id !== staff.id);
          console.log(`${staff.name} deleted successfully.`);
         this.errorMessage = null;
      } else {
         console.log(`Delete Staff Subscribe received null response for ${staff.name}. Error handled by catchError.`);
      }
    });
  }

  toggleEdit(staff: StaffWithUI): void {
      if (this.isAnyOperationInProgress() && !(staff.isEditing === true && staff.isSavingEdit !== true)) {
           console.log('Another operation is in progress or this item is saving. Cannot toggle edit.');
           return;
      }

      this.staffMembers.forEach(s => {
          if (s.id !== staff.id && s.isEditing === true) {
              s.isEditing = false;
              s.editErrorMessage = null;
              s.selectedEditImageFile = undefined;
               if (s.editModel) {
                    s.editModel.name = s.name;
                    s.editModel.position = s.position;
                    s.editModel.about = s.about;
                    s.editModel.image = undefined;
                    s.editModel.removeImage = false;
               }
              console.log(`Closed edit form for ${s.name}. Changes discarded.`);
          }
      });

      staff.isEditing = !staff.isEditing;

      if (staff.isEditing) {
          staff.editModel = {
              id: staff.id,
              name: staff.name,
              position: staff.position,
              about: staff.about,
               image: undefined,
               removeImage: false
          };
          staff.selectedEditImageFile = undefined;
          staff.editErrorMessage = null;
          console.log(`Opened edit form for ${staff.name}.`);

      } else {
         staff.editErrorMessage = null;
         staff.selectedEditImageFile = undefined;
          if (staff.editModel) {
              staff.editModel.name = staff.name;
              staff.editModel.position = staff.position;
              staff.editModel.about = staff.about;
              staff.editModel.image = undefined;
              staff.editModel.removeImage = false;
          }
           console.log(`Closed edit form for ${staff.name}. Changes discarded.`);
      }
  }

  onEditFileSelected(event: Event, staff: StaffWithUI): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      staff.selectedEditImageFile = file;
      console.log(`Selected file for edit for ${staff.name}:`, staff.selectedEditImageFile.name);
       if (staff.editModel) {
           staff.editModel.image = staff.selectedEditImageFile;
           staff.editModel.removeImage = false;
       }
       staff.editErrorMessage = null;

    } else {
      staff.selectedEditImageFile = undefined;
      if (staff.editModel) {
          staff.editModel.image = undefined;
          staff.editModel.removeImage = false;
      }
      console.log(`File selection cancelled for ${staff.name}. No new file selected, reverted to keeping existing.`);
    }
  }

   clearSelectedEditImage(staff: StaffWithUI): void {
        staff.selectedEditImageFile = undefined;
        if (staff.editModel) {
            staff.editModel.image = undefined;
            staff.editModel.removeImage = false;
        }
        console.log(`Selected new image cleared for ${staff.name}. Existing image will be kept.`);
        staff.editErrorMessage = null;
   }

   markExistingImageForRemoval(staff: StaffWithUI): void {
       staff.selectedEditImageFile = undefined;
       if (staff.editModel) {
           staff.editModel.image = undefined;
           staff.editModel.removeImage = true;
       }
        console.log(`Existing image for ${staff.name} marked for removal.`);
        staff.editErrorMessage = null;
   }

  saveEdit(staff: StaffWithUI, form: NgForm): void {
      if (form.invalid) {
          console.warn(`Edit form for ${staff.name} is invalid. Preventing save.`);
          staff.editErrorMessage = 'Please fill in all required fields correctly.';
          return;
      }
      if (this.isDeleting || this.staffMembers.some(s => s.id !== staff.id && (s.isEditing === true || s.isSavingEdit === true))) {
          console.warn('Another operation is in progress. Cannot save edit.');
          staff.editErrorMessage = 'Another operation is in progress. Please wait.';
          return;
      }

      staff.isSavingEdit = true;
      staff.editErrorMessage = null;

      const updatePayload: StaffUpdatePayload = staff.editModel!;

      this.staffService.updateStaff(updatePayload).pipe(
          finalize(() => staff.isSavingEdit = false),
          catchError((err: HttpErrorResponse | Error): ObservableInput<any> => { // CORRECTED: يجب أن تعيد ObservableInput
              console.error(`Save Edit Staff Error for ${staff.name} caught in component:`, err);
              if (err instanceof Error) {
                  staff.editErrorMessage = err.message || `Failed to update ${staff.name}. An unexpected error occurred.`;
              } else {
                  staff.editErrorMessage = 'An unexpected error occurred during update.';
              }
              return of(null); // CORRECTED: يجب أن تعيد قيمة
          })
      ).subscribe(response => {
          console.log(`Save Edit Staff Response for ${staff.name}:`, response);
          if (response !== null) {
               console.log(`${staff.name} updated successfully. Triggering full staff list reload.`);
               staff.editErrorMessage = null;
               this.loadStaff();
          } else {
             console.log(`Save Edit Staff Subscribe received null response for ${staff.name}. Error handled by catchError.`);
          }
      });
  }

  // CORRECTED: إضافة دالة cancelEdit المفقودة
  cancelEdit(staff: StaffWithUI): void {
       if (staff.isSavingEdit === true) {
           console.log('Item is currently saving. Cannot cancel edit.');
           return;
       }

      staff.isEditing = false;
      staff.editErrorMessage = null;
      staff.selectedEditImageFile = undefined;

       if (staff.editModel) {
           staff.editModel.name = staff.name;
           staff.editModel.position = staff.position;
           staff.editModel.about = staff.about;
           staff.editModel.image = undefined;
           staff.editModel.removeImage = false;
       }
       console.log(`Edit for ${staff.name} cancelled. Changes discarded.`);
  }

  // CORRECTED: إضافة دالة trackById المفقودة
   trackById(index: number, item: StaffWithUI): number {
       return item.id;
   }
}
