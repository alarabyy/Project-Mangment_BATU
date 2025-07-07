import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DepartmentCreatePayload } from '../../../models/department';
import { DepartmentService } from '../../../Services/department.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-department-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-create.component.html',
  styleUrls: ['./department-create.component.css']
})
export class DepartmentCreateComponent {
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

  public createDepartment(): void {
    if (this.isFormInvalid()) return;

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.departmentService.createDepartment(this.departmentModel).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        this.errorMessage = err.error?.message || 'Failed to create department. Please try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        setTimeout(() => this.router.navigate(['/DepartmentsList']), 1500);
      }
    });
  }

  public cancel(): void {
    this.router.navigate(['/DepartmentsList']);
  }

  private isFormInvalid(): boolean {
    const model = this.departmentModel;
    if (!model.name || model.name.trim().length < 3) return true;
    if (!model.description || model.description.trim().length < 10) return true;
    if (model.facultyId === null || model.facultyId <= 0) return true;
    if (model.headId === null || model.headId <= 0) return true;
    return false;
  }
}
