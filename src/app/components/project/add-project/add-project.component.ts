import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms'; // Import FormArray
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { finalize } from 'rxjs';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { SuccessPopupComponent } from '../success-popup/success-popup.component'; // Corrected import path
import { Member } from '../../../models/project'; // Import Member interface

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
      departmentId: [null, Validators.required],
      members: this.fb.array([this.newMember()]) // Initialize with one empty member field
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
  get members() { return this.projectForm.get('members') as FormArray; } // Getter for members FormArray

  newMember(name: string = '', academicId: number | null = null): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      academicId: [academicId, [Validators.required, Validators.min(1), Validators.pattern("^[0-9]*$")]]
    });
  }

  addMember(): void {
    this.members.push(this.newMember());
  }

  removeMember(index: number): void {
    this.members.removeAt(index);
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      // Mark all member controls as touched as well
      this.members.controls.forEach(control => {
        if (control instanceof FormGroup) {
          Object.values(control.controls).forEach(c => c.markAsTouched());
        }
      });
      return;
    }
    this.isSubmitting = true;

    // Construct payload, ensuring LeaderId is a number and members are correctly formatted
    const formValue = this.projectForm.value;
    const payload = {
      title: formValue.title,
      description: formValue.description,
      grade: formValue.grade,
      technologies: formValue.technologies,
      toolsUsed: formValue.toolsUsed,
      problemStatement: formValue.problemStatement,
      // Backend expects 'LeaderId' (PascalCase) for the leader ID.
      teamLeaderId: Number(formValue.teamLeaderId),
      categoryId: formValue.categoryId,
      departmentId: formValue.departmentId,
      // Backend expects 'members' (camelCase) array of objects with 'name' and 'academicId' (camelCase)
      members: formValue.members.map((m: any) => ({
        name: m.name,
        academicId: Number(m.academicId) // Ensure academicId is a number
      }))
    };

    this.projectService.createProject(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        if (typeof response === 'string' && response.trim() !== '') {
            // If the backend sends a plain text success message, display it as an alert
            alert(response);
            this.router.navigate(['/Home']); // Navigate after alert
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
    this.router.navigate(['/Home']);
  }

  closePopup(): void {
    this.showSuccessPopup = false;
    this.router.navigate(['/Home']); // Navigate to home after closing popup
  }
}
