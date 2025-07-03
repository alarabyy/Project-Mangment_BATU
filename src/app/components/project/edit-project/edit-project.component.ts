// src/app/components/edit-project/edit-project.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';

@Component({
  selector: 'app-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css'],
    imports: [CommonModule , ReactiveFormsModule],

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
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    if (!this.projectId) {
      this.router.navigate(['/projects']);
      return;
    }

    this.projectForm = this.fb.group({
      id: [this.projectId],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      clientName: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null],
      status: ['Not Started', Validators.required]
    });

    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => this.populateForm(project),
      error: (err) => {
        console.error("Could not fetch project data", err);
        this.router.navigate(['/projects']);
      }
    });
  }

  populateForm(project: Project): void {
    this.pageTitle = `Edit Project: ${project.name}`;
    this.projectForm.patchValue({
      ...project,
      startDate: formatDate(project.startDate, 'yyyy-MM-dd', 'en'),
      endDate: project.endDate ? formatDate(project.endDate, 'yyyy-MM-dd', 'en') : null
    });
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.projectService.updateProject(this.projectForm.value).subscribe({
      next: () => {
        console.log('Project updated successfully!');
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        console.error('Error updating project:', err);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
