import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Department } from '../../../models/department'; // Ensure this path is correct
import { DepartmentService } from '../../../Services/department.service'; // Ensure this path is correct
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-department-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-edit.component.html',
  styleUrls: ['./department-edit.component.css']
})
export class DepartmentEditComponent implements OnInit {
  departmentId: number | null = null;
  department: Department | null = null; // This will now correctly hold the flattened IDs
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.departmentId = +idParam; // Convert string to number
      this.loadDepartmentDetails();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Department ID is missing from the URL.';
    }
  }

  loadDepartmentDetails(): void {
    if (!this.departmentId) return;

    this.isLoading = true;
    this.departmentService.getDepartmentById(this.departmentId).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        this.errorMessage = err.status === 404
          ? 'Department not found. It might have been deleted.'
          : 'Failed to load department details. Please try again later.';
        console.error('Error loading department:', err);
        return of(null); // Return null to prevent further processing with an invalid department
      })
    ).subscribe(data => {
      this.department = data; // data is now of type Department (with flattened IDs)
    });
  }

  saveChanges(): void {
    // Client-side validation: Check essential fields before sending.
    if (!this.department || !this.department.name) {
      this.errorMessage = 'Please ensure the department name is filled.';
      return;
    }

    // Also ensure facultyId and headId are valid numbers, as they are required for update
    if (this.department.facultyId === null || this.department.facultyId <= 0) {
      this.errorMessage = 'Please provide a valid Faculty ID.';
      return;
    }
    if (this.department.headId === null || this.department.headId <= 0) {
      this.errorMessage = 'Please provide a valid Head ID.';
      return;
    }


    this.isSaving = true;
    this.errorMessage = null; // Clear previous errors
    this.saveSuccess = false; // Reset success state

    // The `this.department` object is sent completely.
    // It is now guaranteed to have `id`, `name`, `description`, `facultyId`, and `headId`
    // due to the mapping in the service.
    this.departmentService.updateDepartment(this.department).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        // More specific error handling based on status code or error body
        console.error('Update Department Error:', err);
        this.errorMessage = err.error?.message || 'Failed to update department. Please try again.';

        if (err.status === 400) {
            this.errorMessage = err.error?.title || 'Bad Request: Please check the data provided.';
            if (err.error?.errors) {
              const validationErrors = Object.values(err.error.errors).flat().join('; ');
              this.errorMessage += ` Details: ${validationErrors}`;
            }
        } else if (err.status === 404) {
            this.errorMessage = 'Department not found on the server. It might have been deleted.';
        } else if (err.status === 409) {
            this.errorMessage = err.error?.message || 'A department with this name already exists.';
        } else if (err.status >= 500) {
            this.errorMessage = 'An internal server error occurred. Please try again later.';
        }
        return of(null);
      })
    ).subscribe(() => {
      this.saveSuccess = true;
      setTimeout(() => this.router.navigate(['/DepartmentsList']), 1500);
    });
  }

  cancel(): void {
    this.router.navigate(['/DepartmentsList']);
  }
}
