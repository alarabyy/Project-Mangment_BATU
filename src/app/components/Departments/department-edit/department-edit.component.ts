import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Department } from '../../../models/department'; // Assuming Department is the correct interface
import { DepartmentService } from '../../../Services/department.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-department-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './department-edit.component.html',
  styleUrls: ['./department-edit.component.css']
})
export class DepartmentEditComponent implements OnInit {
  departmentId: number | null = null;
  department: Department | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  error: string | null = null;
  saveSuccess: boolean = false; // To show success message

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    // Get the 'id' parameter from the route snapshot
    const idParam = this.route.snapshot.paramMap.get('id');
    this.departmentId = idParam ? +idParam : null; // Convert to number, handle null

    if (this.departmentId === null || isNaN(this.departmentId) || this.departmentId <= 0) {
      // Handle invalid or missing ID more gracefully
      this.error = 'Invalid or missing Department ID. Please navigate from the departments list.';
      this.isLoading = false;
      return;
    }
    this.loadDepartmentDetails();
  }

  /**
   * @private
   * @method loadDepartmentDetails
   * Loads the details of the department to be edited.
   */
  private loadDepartmentDetails(): void {
    this.isLoading = true;
    this.error = null; // Clear any previous errors

    this.departmentService.getDepartmentById(this.departmentId!).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error fetching department details:', err);
        // Check for specific error statuses if needed (e.g., 404 Not Found)
        if (err.status === 404) {
          this.error = 'Department not found. It might have been deleted.';
        } else {
          this.error = 'Failed to load department details. Please try again later.';
        }
        return of(null); // Return null to indicate no department was loaded
      })
    ).subscribe(data => {
      if (data) {
        this.department = { ...data }; // Create a deep copy to prevent direct mutation of the original data
      } else {
        this.department = null; // No department found or error occurred
        // Error message is set in catchError
      }
    });
  }

  /**
   * @public
   * @method saveChanges
   * Saves the updated department details to the API.
   */
  saveChanges(): void {
    if (!this.department) {
      this.error = 'No department data to save.';
      return;
    }

    // Client-side validation for form fields
    if (!this.department.name || this.department.name.trim() === '') {
      this.error = 'Department Name cannot be empty.';
      return;
    }
    if (!this.department.description || this.department.description.trim() === '') {
      this.error = 'Description cannot be empty.';
      return;
    }
    if (typeof this.department.facultyId !== 'number' || isNaN(this.department.facultyId) || this.department.facultyId <= 0) {
      this.error = 'Faculty ID is required and must be a positive number.';
      return;
    }
    if (typeof this.department.headId !== 'number' || isNaN(this.department.headId) || this.department.headId <= 0) {
      this.error = 'Head ID is required and must be a positive number.';
      return;
    }

    this.isSaving = true;
    this.error = null; // Clear previous errors
    this.saveSuccess = false; // Reset success message

    this.departmentService.updateDepartment(this.department).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        console.error('Error updating department:', err);
        this.error = 'Failed to update department. Please check your input and try again.';
        return of(null); // Return null to indicate the operation failed
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        console.log('Department updated successfully!', response);
        // Navigate back to the list after a short delay to show success message
        setTimeout(() => {
          this.router.navigate(['/DepartmentsList']);
        }, 1500);
      }
    });
  }

  /**
   * @public
   * @method cancel
   * Navigates back to the department list without saving changes.
   */
  cancel(): void {
    this.router.navigate(['/DepartmentsList']); // Navigate back to the list
  }
}
