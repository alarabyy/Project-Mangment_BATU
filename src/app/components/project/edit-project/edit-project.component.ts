import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';



@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isSubmitting = false;
  pageTitle = 'Loading Project...'; // Default title
  private projectId!: number;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Attempt to get the project ID from the route parameters
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      console.error("Project ID is missing from the route.");
      this.router.navigate(['/projects']);
      return;
    }
    this.projectId = +idParam;

    // Initialize the form with the new structure
    this.projectForm = this.fb.group({
      id: [this.projectId], // The ID is crucial for the update operation
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

    // Fetch the project data to populate the form
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => this.populateForm(project),
      error: (err) => {
        console.error("Could not fetch project data", err);
        this.router.navigate(['/projects']); // Redirect if project not found
      }
    });
  }

  /**
   * Populates the form with the fetched project data.
   * @param project The project data from the API.
   */
  populateForm(project: Project): void {
    this.pageTitle = `Edit Project: ${project.title}`;
    // Use patchValue to fill the form with the project data
    this.projectForm.patchValue(project);
  }

  // Helper for easy access to form controls in the template
  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const updatedProject: Project = this.projectForm.value;

    this.projectService.updateProject(updatedProject).subscribe({
      next: () => {
        console.log('Project updated successfully!');
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        console.error('Error updating project:', err);
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
