import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';


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

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Build the form based on the API requirements
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      grade: [0, [Validators.required, Validators.min(0)]],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      problemStatement: ['', Validators.required],
      leaderId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      categoryId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      departmentId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]]
    });
  }

  // Helper for easy access to form controls
  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      console.log('Form is invalid:', this.projectForm.value);
      return;
    }

    this.isSubmitting = true;
    const projectData: Omit<Project, 'id'> = this.projectForm.value;

    this.projectService.createProject(projectData).subscribe({
      next: (response) => {
        console.log('Project created successfully!', response);
        // Navigate to the projects list or the new project's detail page
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        console.error('Error creating project:', err);
        // Optionally, display an error message to the user
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
