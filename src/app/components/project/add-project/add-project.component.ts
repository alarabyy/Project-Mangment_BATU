import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { finalize, switchMap, forkJoin, of, tap, throwError } from 'rxjs';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isSubmitting = false;
  categories: Category[] = [];
  departments: Department[] = [];
  selectedFiles: File[] = [];

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
      // Backend's Project Entity expects TeamLeaderId
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) { this.selectedFiles = Array.from(input.files); }
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;

    // The payload must match the backend's ProjectCreateRequest DTO
    const formValue = this.projectForm.value;
    const payload = {
      title: formValue.title,
      description: formValue.description,
      grade: formValue.grade ?? 0,
      technologies: formValue.technologies,
      toolsUsed: formValue.toolsUsed,
      problemStatement: formValue.problemStatement,
      // The backend service expects 'LeaderId', which maps to 'TeamLeaderId'
      LeaderId: Number(formValue.teamLeaderId),
      categoryId: formValue.categoryId,
      departmentId: formValue.departmentId
    };

    this.projectService.createProject(payload).pipe(
      switchMap(newProject => {
        if (!newProject || !newProject.id) {
          return throwError(() => new Error('API did not return a valid project with an ID after creation.'));
        }
        if (this.selectedFiles.length === 0) {
          return of(newProject);
        }
        const uploadObservables = this.selectedFiles.map(file =>
          this.projectService.uploadImage(newProject.id, file)
        );
        return forkJoin(uploadObservables).pipe(
          tap(() => console.log('All images uploaded successfully.'))
        );
      }),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        console.log('Project creation process complete.');
        this.router.navigate(['/ProjectList']);
      },
      error: (err) => {
        console.error('An error occurred during project creation process:', err);
        // Display the actual error message from the backend if available
        const errorMessage = err.error || 'Failed to create the project. Please check the form data.';
        alert(errorMessage);
      }
    });
  }

  onCancel(): void { this.router.navigate(['/ProjectList']); }
}
