import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { finalize, switchMap, forkJoin, of, tap, throwError } from 'rxjs';

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

  ngOnInit(): void { this.initializeForm(); this.loadDropdownData(); }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      grade: [null, [Validators.min(0), Validators.max(100)]],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      problemStatement: ['', Validators.required],
      leaderId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required]
    });
  }

  loadDropdownData(): void {
    this.categoryService.getAllCategories().subscribe(data => this.categories = data);
    this.departmentService.getAllDepartments().subscribe(data => this.departments = data);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) { this.selectedFiles = Array.from(input.files); }
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    const projectData = this.projectForm.value;

    this.projectService.createProject(projectData).pipe(
      switchMap(newProject => {
        if (!newProject || !newProject.id) {
          return throwError(() => new Error('API did not return a valid project after creation.'));
        }
        if (this.selectedFiles.length === 0) { return of(newProject); }

        const uploadObservables = this.selectedFiles.map(file =>
          this.projectService.uploadImage(newProject.id, file)
        );
        return forkJoin(uploadObservables).pipe(
          tap(() => console.log('All images uploaded successfully for new project.'))
        );
      }),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        console.log('Project creation process complete.');
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        console.error('An error occurred during project creation process:', err);
        alert('Failed to create the project. Please check the console for details.');
      }
    });
  }

  onCancel(): void { this.router.navigate(['/projects']); }
}
