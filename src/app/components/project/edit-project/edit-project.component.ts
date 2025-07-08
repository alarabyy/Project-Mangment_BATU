import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';
import { finalize, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  selectedFiles: File[] = [];
  isUploading = false;
  imagesBeingDeleted = new Set<string>();
  private projectId!: number;

  public readonly imageBaseUrl = environment.imageBaseUrl;
  private readonly placeholderImage = 'assets/images/project-placeholder.png';

  constructor(private fb: FormBuilder, private projectService: ProjectService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.router.navigate(['/ProjectList']); return; }
    this.projectId = +idParam;
    this.initializeForm();
    this.loadProjectData();
  }

  // FIXED: Changed form control name to 'teamLeaderId'
  initializeForm(): void {
    this.projectForm = this.fb.group({
      id: [this.projectId],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      problemStatement: ['', Validators.required],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      grade: [null, [Validators.min(0), Validators.max(100)]],
      teamLeaderId: ['', Validators.required], // Corrected name
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required]
    });
  }

  loadProjectData(): void {
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (projectData) => {
        this.project = projectData;
        this.pageTitle = `Edit: ${projectData.title}`;
        // FIXED: Used the correct property 'teamLeaderId'
        this.projectForm.patchValue({
             id: projectData.id,
             title: projectData.title,
             description: projectData.description,
             problemStatement: projectData.problemStatement,
             technologies: projectData.technologies,
             toolsUsed: projectData.toolsUsed,
             grade: projectData.grade,
             teamLeaderId: projectData.teamLeaderId, // Corrected property
             categoryId: projectData.category?.id,
             departmentId: projectData.department?.id
        });
      },
      error: () => this.router.navigate(['/not-found'])
    });
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    this.isSubmitting = true;

    // FIXED: The payload now uses correct property names
    const formValue = this.projectForm.value;
    const payload = {
      Id: formValue.id,
      Title: formValue.title,
      Description: formValue.description,
      Technologies: formValue.technologies,
      ToolsUsed: formValue.toolsUsed,
      ProblemStatement: formValue.problemStatement,
      // Backend Edit method expects 'LeaderId', not 'TeamLeaderId'
      LeaderId: Number(formValue.teamLeaderId),
      CategoryId: formValue.categoryId,
      DepartmentId: formValue.departmentId,
    };

    this.projectService.updateProject(payload).pipe(finalize(() => this.isSubmitting = false))
    .subscribe({
      next: () => this.router.navigate(['/ProjectDetails', this.projectId]),
      error: (err) => {
        console.error('Error updating project:', err);
        alert('Failed to update the project.');
      }
    });
  }

  onFilesSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    this.selectedFiles = element.files ? Array.from(element.files) : [];
  }

  onImageUpload(): void {
    if (this.selectedFiles.length === 0) return;
    this.isUploading = true;
    const uploadObservables = this.selectedFiles.map(file => this.projectService.uploadImage(this.projectId, file));
    forkJoin(uploadObservables).pipe(finalize(() => {
      this.isUploading = false; this.selectedFiles = [];
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    })).subscribe({ next: () => this.loadProjectData(), error: (err) => console.error('Error uploading images:', err) });
  }

  deleteImage(filename: string): void {
    if (!filename) { console.error("Filename is empty"); return; }
    if (confirm(`Are you sure you want to delete this image? (${filename})`)) {
      this.imagesBeingDeleted.add(filename);
      this.projectService.deleteImage(this.project!.id, [filename]).pipe(finalize(() => this.imagesBeingDeleted.delete(filename)))
      .subscribe({
        next: () => this.loadProjectData(),
        error: (err) => { console.error('Error deleting image:', err); alert('Failed to delete the image.'); }
      });
    }
  }

  onCancel(): void { this.router.navigate(['/ProjectDetails', this.projectId]); }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    if(element.src !== this.placeholderImage) {
        element.src = this.placeholderImage;
    }
  }
}
