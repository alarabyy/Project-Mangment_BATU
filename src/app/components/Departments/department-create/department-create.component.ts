import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DepartmentCreatePayload, Department } from '../../../models/department';
import { DepartmentService } from '../../../Services/department.service';
import { catchError, finalize, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-department-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-create.component.html',
  styleUrls: ['./department-create.component.css']
})
export class DepartmentCreateComponent {
  // Using definite assignment assertion as ViewChild is assigned after constructor
  @ViewChild('departmentForm') departmentForm!: NgForm;

  departmentModel: DepartmentCreatePayload = {
    name: '',
    description: '',
    facultyId: null,
    headId: null
  };
  errorMessage: string | null = null;
  isSaving = false;
  saveSuccess = false;

  constructor(
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  /**
   * Handles the submission of the department creation form.
   */
  public createDepartment(): void {
    // Optional: Additional check if form is invalid before submitting
    if (this.departmentForm.invalid) {
        console.warn('Form is invalid. Preventing submission.');
        this.errorMessage = 'Please fill in all required fields correctly.';
        return; // Prevent submission if form is invalid
    }

    this.isSaving = true;
    this.errorMessage = null; // Clear previous errors on new attempt
    this.saveSuccess = false;

    // Call the service to create the department
    // The service handles its own basic errors; component handles UI-related messages
    this.departmentService.createDepartment(this.departmentModel).pipe(
      finalize(() => this.isSaving = false), // Ensure isSaving is false when observable completes or errors
      catchError((err: HttpErrorResponse) => { // Explicitly type err as HttpErrorResponse
        console.error('Create Department HTTP Error caught in component:', err); // Log the full error object
        console.error('Create Department Error Response Body (err.error):', err.error); // Log the error body

        // Reset the saveSuccess state in case of an error
        this.saveSuccess = false;

        // Set a default error message
        this.errorMessage = 'Failed to create department. Please try again.';

        // Customize message based on HTTP status and error body structure from backend
        if (err.status === 400) {
          // Handle Bad Request (often includes validation errors)
          this.errorMessage = err.error?.title || 'Bad Request: Please check the data provided.';
          if (err.error?.errors) {
            // Attempt to parse common validation error structures (e.g., ASP.NET Core ProblemDetails)
            try {
                const validationErrors = Object.values(err.error.errors).flat().filter(msg => typeof msg === 'string').join('; ');
                 if (validationErrors) {
                     this.errorMessage += ` Details: ${validationErrors}`;
                 }
            } catch (e) {
                console.error('Failed to parse validation errors from err.error.errors', e);
                 if (typeof err.error === 'string' && err.error.length > 0) {
                     this.errorMessage += `: ${err.error}`;
                 }
            }
          } else if (typeof err.error === 'string' && err.error.length > 0) {
             this.errorMessage = `Bad Request: ${err.error}`;
          } else if (err.error && typeof err.error === 'object' && err.error.detail) { // Handle ProblemDetails 'detail'
               this.errorMessage = `Bad Request: ${err.error.detail}`;
          }


        } else if (err.status === 409) {
           // Handle Conflict (e.g., duplicate name)
           this.errorMessage = err.error?.message || 'A department with this name already exists.';
            if (typeof err.error === 'string' && err.error.length > 0) {
                 this.errorMessage = `Conflict: ${err.error}`;
            } else if (err.error && typeof err.error === 'object' && err.error.detail) { // Handle ProblemDetails 'detail'
                 this.errorMessage = `Conflict: ${err.error.detail}`;
            }

        } else if (err.status >= 500) {
           // Handle Server Errors
           this.errorMessage = 'An internal server error occurred. Please try again later.';
            if (typeof err.error === 'string' && err.error.length > 0) {
                 this.errorMessage = `Server Error: ${err.error}`;
            } else if (err.error && typeof err.error === 'object' && err.error.detail) { // Handle ProblemDetails 'detail'
                 this.errorMessage = `Server Error: ${err.error.detail}`;
            }

        } else if (err.status === 0) {
           // Handle network errors, CORS issues, server unreachable
           this.errorMessage = 'Network error or server is unreachable. Please check your connection.';
        }
        else {
           // Handle any other unexpected HTTP error statuses
           this.errorMessage = `An unexpected error occurred (Status: ${err.status}). Please try again.`;
            if (typeof err.error === 'string' && err.error.length > 0) {
                 this.errorMessage += `: ${err.error}`;
            } else if (err.error) {
                 // For non-string error bodies, maybe show JSON or a generic message
                 this.errorMessage += `: ${JSON.stringify(err.error)}`;
            }
        }

        // Return observable of null so the stream completes gracefully and the subscribe next handler is called with null.
        return of(null);
      })
    ).subscribe(response => {
      // This block is executed when the observable stream completes without an error that
      // was *not* handled by catchError (i.e., a successful HTTP 2xx response),
      // OR if catchError was triggered and returned of(null).

      console.log('Create Department Subscribe Response:', response); // Log the successful response body

      // If response is not null, it means a successful HTTP 2xx response was received.
      if (response) {
        console.log('Create Department Success: Setting saveSuccess = true');
        this.saveSuccess = true;
        this.errorMessage = null; // Explicitly clear error message on success

        // Optional: Reset the form after successful submission
        // this.departmentModel = { name: '', description: '', facultyId: null, headId: null };
        // if (this.departmentForm) this.departmentForm.resetForm();

        // Redirect after a short delay
        setTimeout(() => this.router.navigate(['/DepartmentsList']), 1500);
      } else {
         // This block is reached if catchError returned of(null).
         // The error message is already set within the catchError block by catchError.
         console.log('Create Department Subscribe Response is null (an error was caught by catchError)');
         // saveSuccess is already false from the catchError block or initialization
      }
    });
  }

  /**
   * Navigates back to the departments list page.
   */
  public cancel(): void {
    this.router.navigate(['/DepartmentsList']);
  }
}
