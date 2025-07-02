import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Import Router
import { Department } from '../../../models/department';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { DepartmentService } from '../../../Services/department.service';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, RouterModule], // FormsModule is not needed if no forms are present
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.css']
})
export class DepartmentListComponent implements OnInit {
  // UI state variables
  departments: Department[] = [];
  isLoading: boolean = true; // Controls the visibility of the loading indicator
  error: string | null = null; // Stores error messages

  // Modal confirmation window state variables
  isModalVisible = false;
  modalConfig = {
    title: '',
    message: '',
    confirmText: 'Yes',
    cancelText: 'No',
    onConfirm: () => {} // Function to be called when the confirm button is pressed
  };

  /**
   * @constructor
   * Injects required services.
   * @param departmentService - The service responsible for interacting with the departments API.
   * @param router - The Angular Router service for navigation.
   */
  constructor(
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  /**
   * @lifecycle hook ngOnInit
   * The ngOnInit function is one of the component's lifecycle hooks, called when the component is initialized.
   * Here, we start loading the data.
   */
  ngOnInit(): void {
    this.loadDepartments();
  }

  /**
   * @public
   * @method loadDepartments
   * Fetches all departments from the API.
   * Includes handling for loading and error states to improve user experience.
   */
  loadDepartments(): void {
    this.isLoading = true;
    this.error = null; // Reset any previous errors

    this.departmentService.getAllDepartments().pipe(
      // finalize ensures that the loading state is always stopped, whether the operation succeeds or fails
      finalize(() => this.isLoading = false),
      // catchError to safely handle API errors
      catchError(err => {
        console.error('Failed to fetch departments:', err); // Log the full error
        this.error = 'Failed to load departments. Please check your network connection or server status.';
        // Return an empty observable to prevent the application from stopping
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        this.departments = data;
      },
      error: (err) => {
        // This error block will be hit if catchError re-throws or if no catchError is present
        // (but it's handled by catchError above, so this might be redundant in this specific setup)
        console.error('Subscription error in loadDepartments:', err);
      }
    });
  }

  /**
   * @public
   * @method deleteDepartment
   * Opens the confirmation modal before deleting a department.
   * The modal is configured with custom data and a confirmation function.
   * @param department - The department object to be deleted.
   */
  deleteDepartment(department: Department): void {
    this.modalConfig = {
      title: 'Confirm Permanent Deletion',
      message: `You are about to permanently delete the department "${department.name}". This action cannot be undone. Are you absolutely sure you want to proceed?`,
      confirmText: 'Yes, Delete',
      cancelText: 'No, Cancel',
      onConfirm: () => this.executeDelete(department.id) // Use a separate function for clarity
    };
    this.isModalVisible = true;
  }

  /**
   * @private
   * @method executeDelete
   * Executes the actual deletion process after user confirmation.
   * @param departmentId - The ID of the department to be deleted.
   */
  private executeDelete(departmentId: number): void {
    this.departmentService.deleteDepartment(departmentId).subscribe({
      next: () => {
        // Remove the department from the local array to update the UI
        this.departments = this.departments.filter(d => d.id !== departmentId);
        this.isModalVisible = false; // Close the confirmation modal
        console.log(`Department successfully deleted: ${departmentId}`);
      },
      error: (err) => {
        console.error('Error deleting department:', err);
        // Provide a more user-friendly error message
        this.error = 'Failed to delete department. Please try again.';
        this.isModalVisible = false; // Close the modal on error
      }
    });
  }

  /**
   * @public
   * @method confirmModal
   * Handles the confirmation action in the modal.
   */
  confirmModal(): void {
    this.modalConfig.onConfirm();
  }

  /**
   * @public
   * @method cancelModal
   * Handles the cancellation action in the modal.
   */
  cancelModal(): void {
    this.isModalVisible = false;
  }

  /**
   * @public
   * @method trackByDepartmentId
   * Track function for *ngFor to improve performance.
   * Helps Angular efficiently identify items that have changed, been added, or removed.
   * @returns A unique identifier for the item.
   */
  trackByDepartmentId(index: number, department: Department): number {
    return department.id;
  }
}
