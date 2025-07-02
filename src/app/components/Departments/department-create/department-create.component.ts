import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Department, DepartmentCreatePayload } from '../../../models/department';
import { DepartmentService } from '../../../Services/department.service';
// CORRECTED PATH: Using lowercase 'services'

@Component({
  selector: 'app-department-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  isLoading: boolean = false;

  constructor(
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid || this.departmentModel.facultyId === null || this.departmentModel.headId === null) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    const payloadToSend = {
      name: this.departmentModel.name,
      description: this.departmentModel.description,
      facultyId: this.departmentModel.facultyId,
      headId: this.departmentModel.headId
    };
    this.departmentService.createDepartment(payloadToSend as any).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Department created successfully!');
        this.router.navigate(['/department-list']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create department. Please try again.';
        console.error('Create error:', err);
      }
    });
  }
}
