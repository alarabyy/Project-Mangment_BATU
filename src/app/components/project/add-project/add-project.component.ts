import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { finalize } from 'rxjs';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { SuccessPopupComponent } from '../success-popup/success-popup.component';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SuccessPopupComponent],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isSubmitting = false;
  categories: Category[] = [];
  departments: Department[] = [];

  showSuccessPopup = false;
  popupTitle = '';
  popupMessage = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      grade: [null, [Validators.min(0), Validators.max(100)]],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      problemStatement: ['', Validators.required],
      teamLeaderId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required]
    });
  }

  loadDropdownData(): void {
    this.categoryService.getAllCategories().subscribe({
        next: (data) => this.categories = data,
        error: (err) => console.error('Failed to load categories', err)
    });
    this.departmentService.getAllDepartments().subscribe({
        next: (data) => this.departments = data,
        error: (err) => console.error('Failed to load departments', err)
    });
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;

    const payload = { ...this.projectForm.value, LeaderId: Number(this.projectForm.value.teamLeaderId) };

    this.projectService.createProject(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        if (typeof response === 'string' && response.trim() !== '') {
            alert(response);
        } else {
            this.popupTitle = 'Project Created!';
            this.popupMessage = 'Your project has been successfully created. Find it in the project list to edit it and upload images.';
            this.showSuccessPopup = true;
        }
      },
      error: (err) => {
        console.error('An error occurred during project creation:', err);
        const errorMessage = err.error || 'Failed to create the project.';
        alert(errorMessage);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/ProjectList']);
  }

  closePopup(): void {
    this.showSuccessPopup = false;
  }
}
