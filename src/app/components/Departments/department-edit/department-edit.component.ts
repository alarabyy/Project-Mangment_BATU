import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Department } from '../../../models/department';
import { DepartmentService } from '../../../Services/department.service';
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
  department: Department | null = null;
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
      this.departmentId = +idParam;
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
          : 'Failed to load department details.';
        return of(null);
      })
    ).subscribe(data => {
      this.department = data;
    });
  }

  saveChanges(): void {
    // التحقق من صحة الحقول المعروضة فقط
    if (!this.department || !this.department.name || this.department.description.length < 10) {
      this.errorMessage = 'Please ensure the department name is filled and the description is at least 10 characters long.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    // يتم إرسال الكائن `this.department` بالكامل، والذي لا يزال يحتوي على
    // `facultyId` و `headId` الأصليين لضمان عدم فقدانهما.
    // The `this.department` object is sent completely, which still contains
    // the original `facultyId` and `headId` to ensure they are not lost.
    this.departmentService.updateDepartment(this.department).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        // More specific error handling based on status code or error body
        this.errorMessage = err.error?.message || 'Failed to update department. Please try again.';
        if (err.status === 400) {
            // This suggests a validation error from the backend (e.g., missing fields)
            console.error('Bad Request Error:', err.error);
            this.errorMessage = err.error?.title || 'Bad Request: Please check the data provided.';
            // If the backend sends an array of errors, you might want to display them
            if (err.error?.errors) {
              this.errorMessage += ' Details: ' + JSON.stringify(err.error.errors);
            }
        } else if (err.status === 404) {
            this.errorMessage = 'Department not found on the server. It might have been deleted.';
        }
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        setTimeout(() => this.router.navigate(['/DepartmentsList']), 1500);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/DepartmentsList']);
  }
}
