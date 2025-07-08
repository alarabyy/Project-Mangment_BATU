import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project, ProjectImage } from '../../../models/project';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {
  projectForm!: FormGroup;
  project: Project | null = null;
  isSubmitting = false;
  isLoading = true;
  pageTitle = 'Loading Project...';
  selectedFile: File | null = null;
  isUploading = false;
  imagesBeingDeleted = new Set<number>();
  private projectId!: number;
  private readonly placeholderImage = 'assets/images/project-placeholder.png';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.router.navigate(['/projects']); return; }
    this.projectId = +idParam;
    this.initializeForm();
    this.loadProjectData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      id: [this.projectId],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      problemStatement: ['', Validators.required],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      grade: [null, [Validators.min(0), Validators.max(100)]],
      leaderId: ['', Validators.required],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required]
    });
  }

  loadProjectData(): void {
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (projectData) => {
        this.project = projectData;
        this.pageTitle = `Edit: ${projectData.title}`;
        this.projectForm.patchValue({
          ...projectData,
          categoryId: projectData.category.id,
          departmentId: projectData.department.id
        });
      },
      error: (err) => { this.router.navigate(['/not-found']); }
    });
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.projectService.updateProject(this.projectForm.value).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => this.router.navigate(['/projects', this.projectId]),
      error: (err) => console.error('Error updating project:', err)
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    this.selectedFile = element.files ? element.files[0] : null;
  }

  onImageUpload(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this.projectService.uploadImage(this.projectId, this.selectedFile).pipe(
      finalize(() => {
        this.isUploading = false;
        this.selectedFile = null;
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      })
    ).subscribe({
      next: () => this.loadProjectData(),
      error: (err) => console.error('Error uploading image:', err)
    });
  }

  deleteImage(image: ProjectImage): void {
    const fileName = image.url.split('/').pop();
    if (!fileName) { console.error("Could not extract filename from URL:", image.url); return; }

    if (confirm(`Are you sure you want to delete this image? (${fileName})`)) {
      this.imagesBeingDeleted.add(image.id);
      this.projectService.deleteImage(this.project!.id, [fileName]).pipe(
        finalize(() => this.imagesBeingDeleted.delete(image.id))
      ).subscribe({
        next: () => this.loadProjectData(),
        error: (err) => {
          console.error('Error deleting image:', err);
          alert('Failed to delete the image. Check the console for more details.');
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    element.src = this.placeholderImage;
  }
}
